

from django.core.exceptions import ObjectDoesNotExist
from datetime import date, timedelta, datetime, time
from django.db.models import Q
from django.utils import timezone
from .models import *
from django.db import transaction


# Gestion des notifications push et des rappels de rendez-vous
try:
    from .fcm import send_push
except Exception:
    # En dev sans config FCM, on laisse passer
    def send_push(tokens, title, body, data=None):
        return 0


# Service principal pour la gestion des notifications
class NotificationService:
    @staticmethod
    @transaction.atomic
    def create(user, type_, title, message, *, affaire=None, payload=None, deep_link=None, level='info', actor_user=None, send_push_now=True):
        # création de notif et envoi push fcm
        notif = Notification.objects.create(
            user=user,
            type=type_,
            title=title,
            message=message,
            payload=payload or {},
            deep_link=deep_link or {},
            level=level,
            affaire=affaire,
            actor_user=actor_user,
        )

        if send_push_now:
            tokens = list(Device.objects.filter(user=user).values_list('token', flat=True))
            if tokens:
                data = {
                    'type': type_,
                    'notification_id': str(notif.id),
                    'affaire_id': str(getattr(affaire, 'idaffaire', '')) if affaire else '',
                    'deep_link_route': (deep_link or {}).get('route', ''),
                    # Les params doivent être des strings côté FCM data
                    'deep_link_params': str((deep_link or {}).get('params', {})),
                }
                try:
                    send_push(tokens, title, message, data)
                except Exception:

                    pass

        return notif

    @staticmethod
    def send_rdv_reminder(audience, reminder_type='24h'):
        # Envoie un rappel pour un rendez-vous 24h ou 1h avant
        try:
            if not audience or not audience.idaffaire or not audience.idaffaire.idclient:
                return None
            
            client = audience.idaffaire.idclient
            user = getattr(client, 'user', None)
            if not user:
                return None
            
            # Calculer le temps restant
            now = timezone.now()
            rdv_datetime = timezone.make_aware(
                datetime.combine(audience.dateaudience, audience.heureaudience or time(9, 0))
            )
            time_diff = rdv_datetime - now
            
            if time_diff.total_seconds() <= 0:
                return None  # Rendez-vous déjà passé
            
            # message selon le type de rappel
            if reminder_type == '24h':
                if time_diff.total_seconds() > 86400:  # Plus de 24h
                    return None
                title = f"Rappel rendez-vous dans 24h"
                message = f"Votre {audience.get_type_rendez_vous_display()} est prévu demain à {audience.heureaudience.strftime('%H:%M') if audience.heureaudience else '09:00'}"
            elif reminder_type == '1h':
                if time_diff.total_seconds() > 3600:  # Plus d'1h
                    return None
                title = f"Rappel rendez-vous dans 1h"
                message = f"Votre {audience.get_type_rendez_vous_display()} est prévu dans 1 heure"
            else:
                return None
            
            # détails du lieu si disponible
            if audience.lieu:
                message += f" à {audience.lieu}"
            
            payload = {
                'idaudience': audience.idaudience,
                'idaffaire': audience.idaffaire.idaffaire,
                'type_rendez_vous': audience.type_rendez_vous,
                'date': audience.dateaudience.isoformat(),
                'heure': audience.heureaudience.isoformat() if audience.heureaudience else '',
                'lieu': audience.lieu or '',
                'reminder_type': reminder_type
            }
            
            deep_link = {
                'route': 'audiences', 
                'params': {'idaffaire': str(audience.idaffaire.idaffaire)}
            }
            
            return NotificationService.create(
                user=user,
                type_='RDV',
                title=title,
                message=message,
                affaire=audience.idaffaire,
                payload=payload,
                deep_link=deep_link,
                level='warning'
            )
            
        except Exception as e:
            print(f"Erreur lors de l'envoi du rappel: {str(e)}")
            return None

    @staticmethod
    def check_and_send_rdv_reminders():
        try:
            now = timezone.now()
            today = now.date()
            
            # Récupérer tous les rendez-vous avec rappels activés
            audiences_24h = Audience.objects.filter(
                dateaudience=today + timedelta(days=1),
                rappel_24h=True,
                statut__in=['PLANIFIE', 'CONFIRME']
            )
            
            audiences_1h = Audience.objects.filter(
                dateaudience=today,
                rappel_1h=True,
                statut__in=['PLANIFIE', 'CONFIRME']
            )
            
            # Envoyer les rappels 24h
            for audience in audiences_24h:
                NotificationService.send_rdv_reminder(audience, '24h')
            
            # Envoyer les rappels 1h
            for audience in audiences_1h:
                if audience.heureaudience:
                    # Vérifier si c'est dans la prochaine heure
                    rdv_time = datetime.combine(today, audience.heureaudience)
                    rdv_datetime = timezone.make_aware(rdv_time)
                    if 0 < (rdv_datetime - now).total_seconds() <= 3600:
                        NotificationService.send_rdv_reminder(audience, '1h')
            
            return {
                'rappels_24h_envoyes': audiences_24h.count(),
                'rappels_1h_envoyes': audiences_1h.count()
            }
            
        except Exception as e:
            print(f"Erreur lors de la vérification des rappels: {str(e)}")
            return None



