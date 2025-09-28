
# Les serializers convertissent les modèles Django en JSON et vice versa pour l'API

from rest_framework import serializers
from .models import *
from .models import TypeAffaire, StatutAffaire
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


def get_localized_value(obj, field_base, lang, default=""):
    field_name = f"{field_base}_{lang}"
    return getattr(obj, field_name, default)


# Serializer pour les contrats avec gestion des fichiers
class ContratSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()
    nom_fichier = serializers.SerializerMethodField()
    client_id = serializers.IntegerField(source='idclient.idclient', read_only=True)
    client_nom = serializers.CharField(source='idclient.nomclient_fr', read_only=True, required=False, allow_null=True)
    doc_type = serializers.SerializerMethodField()
    
    class Meta:
        model = Contrat
        fields = ['idcontrat', 'fichier', 'url', 'nom_fichier', 'client_id', 'client_nom', 'doc_type']

    def get_url(self, obj):
        request = self.context.get('request') if hasattr(self, 'context') else None
        if request and getattr(obj, 'fichier', None):
            try:
                return request.build_absolute_uri(obj.fichier.url)
            except Exception:
                return None
        return None

    def get_nom_fichier(self, obj):
        if obj.fichier:
            return obj.fichier.name.split('/')[-1] if '/' in obj.fichier.name else obj.fichier.name
        return f"Contrat_{obj.idcontrat}"

    def get_doc_type(self, obj):
        # Indique que cet objet est un contrat pour l'UI unifiée
        return 'CONTRAT'



# Serializer pour le profil client avec gestion des types (société/particulier)
class ClientProfileSerializer(serializers.ModelSerializer):
    contrat = serializers.SerializerMethodField()
    type_client = serializers.SerializerMethodField()
    type_societe = serializers.SerializerMethodField()
    username = serializers.CharField(source='user.username', read_only=True)
    preferred_language = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = Client
        fields = [
            'idclient', 'username', 'nomclient_fr', 'nomclient_ar', 'prenomclient_fr', 'prenomclient_ar', 'email',
            'numtel1', 'numtel2', 'adresse1_fr', 'adresse1_ar', 'adresse2_fr', 'adresse2_ar',
            'reference_client', 'raison_sociale_fr', 'raison_sociale_ar', 'idtypesociete',
            'type_client', 'type_societe', 'contrat', 'preferred_language'
        ]

    def get_type_client(self, obj):
        if not obj.idtypeclient:
            return None
        # Retourner l'objet type complet pour que le frontend puisse accéder aux champs fr et ar
        return {
            'idtypeclient': obj.idtypeclient.idtypeclient,
            'libelletypeclient_fr': obj.idtypeclient.libelletypeclient_fr,
            'libelletypeclient_ar': obj.idtypeclient.libelletypeclient_ar,
            'libelletypeclient': obj.idtypeclient.libelletypeclient_fr or obj.idtypeclient.libelletypeclient_ar or ''
        }

    def get_type_societe(self, obj):
        if not obj.idtypesociete:
            return None
        return {
            'idtypesociete': obj.idtypesociete.idtypesociete,
            'libelletypesociete_fr': obj.idtypesociete.libelletypesociete_fr,
            'libelletypesociete_ar': obj.idtypesociete.libelletypesociete_ar,
            'libelletypesociete': obj.idtypesociete.libelletypesociete_fr or obj.idtypesociete.libelletypesociete_ar or ''
        }

    def get_contrat(self, obj):
        if obj.idtypeclient:
            # Vérifier si c'est une société (comparaison insensible à la casse pour les deux langues)
            type_fr = (obj.idtypeclient.libelletypeclient_fr or "").lower().strip()
            type_ar = (obj.idtypeclient.libelletypeclient_ar or "").lower().strip()
            
            is_societe = (type_fr == 'société' or type_ar == 'شركة')
            
            if is_societe:
                contrat = Contrat.objects.filter(idclient=obj).first()
                if contrat:
                    return ContratSerializer(contrat, context=self.context).data
        return None




#limiter l'acces aux stuff
# Serializer personnalisé pour l'authentification JWT avec informations staff
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['is_staff'] = user.is_staff
        token['username'] = user.username
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['is_staff'] = self.user.is_staff
        data['username'] = self.user.username
        return data


# Serializer pour les fonctions des clients (rôle dans l'affaire)
class FonctionClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = FonctionClient
        fields = '__all__'

# Serializer pour les opposants dans une affaire
class OpposantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Opposant
        fields = '__all__'

# Serializer de base pour les clients
class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = '__all__'


class TypeSocieteSerializer(serializers.ModelSerializer):
    class Meta:
        model = TypeSociete
        fields = '__all__'