# Service de classification automatique des affaires selon leur code
class ClassificationAffaireService:
    @classmethod
    def get_classification_by_code(cls, code):
        try:
            # join auto
            cat = CategorieAffaire.objects.select_related('sous_type__type_principale').get(code=code)
            return {
                "type": cat.sous_type.type_principale.libelle_fr or cat.sous_type.type_principale.libelle_ar or '',
                "categorie": cat.sous_type.libelle_fr or cat.sous_type.libelle_ar or '',
                "detail": cat.libelle_fr or cat.libelle_ar or ''
            }
        except CategorieAffaire.DoesNotExist:
            return None

    @classmethod
    def get_suggestions_by_code(cls, code):
        # suggestions basées sur code partiel
        suggestions = CategorieAffaire.objects.filter(code__startswith=code)[:10]
        return [
            {
                "code": s.code,
                "libelle": s.libelle_fr or s.libelle_ar or '',
                "categorie": s.sous_type.libelle_fr or s.sous_type.libelle_ar or '',
                "type": s.sous_type.type_principale.libelle_fr or s.sous_type.type_principale.libelle_ar or ''
            } for s in suggestions
        ]

# sugg des tribinaux selon type d'aff

class TribunalSuggestionService:

    @classmethod
    def get_tribunaux_by_type_affaire(cls, type_affaire_code):
         # selon le code du type d'affaire

        try:

            type_affaire = TypeAffairePrincipale.objects.get(code=type_affaire_code)
            
            # Logique de suggestion selon le type d'affaire
            tribunaux = cls._get_tribunaux_by_category(type_affaire.libelle_fr or type_affaire.libelle_ar or '')
            
            return {
                "type_affaire": type_affaire.libelle_fr or type_affaire.libelle_ar or '',
                "tribunaux": tribunaux
            }
        except TypeAffairePrincipale.DoesNotExist:
            return None
    
    @classmethod
    def get_tribunaux_by_classification(cls, classification_data):
        #  la classification complète

        if not classification_data:
            return None
        print("type affaire esrt ", classification_data)
        type_affaire = classification_data.get('type', '')
        tribunaux = cls._get_tribunaux_by_category(type_affaire)
        
        return {
            "classification": classification_data,
            "tribunaux": tribunaux
        }
    
    @classmethod
    def get_tribunaux_appel_by_classification(cls, classification_data):
        # Pour l'appel, retourner uniquement les cours d'appel
        if not classification_data:
            return None
            
        type_affaire = classification_data.get('type', '')
        tribunaux = cls._get_tribunaux_appel_by_category(type_affaire)
        
        return {
            "classification": classification_data,
            "tribunaux": tribunaux
        }
    
    @classmethod
    def _get_tribunaux_by_category(cls, type_affaire):

        tribunaux = []
        
        # Mapping des types d'affaires vers les types de tribunaux

        type_mapping = {
            'مدني': ['TPI', 'CA'],
            'مدني': ['TPI', 'CA'],
            'جنائي': ['TRIB_PENAL', 'CA'],
            'إدارية': ['TRIB_ADMIN', 'CA'],
            'تجاري': ['TRIB_COM', 'CA'],
            'تنفيذات': ['TPI', 'CA'],
            'تبليغات': ['TPI'],

            'مؤسسة الرئيس وغرفة المشورة': ['TPI', 'CA'],
            'مدني': ['TPI', 'CA'],
            'الأكرية': ['TPI', 'CA'],
            'العقار': ['TPI', 'CA'],
            'الاجتماعي': ['TPI', 'CA'],
            'الأحوال الشخصية': ['TPI', 'CA'],
            'قضاء القرب': ['TPI', 'CA'],
            'العمالي': ['TPI', 'CA'],
            'التحكيم': ['TPI', 'CA'],
            'الزجري': ['TRIB_PENAL', 'CA'],
            'الجنحي': ['TRIB_PENAL', 'CA'],
            'الجنائي': ['TRIB_PENAL', 'CA'],
            'الأسرة': ['TPI', 'CA'],
            'التحقيق': ['TRIB_PENAL', 'CA'],
            'النيابة العامة': ['TRIB_PENAL', 'CA'],
            'الخبرة': ['TPI', 'CA'],
            'الصلح': ['TPI', 'CA'],
            'التقادم': ['TPI', 'CA'],
            'الطعون': ['CA', 'CC'],
            'الشكايات': ['TRIB_PENAL', 'CA'],
            'المحاضر': ['TRIB_PENAL', 'CA'],
            'المحاكم الإدارية': ['TRIB_ADMIN', 'CA'],
            'محاكم الاستئناف الإدارية': ['TRIB_ADMIN', 'CA'],
            'التبليغ': ['TPI'],
            'التنفيذ': ['TPI', 'CA'],
            'شعبة الإستعجالي': ['TPI', 'CA'],
            'شعبة الموضوع': ['TPI', 'CA'],
            'شعبة صعوبات المقاولة': ['TRIB_COM', 'CA'],
        }
        
        # le type de tribunal selon le type d'affaire par defaut tpi et ca
        tribunal_types = type_mapping.get(type_affaire, ['TPI', 'CA'])

        # Récupérer les tribunaux correspondants
        for tribunal_type in tribunal_types:
            try:
                # equivalent à :
                # SELECT * FROM type_tribunal WHERE code_type = 'TPI';
                # SELECT * FROM tribunal WHERE idtypetribunal_id = 1;
                type_tribunal = TypeTribunal.objects.get(code_type=tribunal_type)
                tribunaux_du_type = Tribunal.objects.filter(idtypetribunal=type_tribunal)
                print(type_tribunal, "  typesss ", tribunaux_du_type)
                for tribunal in tribunaux_du_type:
                    tribunaux.append({
                        'id': tribunal.idtribunal,
                        'nom_ar': tribunal.nomtribunal_ar or '',
                        'nom_fr': tribunal.nomtribunal_fr or '',
                        'ville_fr': tribunal.villetribunal_fr or '',
                        'ville_ar': tribunal.villetribunal_ar or '',
                        'type': tribunal.idtypetribunal.libelletypetribunal_fr or tribunal.idtypetribunal.libelletypetribunal_ar or '',
                        'niveau': tribunal.idtypetribunal.niveau,
                        'adresse_fr': tribunal.adressetribunal_fr or '',
                        'adresse_ar': tribunal.adressetribunal_ar or '',
                        'telephone': tribunal.telephonetribunal
                    })
            except TypeTribunal.DoesNotExist:
                print("eroooore ",TypeTribunal)
                continue
        
        return tribunaux

    @classmethod
    def _get_tribunaux_appel_by_category(cls, type_affaire):
        # Pour l'appel, retourner uniquement les cours d'appel (CA)
        tribunaux = []
        
        try:
            # Récupérer uniquement les cours d'appel
            type_tribunal = TypeTribunal.objects.get(code_type='CA')
            tribunaux_appel = Tribunal.objects.filter(idtypetribunal=type_tribunal)
            
            for tribunal in tribunaux_appel:
                tribunaux.append({
                    'id': tribunal.idtribunal,
                    'nom': tribunal.nomtribunal_fr or tribunal.nomtribunal_ar or '',
                    'ville': tribunal.villetribunal_fr or tribunal.villetribunal_ar or '',
                    'type': tribunal.idtypetribunal.libelletypetribunal_fr or tribunal.idtypetribunal.libelletypetribunal_ar or '',
                    'niveau': tribunal.idtypetribunal.niveau,
                    'adresse': tribunal.adressetribunal_fr or tribunal.adressetribunal_ar or '',
                    'telephone': tribunal.telephonetribunal
                })
        except TypeTribunal.DoesNotExist:
            pass
        
        return tribunaux
    
    @classmethod
    def get_villes_disponibles(cls, tribunaux):
         # la liste des villes disponibles pour les tribunaux suggérés
        villes = set()
        for tribunal in tribunaux:
            if tribunal.get('ville'):
                villes.add(tribunal['ville'])
        return sorted(list(villes))
    
    @classmethod
    def filter_tribunaux_by_ville(cls, tribunaux, ville):

        return [t for t in tribunaux if t.get('ville') == ville]


# services etapes
# Services de gestion des étapes judiciaires et du workflow des affaires

# obtenir les étapes de la phase initiale selon le rôle du client
def get_etapes_phase_initiale(affaire):
    #  le rôle du client
    role_client = get_role_client_from_fonction(affaire)
    
    # Classification de l'affaire
    classification = ClassificationAffaireService.get_classification_by_code(affaire.code_dossier) if affaire.code_dossier else None
    
    # DEBUG: Afficher la classification
    print(f"🔍 DEBUG get_etapes_phase_initiale:")
    print(f"   Code dossier: {affaire.code_dossier}")
    print(f"   Classification: {classification}")
    print(f"   Rôle client: {role_client}")
    
    #  Détection pénale par code dossier
    is_penal_by_code = False
    if affaire.code_dossier:
        code = affaire.code_dossier.upper()
        # Codes pénaux: 2, 3, 4, PEN, PENAL
        if (code.startswith('2') or code.startswith('3') or code.startswith('4') or 
            'PEN' in code or 'PENAL' in code):
            is_penal_by_code = True
            print(f"#printDétecté comme pénal par code: {code}")
    
    if role_client == "demandeur":
        # Étapes pour le demandeur
        if (classification and classification.get('type') == 'PENAL') or is_penal_by_code:
            # Affaires pénales : étapes spécialisées
            etapes_base = [
                { 'libelle_ar': "شكاية", 'obligatoire': True, 'delai': 30, 'optionnel': False }
            ]
        elif classification and classification.get('type') == 'COMMERCIAL':
            # Affaires commerciales : avertissement optionnel, demande directe
            etapes_base = [
                { 'libelle_ar': "إنجاز إنذار", 'obligatoire': False, 'delai': 15, 'optionnel': True },
                { 'libelle_ar': "تقديم الشكاية", 'obligatoire': True, 'delai': 30, 'optionnel': False },
                { 'libelle_ar': "تقديم الدعوى مباشرة", 'obligatoire': True, 'delai': 45, 'optionnel': False }
            ]
        else:
            # Affaires civiles : avertissement optionnel
            etapes_base = [
                { 'libelle_ar': "إنجاز إنذار", 'obligatoire': False, 'delai': 15, 'optionnel': True },
                { 'libelle_ar': "تقديم الشكاية", 'obligatoire': True, 'delai': 30, 'optionnel': False },
                { 'libelle_ar': "تقديم الدعوى مباشرة", 'obligatoire': False, 'delai': 45, 'optionnel': True }
            ]
            
    else:  # opposant
        # Étapes pour l'opposant
        if (classification and classification.get('type') == 'PENAL') or is_penal_by_code:
            # Affaires pénales : étapes spécialisées
            etapes_base = [
                { 'libelle_ar': "استدعاء أو اعتقال", 'obligatoire': True, 'delai': 15, 'optionnel': False }
            ]
        else:
            # Affaires civiles/commerciales : avertissement optionnel
            etapes_base = [
                { 'libelle_ar': "استلام إنذار", 'obligatoire': False, 'delai': 15, 'optionnel': True },
                { 'libelle_ar': "استلام شكاية", 'obligatoire': True, 'delai': 45, 'optionnel': False },
                { 'libelle_ar': "استدعاء للمثول", 'obligatoire': True, 'delai': 30, 'optionnel': False }
            ]

    # maj le champ optionnel
    for etape in etapes_base:
        etape['optionnel'] = not etape['obligatoire']
        etape['recommandee'] = not etape['obligatoire']  # Pour l'interface
        
    return etapes_base