# Serializer principal pour les affaires judiciaires avec champs calculés
class AffairejudiciaireSerializer(serializers.ModelSerializer):
    statut_courant = serializers.SerializerMethodField()
    role_client_libelle = serializers.SerializerMethodField()
    type_affaire_libelle = serializers.SerializerMethodField()
    client_nom = serializers.SerializerMethodField()
    dossier_complet = serializers.ReadOnlyField()
    avocat_demandeur_nom = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    etape_actuelle = serializers.SerializerMethodField()
    prochaine_audience = serializers.SerializerMethodField()
    

    class Meta:
        model = Affairejudiciaire
        fields = '__all__'
        #  champ  pour le role
        extra_fields = ['role_client_libelle', 'type_affaire_libelle', 'dossier_complet', 'client_nom', 'statut_courant', 'avocat_demandeur_nom', 'prochaine_audience']

    def get_statut_courant(self, obj):
        statut = StatutAffaire.objects.filter(idaffaire=obj, datefin__isnull=True).order_by('-datedebut').first()
        return statut.libellestatutaffaire if statut else "Non défini"

    def get_role_client_libelle(self, obj):
        if obj.idfonctionclient:
            return obj.idfonctionclient.libellefonction_fr
        return "Non défini"

    def get_type_affaire_libelle(self, obj):
        # Priorité 1: Utiliser la classification basée sur le code du dossier
        if obj.code_dossier:
            try:
                from .services import ClassificationAffaireService
                classification = ClassificationAffaireService.get_classification_by_code(obj.code_dossier)
                if classification and classification.get('type'):
                    return classification['type']
            except:
                pass
            
            # Fallback: classification basée sur les règles simples
            code = obj.code_dossier
            if code.startswith("1") or code.startswith("6"):
                return "مدني"
            elif code.startswith("2") or code.startswith("3") or code.startswith("4"):
                return "جنائي"
            elif code.startswith("7"):
                return "إدارية"
            elif code.startswith("8"):
                return "تجاري"
        
        # Priorité 2: Utiliser le type d'affaire enregistré
        if obj.idtypeaffaire:
            return obj.idtypeaffaire.libelletypeaffaire_fr
        
        return "Non défini"

    def get_client_nom(self, obj):
        if obj.idclient:
            nom_fr = obj.idclient.nomclient_fr or ""
            prenom_fr = obj.idclient.prenomclient_fr or ""
            nom_ar = obj.idclient.nomclient_ar or ""
            prenom_ar = obj.idclient.prenomclient_ar or ""
            
            # Retourner un objet avec les deux langues
            return {
                'fr': f"{nom_fr} {prenom_fr}".strip() or "Non assigné",
                'ar': f"{nom_ar} {prenom_ar}".strip() or "غير مخصص"
            }
        return {'fr': "Non assigné", 'ar': "غير مخصص"}

    def get_numero_complet(self, obj):
        return f"{obj.numero_dossier}/{obj.code_dossier}/{obj.annee_dossier}"

    def get_etape_actuelle(self, obj):
        try:
            # Étape actuelle directement liée à l'affaire si disponible
            etape = getattr(obj, 'etape_actuelle', None)
            if not etape:
                # Fallback 1: première étape non terminée par ordre
                etape = (
                    Etapejudiciaire.objects.filter(idaffaire=obj, date_fin_effective__isnull=True)
                    .order_by('ordre_etape')
                    .first()
                )
            if not etape:
                # Fallback 2: dernière étape créée
                etape = (
                    Etapejudiciaire.objects.filter(idaffaire=obj)
                    .order_by('-date_debut_effective', '-datedebut', '-ordre_etape')
                    .first()
                )
            if not etape:
                return None

            libelle = (
                etape.idtypeetape.libelletypeetape if getattr(etape, 'idtypeetape', None) else f"Étape {etape.ordre_etape}"
            )
            return {
                'id': etape.idetape,
                'libelle': libelle,
                'libelle_fr': libelle,
                'libelle_ar': libelle,
                'ordre': etape.ordre_etape,
            }
        except Exception:
            return None

    def get_prochaine_audience(self, obj):
        """Récupère la prochaine audience de l'affaire"""
        try:
            from datetime import date
            from .models import Audience
            
            prochaine_audience = Audience.objects.filter(
                idaffaire=obj,
                dateaudience__gte=date.today()
            ).order_by('dateaudience', 'heureaudience').first()
            
            if prochaine_audience:
                return {
                    'date': prochaine_audience.dateaudience.isoformat(),
                    'heure': prochaine_audience.heureaudience.isoformat() if prochaine_audience.heureaudience else None,
                    'type_rendez_vous': prochaine_audience.type_rendez_vous,
                    'titre': prochaine_audience.titre,
                    'lieu': prochaine_audience.lieu,
                    'statut': prochaine_audience.statut,
                    'description': prochaine_audience.description,
                    'remarques': prochaine_audience.remarques,
                }
            return None
        except Exception:
            return None