# Fonction pour obtenir les étapes de la phase procédure selon le rôle du client
def get_etapes_phase_procedure(affaire):
    role_client = get_role_client_from_fonction(affaire)
    # Classification de l'affaire
    classification = ClassificationAffaireService.get_classification_by_code(affaire.code_dossier) if affaire.code_dossier else None
    
    # DEBUG: Afficher la classification
    print(f"🔍 DEBUG get_etapes_phase_procedure:")
    print(f"   Code dossier: {affaire.code_dossier}")
    print(f"   Classification: {classification}")
    print(f"   Rôle client: {role_client}")
    
    # Détection pénale par code dossier
    is_penal_by_code = False
    if affaire.code_dossier:
        code = affaire.code_dossier.upper()
        # Codes pénaux: 2, 3, 4, PEN, PENAL
        if (code.startswith('2') or code.startswith('3') or code.startswith('4') or 
            'PEN' in code or 'PENAL' in code):
            is_penal_by_code = True
            print(f"#printDétecté comme pénal par code: {code}")
    
    # Gestion spéciale pour les affaires pénales
    if (classification and classification.get('type') == 'PENAL') or is_penal_by_code:
        if role_client == "demandeur":
            return [
                ("التحقيق الأولي", 60),
                ("قرار النيابة العامة", 30),
                ("جلسة المحاكمة", 45)
            ]
        else:  # opposant
            return [
                ("جلسة ودفاع", 60)
            ]
    
    # Logique normale pour les autres types d'affaires
    if role_client == "demandeur":
        return [
            ("أول جلسة", 60),
            ("تبليغ الاستدعاء", 75),
            ("جلسات", 90),
            ("مداولة", 105),
            ("حكم", 120)
        ]
    else:  # opposant
        return [
            ("تقديم تمثيل", 60),
            ("رد على المقال", 75),
            ("مداولة", 90),
            ("جلسات", 105),
            ("حكم", 120)
        ]


# Fonction pour déterminer automatiquement le rôle du client selon sa fonction
def get_role_client_from_fonction(affaire):
    if not affaire.idfonctionclient:
        return 'demandeur'  # Par défaut
    
    try:
        fonction = affaire.idfonctionclient.libellefonction.lower()
        
        # Mapping des fonctions vers les rôles
        if 'demandeur' in fonction or 'plaignant' in fonction or 'requérant' in fonction:
            return 'demandeur'
        elif 'opposant' in fonction or 'défendeur' in fonction or 'accusé' in fonction or 'mis en cause' in fonction:
            return 'opposant'
        else:
            return 'demandeur'  # Par défaut
    except AttributeError:
        return 'demandeur'  # Par défaut si erreur

# Fonction pour déterminer l'étape actuelle selon la phase du processus
def get_etape_actuelle_par_phase(affaire):

    if hasattr(affaire, 'etape_actuelle') and affaire.etape_actuelle:
        return affaire.etape_actuelle
    

    phase = getattr(affaire, 'phase_processus', 'INITIALE')
    
    if phase == 'INITIALE':
        return get_etape_actuelle_initiale(affaire)
    elif phase == 'PROCEDURE':
        return get_etape_actuelle_procedure(affaire)
    elif phase == 'APPEL':
        return get_etape_actuelle_appel(affaire)
    elif phase == 'EXECUTION':
        return get_etape_actuelle_execution(affaire)
    else:
        return None


# Fonction pour déterminer l'étape actuelle en phase initiale
def get_etape_actuelle_initiale(affaire):
    etapes_phase = get_etapes_phase_initiale(affaire)
    role_client = get_role_client_from_fonction(affaire)

    for i, etape_data in enumerate(etapes_phase):
        libelle_etape = etape_data['libelle_ar']
        
        #  trouver une étape existante avec le bon type
        etape = Etapejudiciaire.objects.filter(
            idaffaire=affaire,
            idtypeetape__libelletypeetape=libelle_etape
        ).first()

        if etape and not etape.statutetape_set.filter(
                libellestatutetape='Terminee'
        ).exists():
            return etape
        
        # Si aucune étape n'existe, créer
        if not etape:
            # Chercher le type d'étape correspondant
            from api.models import TypeEtape
            type_etape = TypeEtape.objects.filter(
                libelletypeetape=libelle_etape
            ).first()
            
            if type_etape:
                # Créer l'étape
                from datetime import date
                etape = Etapejudiciaire.objects.create(
                    idetape=f"etape_{i}_{affaire.idaffaire}_{hash(libelle_etape)}",
                    datedebut=date.today(),
                    idaffaire=affaire,
                    idtypeetape=type_etape,
                    delai_legal=etape_data.get('delai', 30),
                    ordre_etape=i,
                    etape_obligatoire=etape_data.get('obligatoire', True)
                )
                print(f"✅ Étape créée: {etape.idetape} avec type: {libelle_etape} (rôle: {role_client})")
                return etape
            else:
                print(f"❌ Type d'étape non trouvé pour: {libelle_etape} (rôle: {role_client})")

    return None