# Serializer pour les étapes judiciaires d'une affaire
class EtapejudiciaireSerializer(serializers.ModelSerializer):
    observations = serializers.CharField(source='observations_etape', read_only=True)
    type_libelle = serializers.CharField(source='idtypeetape.libelletypeetape', read_only=True)
    etat = serializers.SerializerMethodField()

    class Meta:
        model = Etapejudiciaire
        fields = '__all__'

    def get_etat(self, obj):
        try:
            return 'Terminé' if getattr(obj, 'datefin', None) else 'En cours'
        except Exception:
            return None

# Serializer pour les experts
class ExpertSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expert
        fields = '__all__'

# Serializer pour les factures
class FactureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Facture
        fields = '__all__'

# Serializer pour les huissiers
class HuissierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Huissier
        fields = '__all__'

# Serializer pour les paiements d'honoraires
class PaiementhonorairesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paiementhonoraires
        fields = '__all__'

# Serializer pour la participation des experts aux étapes
class ParticipationexpertetapeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Participationexpertetape
        fields = '__all__'

# Serializer pour la participation des huissiers aux étapes
class ParticipationhuissieretapeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Participationhuissieretape
        fields = '__all__'

# Serializer pour la participation des témoins aux étapes
class ParticipationtemoinetapeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Participationtemoinetape
        fields = '__all__'

# Serializer pour les témoins
class TemoinSerializer(serializers.ModelSerializer):
    class Meta:
        model = Temoin
        fields = '__all__'

# Serializer pour les types d'intervention
class TypeInterventionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TypeIntervention
        fields = '__all__'

# Serializer pour les tribunaux
class TribunalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tribunal
        fields = '__all__'

# Serializer pour les types de tribunaux
class TypeTribunalSerializer(serializers.ModelSerializer):
    class Meta:
        model = TypeTribunal
        fields = '__all__'


# Serializer pour les statuts d'affaire par tribunal
class StatutAffairetribunalSerializer(serializers.ModelSerializer):
    class Meta:
        model = StatutAffairetribunal
        fields = '__all__'

# Serializer pour les types de clients
class TypeClientSerializer(serializers.ModelSerializer):

    libelletypeclient = serializers.SerializerMethodField()

    def get_libelletypeclient(self, obj):
        try:
            return getattr(obj, 'libelletypeclient_fr', None) or getattr(obj, 'libelletypeclient_ar', None) or ''
        except Exception:
            return ''

    class Meta:
        model = TypeClient
        fields = '__all__'

# Serializer pour les types d'affaires
class TypeAffaireSerializer(serializers.ModelSerializer):
    class Meta:
        model = TypeAffaire
        fields = '__all__'


# Serializer pour les catégories d'affaires
class CategorieAffaireSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategorieAffaire
        fields = '__all__'

# Serializer pour les statuts d'affaires
class StatutAffaireSerializer(serializers.ModelSerializer):
    class Meta:
        model = StatutAffaire
        fields = '__all__'



# Serializer pour les affaires par tribunal
class AffairetribunalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Affairetribunal
        fields = '__all__'