# Fonction pour déterminer l'étape actuelle en phase procédure
def get_etape_actuelle_procedure(affaire):
    etapes_phase = get_etapes_phase_procedure(affaire)
    role_client = get_role_client_from_fonction(affaire)

    for i, (libelle_etape, delai) in enumerate(etapes_phase):
        etape = Etapejudiciaire.objects.filter(
            idaffaire=affaire,
            idtypeetape__libelletypeetape=libelle_etape
        ).first()

        if etape and not etape.statutetape_set.filter(
                libellestatutetape='Terminee'
        ).exists():
            return etape
        
        # Si aucune étape n'existe, créer
        if not etape:
            # Chercher le type d'étape correspondant
            from api.models import TypeEtape
            type_etape = TypeEtape.objects.filter(
                libelletypeetape=libelle_etape
            ).first()
            
            if type_etape:
                # Créer l'étape
                from datetime import date
                etape = Etapejudiciaire.objects.create(
                    idetape=f"etape_proc_{i}_{affaire.idaffaire}_{hash(libelle_etape)}",
                    datedebut=date.today(),
                    idaffaire=affaire,
                    idtypeetape=type_etape,
                    delai_legal=delai,
                    ordre_etape=i,
                    etape_obligatoire=True
                )
                print(f"Étape procédure créée: {etape.idetape} avec type: {libelle_etape} (rôle: {role_client})")
                return etape
            else:
                print(f"Type d'étape non trouvé pour: {libelle_etape} (rôle: {role_client})")

    return None


# Fonction pour déterminer l'étape actuelle en phase appel
def get_etape_actuelle_appel(affaire):
    return None


# Fonction pour déterminer l'étape actuelle en phase exécution
def get_etape_actuelle_execution(affaire):

    role_client = get_role_client_from_fonction(affaire)
    
    # Classification de l'affaire
    classification = ClassificationAffaireService.get_classification_by_code(affaire.code_dossier) if affaire.code_dossier else None
    
    # DEBUG: Afficher la classification
    print(f"DEBUG get_etape_actuelle_execution:")
    print(f"   Code dossier: {affaire.code_dossier}")
    print(f"   Classification: {classification}")
    print(f"   Rôle client: {role_client}")
    
    # Détection pénale par code dossier
    is_penal_by_code = False
    if affaire.code_dossier:
        code = affaire.code_dossier.upper()
        # Codes pénaux: 2, 3, 4, PEN, PENAL
        if (code.startswith('2') or code.startswith('3') or code.startswith('4') or 
            'PEN' in code or 'PENAL' in code):
            is_penal_by_code = True
            print(f"#printDétecté comme pénal par code: {code}")
    
    if (classification and classification.get('type') == 'PENAL') or is_penal_by_code:
        if role_client == "demandeur":
            libelle_etape = "تنفيذ القرار"  # Exécution de la décision
        else:  # opposant
            libelle_etape = "تنفيذ الحكم"   # Exécution du jugement
        
        # Chercher l'étape existante
        etape = Etapejudiciaire.objects.filter(
            idaffaire=affaire,
            idtypeetape__libelletypeetape=libelle_etape
        ).first()

        if etape and not etape.statutetape_set.filter(
                libellestatutetape='Terminee'
        ).exists():
            return etape
        
        # Si aucune étape n'existe créer
        if not etape:
            from api.models import TypeEtape
            type_etape = TypeEtape.objects.filter(
                libelletypeetape=libelle_etape
            ).first()
            
            if type_etape:
                from datetime import date
                etape = Etapejudiciaire.objects.create(
                    idetape=f"etape_exec_{affaire.idaffaire}_{hash(libelle_etape)}",
                    datedebut=date.today(),
                    idaffaire=affaire,
                    idtypeetape=type_etape,
                    delai_legal=30,
                    ordre_etape=0,
                    etape_obligatoire=True
                )
                print(f"Étape exécution créée: {etape.idetape} avec type: {libelle_etape} (rôle: {role_client})")
                return etape
            else:
                print(f"Type d'étape non trouvé pour: {libelle_etape} (rôle: {role_client})")

    return None


# Fonction pour avancer automatiquement dans le workflow des étapes
def avancer_etape(affaire):
    if affaire.etape_actuelle:
        # Terminer l'étape actuelle
        etape_actuelle = affaire.etape_actuelle
        etape_actuelle.date_fin_effective = date.today()
        etape_actuelle.save()

        # Créer le statut terminé
        StatutEtape.objects.create(
            idetape=etape_actuelle,
            libellestatutetape='Terminee',
            datedebut=date.today()
        )

        # Passer à l'étape suivante
        etape_suivante = Etapejudiciaire.objects.filter(
            idaffaire=affaire,
            ordre_etape__gt=etape_actuelle.ordre_etape
        ).order_by('ordre_etape').first()

        if etape_suivante:
            affaire.etape_actuelle = etape_suivante
            affaire.save()

            # Créer le statut en cours
            StatutEtape.objects.create(
                idetape=etape_suivante,
                libellestatutetape='En cours',
                datedebut=date.today()
            )

            return etape_suivante
        else:
            # Toutes les étapes sont terminées
            affaire.phase_processus = 'EXECUTION'
            affaire.save()
            return None


# Fonction pour terminer l'étape actuelle et passer à la suivante
def terminer_etape(affaire):
    if affaire.etape_actuelle:
        # Marquer l'étape actuelle comme terminée
        statut = StatutEtape.objects.create(
            idetape=affaire.etape_actuelle,
            libellestatutetape='Terminee',
            datedebut=date.today()
        )

        # Passer à l'étape suivante
        return avancer_etape(affaire)
    return None


# Fonction pour obtenir la progression complète de la phase actuelle
def get_progression_phase(affaire):
    if affaire.phase_processus == 'INITIALE':
        etapes_phase = get_etapes_phase_initiale(affaire)
    elif affaire.phase_processus == 'PROCEDURE':
        etapes_phase = get_etapes_phase_procedure(affaire)
    else:
        return []

    progression = []
    for etape_data in etapes_phase:
        # Gérer les deux formats : dictionnaire (phase initiale) et tuple (phase procédure)
        if isinstance(etape_data, dict):
            # Phase initiale : format dictionnaire
            libelle_etape = etape_data['libelle_ar']
            delai = etape_data['delai']
        elif isinstance(etape_data, tuple):
            # Phase procédure : format tuple (libelle, delai)
            libelle_etape = etape_data[0]
            delai = etape_data[1]
        else:
            continue  # Ignorer les formats non reconnus
            
        etape = Etapejudiciaire.objects.filter(
            idaffaire=affaire,
            idtypeetape__libelletypeetape=libelle_etape
        ).first()

        if etape:
            statut_actuel = etape.statutetape_set.filter(
                datefin__isnull=True
            ).first()

            etape_actuelle = get_etape_actuelle_par_phase(affaire)
            progression.append({
                'etape_id': etape.idetape,
                'libelle': libelle_etape,
                'delai': delai,
                'statut': statut_actuel.libellestatutetape if statut_actuel else 'En attente',
                'terminee': statut_actuel and statut_actuel.libellestatutetape == 'Terminee',
                'actuelle': etape_actuelle and etape.idetape == etape_actuelle.idetape
            })

    return progression


# Fonction pour synchroniser le statut avec la phase du workflow
def synchroniser_statut_phase(affaire):
    mapping_statut_phase = {
        'Enregistrée': 'INITIALE',
        'En cours d\'instruction': 'INITIALE',
        'En instance': 'PROCEDURE',
        'Jugée': 'PROCEDURE',
        'En appel': 'APPEL',
        'En cassation': 'APPEL',
        'Classée sans suite': 'EXECUTION',
        'Suspendue': 'INITIALE'
    }

    if affaire.idstatutaffaire:
        statut = affaire.idstatutaffaire.libellestatutaffaire
        if statut in mapping_statut_phase:
            affaire.phase_processus = mapping_statut_phase[statut]
            affaire.save()





# Fonction pour obtenir les étapes de la phase procédure selon le rôle du client

def get_etapes_phase_procedure(affaire):

    role_client = get_role_client_from_fonction(affaire)

    # Classification de l'affaire

    classification = ClassificationAffaireService.get_classification_by_code(affaire.code_dossier) if affaire.code_dossier else None

    

    # DEBUG: Afficher la classification

    print(f"🔍 DEBUG get_etapes_phase_procedure:")

    print(f"   Code dossier: {affaire.code_dossier}")

    print(f"   Classification: {classification}")

    print(f"   Rôle client: {role_client}")

    

    # Détection pénale par code dossier

    is_penal_by_code = False

    if affaire.code_dossier:

        code = affaire.code_dossier.upper()

        # Codes pénaux: 2, 3, 4, PEN, PENAL

        if (code.startswith('2') or code.startswith('3') or code.startswith('4') or 

            'PEN' in code or 'PENAL' in code):

            is_penal_by_code = True

            print(f"#printDétecté comme pénal par code: {code}")

    

    # Gestion spéciale pour les affaires pénales

    if (classification and classification.get('type') == 'PENAL') or is_penal_by_code:

        if role_client == "demandeur":

            return [

                ("التحقيق الأولي", 60),

                ("قرار النيابة العامة", 30),

                ("جلسة المحاكمة", 45)

            ]

        else:  # opposant

            return [

                ("جلسة ودفاع", 60)

            ]

    

    # Logique normale pour les autres types d'affaires

    if role_client == "demandeur":

        return [

            ("أول جلسة", 60),

            ("تبليغ الاستدعاء", 75),

            ("جلسات", 90),

            ("مداولة", 105),

            ("حكم", 120)

        ]

    else:  # opposant

        return [

            ("تقديم تمثيل", 60),

            ("رد على المقال", 75),

            ("مداولة", 90),

            ("جلسات", 105),

            ("حكم", 120)

        ]





# Fonction pour déterminer automatiquement le rôle du client selon sa fonction