# Serializer pour les audiences avec informations dérivées pour l'agenda
class AudienceSerializer(serializers.ModelSerializer):
    heureaudience = serializers.TimeField(required=False, allow_null=True)
    type_rendez_vous_display = serializers.CharField(source='get_type_rendez_vous_display', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    # Champs dérivés pour l'affichage dans l'agenda
    affaire_id = serializers.IntegerField(source='idaffaire.idaffaire', read_only=True)
    affaire_numero = serializers.SerializerMethodField()
    client_id = serializers.IntegerField(source='idaffaire.idclient.idclient', read_only=True)
    client_nom = serializers.SerializerMethodField()
    client_tel = serializers.CharField(source='idaffaire.idclient.numtel1', read_only=True)
    tribunal_nom = serializers.CharField(source='idtribunal.nomtribunal_fr', read_only=True)

    class Meta:
        model = Audience
        fields = '__all__'
        extra_kwargs = {
            'idaudience': {'read_only': True},
            'cree_par': {'read_only': True},
        }

    def get_affaire_numero(self, obj):
        try:
            if getattr(obj, 'idaffaire', None):
                numero = getattr(obj.idaffaire, 'numero_dossier', None)
                code = getattr(obj.idaffaire, 'code_dossier', None)
                annee = getattr(obj.idaffaire, 'annee_dossier', None)
                if numero and code and annee:
                    return f"{numero}/{code}/{annee}"
                if numero:
                    return str(numero)
        except Exception:
            pass
        return None

    def get_client_nom(self, obj):
        try:
            client = getattr(getattr(obj, 'idaffaire', None), 'idclient', None)
            if client:
                nom_fr = getattr(client, 'nomclient_fr', '') or ''
                prenom_fr = getattr(client, 'prenomclient_fr', '') or ''
                nom_ar = getattr(client, 'nomclient_ar', '') or ''
                prenom_ar = getattr(client, 'prenomclient_ar', '') or ''
                
                # Retourner un objet avec les deux langues
                return {
                    'fr': f"{nom_fr} {prenom_fr}".strip() or "Non assigné",
                    'ar': f"{nom_ar} {prenom_ar}".strip() or "غير مخصص"
                }
        except Exception:
            pass
        return {'fr': "Non assigné", 'ar': "غير مخصص"}

# Serializer pour les avocats
class AvocatSerializer(serializers.ModelSerializer):
    nom_complet = serializers.ReadOnlyField()

    class Meta:
        model = Avocat
        fields = '__all__'


# Serializer pour la relation entre affaires, opposants et avocats
class AffaireOpposantAvocatSerializer(serializers.ModelSerializer):
    class Meta:
        model = AffaireOpposantAvocat
        fields = '__all__'


# Serializer pour les types d'affaires principales
class TypeAffairePrincipaleSerializer(serializers.ModelSerializer):

    class Meta:
        model = TypeAffairePrincipale
        fields = '__all__'


# Serializer pour les sous-types d'affaires avec relation vers le type principal
class SousTypeAffaireSerializer(serializers.ModelSerializer):
    # Serializer pour le modèle SousTypeAffaire
    type_principale = TypeAffairePrincipaleSerializer(read_only=True)
    
    class Meta:
        model = SousTypeAffaire
        fields = '__all__'


# Serializer pour les types d'avertissements
class TypeAvertissementSerializer(serializers.ModelSerializer):
    class Meta:
        model = TypeAvertissement
        fields = '__all__'

# Serializer pour les types de demandes
class TypeDemandeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TypeDemande
        fields = '__all__'

# Serializer pour les statuts d'audience
class StatutAudienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = StatutAudience
        fields = '__all__'

# Serializer pour la réponse de classification automatique des affaires
class ClassificationAffaireResponseSerializer(serializers.Serializer):
    # Serializer pour la réponse de classification automatique
    type = serializers.CharField()
    categorie = serializers.CharField()
    description = serializers.CharField()
    couleurs = serializers.DictField()


# Serializer pour les fichiers d'une affaire avec gestion des URLs
class FichierSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()
    upload_par_username = serializers.CharField(source='upload_par.username', read_only=True)
    affaire_id = serializers.IntegerField(source='affaire.idaffaire', read_only=True)
    affaire_reference = serializers.CharField(source='affaire.reference', read_only=True, required=False, allow_null=True)
    affaire_numero_dossier = serializers.CharField(source='affaire.numero_dossier', read_only=True, required=False, allow_null=True)
    affaire_code_dossier = serializers.CharField(source='affaire.code_dossier', read_only=True, required=False, allow_null=True)
    affaire_annee_dossier = serializers.CharField(source='affaire.annee_dossier', read_only=True, required=False, allow_null=True)
    client_id = serializers.IntegerField(source='affaire.idclient.idclient', read_only=True, required=False)
    client_nom = serializers.CharField(source='affaire.idclient.nomclient_fr', read_only=True, required=False, allow_null=True)
    doc_type = serializers.SerializerMethodField()

    class Meta:
        model = Fichier
        fields = [
            'id',
            'nom_fichier',
            'type_fichier',
            'description',
            'date_upload',
            'version',
            'public',
            'upload_par_username',
            'affaire_id',
            'affaire_reference',
            'affaire_numero_dossier',
            'affaire_code_dossier',
            'affaire_annee_dossier',
            'client_id',
            'client_nom',
            'doc_type',
            'url',
        ]

    def get_url(self, obj):
        request = self.context.get('request') if hasattr(self, 'context') else None
        if request and getattr(obj, 'fichier', None):
            try:
                return request.build_absolute_uri(obj.fichier.url)
            except Exception:
                return None
        return None

    def get_doc_type(self, obj):
        # Indique que cet objet est un fichier d'affaire pour l'UI unifiée
        return 'FICHIER'


# Serializer pour les notifications avec calcul du statut de lecture
class NotificationSerializer(serializers.ModelSerializer):
    is_read = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id', 'type', 'title', 'message', 'payload', 'deep_link',
            'level', 'affaire', 'created_at', 'read_at', 'is_read'
        ]

    def get_is_read(self, obj):
        return obj.read_at is not None


# Serializer pour les appareils de notification (tokens FCM)
class DeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = ['token', 'platform']