def get_role_client_from_fonction(affaire):

    if not affaire.idfonctionclient:

        return 'demandeur'  # Par défaut

    

    try:

        fonction = affaire.idfonctionclient.libellefonction.lower()

        

        # Mapping des fonctions vers les rôles

        if 'demandeur' in fonction or 'plaignant' in fonction or 'requérant' in fonction:

            return 'demandeur'

        elif 'opposant' in fonction or 'défendeur' in fonction or 'accusé' in fonction or 'mis en cause' in fonction:

            return 'opposant'

        else:

            return 'demandeur'  # Par défaut

    except AttributeError:

        return 'demandeur'  # Par défaut si erreur



# Fonction pour déterminer l'étape actuelle selon la phase du processus

def get_etape_actuelle_par_phase(affaire):



    if hasattr(affaire, 'etape_actuelle') and affaire.etape_actuelle:

        return affaire.etape_actuelle

    



    phase = getattr(affaire, 'phase_processus', 'INITIALE')

    

    if phase == 'INITIALE':

        return get_etape_actuelle_initiale(affaire)

    elif phase == 'PROCEDURE':

        return get_etape_actuelle_procedure(affaire)

    elif phase == 'APPEL':

        return get_etape_actuelle_appel(affaire)

    elif phase == 'EXECUTION':

        return get_etape_actuelle_execution(affaire)

    else:

        return None





# Fonction pour déterminer l'étape actuelle en phase initiale

def get_etape_actuelle_initiale(affaire):

    etapes_phase = get_etapes_phase_initiale(affaire)

    role_client = get_role_client_from_fonction(affaire)



    for i, etape_data in enumerate(etapes_phase):

        libelle_etape = etape_data['libelle_ar']

        

        #  trouver une étape existante avec le bon type

        etape = Etapejudiciaire.objects.filter(

            idaffaire=affaire,

            idtypeetape__libelletypeetape=libelle_etape

        ).first()



        if etape and not etape.statutetape_set.filter(

                libellestatutetape='Terminee'

        ).exists():

            return etape

        

        # Si aucune étape n'existe, créer

        if not etape:

            # Chercher le type d'étape correspondant

            from api.models import TypeEtape

            type_etape = TypeEtape.objects.filter(

                libelletypeetape=libelle_etape

            ).first()

            

            if type_etape:

                # Créer l'étape

                from datetime import date

                etape = Etapejudiciaire.objects.create(

                    idetape=f"etape_{i}_{affaire.idaffaire}_{hash(libelle_etape)}",

                    datedebut=date.today(),

                    idaffaire=affaire,

                    idtypeetape=type_etape,

                    delai_legal=etape_data.get('delai', 30),

                    ordre_etape=i,

                    etape_obligatoire=etape_data.get('obligatoire', True)

                )

                print(f"Étape créée: {etape.idetape} avec type: {libelle_etape} (rôle: {role_client})")

                return etape

            else:

                print(f"Type d'étape non trouvé pour: {libelle_etape} (rôle: {role_client})")



    return None





# Fonction pour déterminer l'étape actuelle en phase procédure

def get_etape_actuelle_procedure(affaire):

    etapes_phase = get_etapes_phase_procedure(affaire)

    role_client = get_role_client_from_fonction(affaire)



    for i, (libelle_etape, delai) in enumerate(etapes_phase):

        etape = Etapejudiciaire.objects.filter(

            idaffaire=affaire,

            idtypeetape__libelletypeetape=libelle_etape

        ).first()



        if etape and not etape.statutetape_set.filter(

                libellestatutetape='Terminee'

        ).exists():

            return etape

        

        # Si aucune étape n'existe, créer

        if not etape:

            # Chercher le type d'étape correspondant

            from api.models import TypeEtape

            type_etape = TypeEtape.objects.filter(

                libelletypeetape=libelle_etape

            ).first()

            

            if type_etape:

                # Créer l'étape

                from datetime import date

                etape = Etapejudiciaire.objects.create(

                    idetape=f"etape_proc_{i}_{affaire.idaffaire}_{hash(libelle_etape)}",

                    datedebut=date.today(),

                    idaffaire=affaire,

                    idtypeetape=type_etape,

                    delai_legal=delai,

                    ordre_etape=i,

                    etape_obligatoire=True

                )

                print(f"Étape procédure créée: {etape.idetape} avec type: {libelle_etape} (rôle: {role_client})")

                return etape

            else:

                print(f"❌ Type d'étape non trouvé pour: {libelle_etape} (rôle: {role_client})")



    return None





# Fonction pour déterminer l'étape actuelle en phase appel

def get_etape_actuelle_appel(affaire):

    return None





# Fonction pour déterminer l'étape actuelle en phase exécution

def get_etape_actuelle_execution(affaire):



    role_client = get_role_client_from_fonction(affaire)

    

    # Classification de l'affaire

    classification = ClassificationAffaireService.get_classification_by_code(affaire.code_dossier) if affaire.code_dossier else None

    

    # DEBUG: Afficher la classification

    print(f"🔍 DEBUG get_etape_actuelle_execution:")

    print(f"   Code dossier: {affaire.code_dossier}")

    print(f"   Classification: {classification}")

    print(f"   Rôle client: {role_client}")

    

    # Détection pénale par code dossier

    is_penal_by_code = False

    if affaire.code_dossier:

        code = affaire.code_dossier.upper()

        # Codes pénaux: 2, 3, 4, PEN, PENAL

        if (code.startswith('2') or code.startswith('3') or code.startswith('4') or 

            'PEN' in code or 'PENAL' in code):

            is_penal_by_code = True

            print(f"#printDétecté comme pénal par code: {code}")

    

    if (classification and classification.get('type') == 'PENAL') or is_penal_by_code:

        if role_client == "demandeur":

            libelle_etape = "تنفيذ القرار"  # Exécution de la décision

        else:  # opposant

            libelle_etape = "تنفيذ الحكم"   # Exécution du jugement

        

        # Chercher l'étape existante

        etape = Etapejudiciaire.objects.filter(

            idaffaire=affaire,

            idtypeetape__libelletypeetape=libelle_etape

        ).first()



        if etape and not etape.statutetape_set.filter(

                libellestatutetape='Terminee'

        ).exists():

            return etape

        

        # Si aucune étape n'existe créer

        if not etape:

            from api.models import TypeEtape

            type_etape = TypeEtape.objects.filter(

                libelletypeetape=libelle_etape

            ).first()

            

            if type_etape:

                from datetime import date

                etape = Etapejudiciaire.objects.create(

                    idetape=f"etape_exec_{affaire.idaffaire}_{hash(libelle_etape)}",

                    datedebut=date.today(),

                    idaffaire=affaire,

                    idtypeetape=type_etape,

                    delai_legal=30,

                    ordre_etape=0,

                    etape_obligatoire=True

                )

                print(f"Étape exécution créée: {etape.idetape} avec type: {libelle_etape} (rôle: {role_client})")

                return etape

            else:

                print(f"Type d'étape non trouvé pour: {libelle_etape} (rôle: {role_client})")



    return None





# Fonction pour avancer automatiquement dans le workflow des étapes

def avancer_etape(affaire):

    if affaire.etape_actuelle:

        # Terminer l'étape actuelle

        etape_actuelle = affaire.etape_actuelle

        etape_actuelle.date_fin_effective = date.today()

        etape_actuelle.save()



        # Créer le statut terminé

        StatutEtape.objects.create(

            idetape=etape_actuelle,

            libellestatutetape='Terminee',

            datedebut=date.today()

        )



        # Passer à l'étape suivante

        etape_suivante = Etapejudiciaire.objects.filter(

            idaffaire=affaire,

            ordre_etape__gt=etape_actuelle.ordre_etape

        ).order_by('ordre_etape').first()



        if etape_suivante:

            affaire.etape_actuelle = etape_suivante

            affaire.save()



            # Créer le statut en cours

            StatutEtape.objects.create(

                idetape=etape_suivante,

                libellestatutetape='En cours',

                datedebut=date.today()

            )



            return etape_suivante

        else:

            # Toutes les étapes sont terminées

            affaire.phase_processus = 'EXECUTION'

            affaire.save()

            return None





# Fonction pour terminer l'étape actuelle et passer à la suivante

def terminer_etape(affaire):

    if affaire.etape_actuelle:

        # Marquer l'étape actuelle comme terminée

        statut = StatutEtape.objects.create(

            idetape=affaire.etape_actuelle,

            libellestatutetape='Terminee',

            datedebut=date.today()

        )



        # Passer à l'étape suivante

        return avancer_etape(affaire)

    return None





# Fonction pour obtenir la progression complète de la phase actuelle

def get_progression_phase(affaire):

    if affaire.phase_processus == 'INITIALE':

        etapes_phase = get_etapes_phase_initiale(affaire)

    elif affaire.phase_processus == 'PROCEDURE':

        etapes_phase = get_etapes_phase_procedure(affaire)

    else:

        return []



    progression = []

    for etape_data in etapes_phase:

        # Gérer les deux formats : dictionnaire (phase initiale) et tuple (phase procédure)

        if isinstance(etape_data, dict):

            # Phase initiale : format dictionnaire

            libelle_etape = etape_data['libelle_ar']

            delai = etape_data['delai']

        elif isinstance(etape_data, tuple):

            # Phase procédure : format tuple (libelle, delai)

            libelle_etape = etape_data[0]

            delai = etape_data[1]

        else:

            continue  # Ignorer les formats non reconnus

            

        etape = Etapejudiciaire.objects.filter(

            idaffaire=affaire,

            idtypeetape__libelletypeetape=libelle_etape

        ).first()



        if etape:

            statut_actuel = etape.statutetape_set.filter(

                datefin__isnull=True

            ).first()



            etape_actuelle = get_etape_actuelle_par_phase(affaire)

            progression.append({

                'etape_id': etape.idetape,

                'libelle': libelle_etape,

                'delai': delai,

                'statut': statut_actuel.libellestatutetape if statut_actuel else 'En attente',

                'terminee': statut_actuel and statut_actuel.libellestatutetape == 'Terminee',

                'actuelle': etape_actuelle and etape.idetape == etape_actuelle.idetape

            })



    return progression





# Fonction pour synchroniser le statut avec la phase du workflow

def synchroniser_statut_phase(affaire):

    mapping_statut_phase = {

        'Enregistrée': 'INITIALE',

        'En cours d\'instruction': 'INITIALE',

        'En instance': 'PROCEDURE',

        'Jugée': 'PROCEDURE',

        'En appel': 'APPEL',

        'En cassation': 'APPEL',

        'Classée sans suite': 'EXECUTION',

        'Suspendue': 'INITIALE'

    }



    if affaire.idstatutaffaire:

        statut = affaire.idstatutaffaire.libellestatutaffaire

        if statut in mapping_statut_phase:

            affaire.phase_processus = mapping_statut_phase[statut]

            affaire.save()
