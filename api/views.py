from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View
from django.db.models import Q, Count, Sum, Avg, Max, Min
from django.db import transaction, connection
from django.contrib.auth.models import User
from datetime import date, datetime, timedelta
import json
import os
import uuid
import logging

# Django REST Framework imports
from rest_framework import viewsets, status, filters, routers
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone

# JWT imports
from rest_framework_simplejwt.views import TokenObtainPairView

# Local imports
from .models import *
from .serializers import *
from .services import *
from api.utils.i18n import LanguageMixin

# Définissent les options disponibles pour les affaires pénales
AUTORITES_EMETTRICES = [
    ('POLICE_JUDICIAIRE', 'Police judiciaire'),
    ('GENDARMERIE', 'Gendarmerie'),
    ('PARQUET', 'Parquet'),
    ('JUGES_INSTRUCTION', 'Juges d\'instruction'),
    ('TRIBUNAL', 'Tribunal'),
    ('AUTRE', 'Autre autorité')
]

TYPES_ACTION_PENALE = [
    ('CONVOCATION', 'Convocation'),
    ('ARRESTATION', 'Arrestation'),
    ('GARDE_VUE', 'Garde à vue'),
    ('AUTRE', 'Autre mesure')
]

TYPES_JUGEMENT = [
    ('PRISON', 'Prison'),
    ('AMENDE', 'Amende'),
    ('SURSIS', 'Sursis'),
    ('ACQUITTEMENT', 'Acquittement')
]

STATUTS_EXECUTION = [
    ('OUI', 'Exécution faite'),
    ('NON', 'Exécution non faite'),
    ('PARTIELLE', 'Exécution partielle')
]

TYPES_EXECUTION = [
    ('EMPRISONNEMENT', 'Emprisonnement'),
    ('AMENDE', 'Amende'),
    ('TIG', 'Travaux d\'intérêt général'),
    ('SURSIS', 'Sursis'),
    ('AUTRE', 'Autre')
]

TYPES_JUGEMENT_PENAL = [
    ('ACQUITTEMENT', 'Acquittement'),
    ('PRISON', 'Prison'),
    ('AMENDE', 'Amende'),
    ('SURSIS', 'Sursis'),
    ('PRISON_AVEC_SURSIS', 'Prison avec sursis'),
    ('TRAVAUX_INTERET_GENERAL', 'Travaux d\'intérêt général'),
    ('AUTRE', 'Autre peine')
]

logger = logging.getLogger(__name__)

# Fonction utilitaire pour déterminer le type d'étape selon l'ID et le contexte
def get_type_etape_by_etape_id(etape_id, phase=None, role=None):
    """Retourne le bon type d'étape selon l'ID et le contexte"""
    
    print(f"🔍 DEBUG get_type_etape_by_etape_id: etape_id={etape_id}, phase={phase}, role={role}")
    
    # DEBUG: Afficher tous les types d'étapes disponibles
    print(f"🔍 DEBUG: Types d'étapes disponibles en base:")
    all_types = TypeEtape.objects.all().order_by('idtypeetape')
    for t in all_types:
        print(f"   ID {t.idtypeetape}: {t.libelletypeetape}")
    
    # Mapping des étapes existantes avec leurs IDs
    mapping_etapes = {
        # Étapes civiles (fallback)
        "etape_0": 4,    # "إنجاز إنذار" (ID 4)
        "etape_1": 5,    # "تقديم الشكاية" (ID 5)
        "etape_2": 6,    # "تقديم الدعوى مباشرة" (ID 6)
        "etape_3": 3,    # "استلام شكاية" (ID 3)
        
        # Étapes spéciales selon la phase et le rôle
        "INITIALE_demandeur": {
            "etape_0": 4,    # "إنجاز إنذار"
            "etape_1": 5,    # "تقديم الشكاية"
            "etape_2": 6,    # "تقديم الدعوى مباشرة"
        },
        "INITIALE_opposant": {
            "etape_0": 1,    # "استلام إنذار"
            "etape_1": 3,    # "استلام شكاية"
            "etape_2": 2,    # "استدعاء للمثول"
        },
        "PROCEDURE_demandeur": {
            "etape_0": 10,   # "جلسات" (sessions)
            "etape_1": 13,   # "تبليغ الاستدعاء"
            "etape_2": 9,    # "مداولة"
            "etape_3": 11,   # "حكم"
        },
        "PROCEDURE_opposant": {
            "etape_0": 7,    # "تقديم تمثيل"
            "etape_1": 8,    # "رد على المقال"
            "etape_2": 9,    # "مداولة"
            "etape_3": 11,   # "حكم"
        },
        "EXECUTION_demandeur": {
            "etape_0": 11,   # "حكم" (pour l'exécution)
        },
        "EXECUTION_opposant": {
            "etape_0": 11,   # "حكم" (pour l'exécution)
        }
    }
    
    try:
        print(f"🔍 DEBUG: Vérification du mapping contextuel...")
        # Si on a une phase et un rôle, utiliser le mapping contextuel
        if phase and role:
            context_key = f"{phase}_{role}"
            print(f"🔍 DEBUG: context_key = {context_key}")
            if context_key in mapping_etapes:
                etape_mapping = mapping_etapes[context_key]
                print(f"🔍 DEBUG: etape_mapping trouvé: {etape_mapping}")
                if etape_id in etape_mapping:
                    type_id = etape_mapping[etape_id]
                    print(f"🔍 DEBUG: Type ID trouvé dans le mapping contextuel: {type_id}")
                    return TypeEtape.objects.get(idtypeetape=type_id)
                else:
                    print(f"🔍 DEBUG: etape_id {etape_id} non trouvé dans le mapping contextuel")
            else:
                print(f"🔍 DEBUG: context_key {context_key} non trouvé dans le mapping")
        
        print(f"🔍 DEBUG: Utilisation du mapping simple...")
        # Sinon, utiliser le mapping simple
        if etape_id in mapping_etapes:
            type_id = mapping_etapes[etape_id]
            print(f"🔍 DEBUG: Type ID trouvé dans le mapping simple: {type_id}")
            return TypeEtape.objects.get(idtypeetape=type_id)
        else:
            print(f"🔍 DEBUG: etape_id {etape_id} non trouvé dans le mapping simple")
        
        print(f"🔍 DEBUG: Fallback vers le premier type disponible...")
        # Fallback : premier type disponible
        fallback_type = TypeEtape.objects.first()
        print(f"🔍 DEBUG: Type de fallback: {fallback_type}")
        if fallback_type:
            return fallback_type
        else:
            print(f"❌ ERREUR CRITIQUE: Aucun type d'étape disponible en base!")
            return None
        
    except TypeEtape.DoesNotExist as e:
        print(f"❌ Type d'étape non trouvé pour {etape_id}: {str(e)}")
        fallback_type = TypeEtape.objects.first()  # Fallback
        print(f"🔍 DEBUG: Type de fallback après erreur: {fallback_type}")
        if fallback_type:
            return fallback_type
        else:
            print(f"❌ ERREUR CRITIQUE: Aucun type d'étape disponible en base!")
            return None
    except Exception as e:
        print(f"❌ Erreur inattendue dans get_type_etape_by_etape_id: {str(e)}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        fallback_type = TypeEtape.objects.first()  # Fallback
        print(f"🔍 DEBUG: Type de fallback après erreur inattendue: {fallback_type}")
        if fallback_type:
            return fallback_type
        else:
            print(f"❌ ERREUR CRITIQUE: Aucun type d'étape disponible en base!")
            return None

# Fonction de maintenance pour mettre à jour les étapes existantes sans type
def update_existing_etapes_without_type():
    try:
        etapes_sans_type = Etapejudiciaire.objects.filter(idtypeetape__isnull=True)
        print(f"🔄 Mise à jour de {etapes_sans_type.count()} étapes sans type...")
        
        for etape in etapes_sans_type:
            try:
                # Essayer de déterminer le type d'étape selon l'ID
                if '_' in str(etape.idetape):
                    # ID au format etape_X_affaire_Y_hash
                    parts = etape.idetape.split('_')
                    if len(parts) >= 2:
                        etape_id = f"etape_{parts[1]}"
                        type_etape = get_type_etape_by_etape_id(etape_id)
                        if type_etape:
                            etape.idtypeetape = type_etape
                            etape.save()
                            print(f"✅ Étape {etape.idetape} mise à jour avec type: {type_etape.libelletypeetape}")
                        else:
                            print(f"⚠️ Impossible de déterminer le type pour {etape.idetape}")
                else:
                    # ID simple, essayer de le traiter comme un ordre
                    try:
                        ordre = int(etape.idetape)
                        type_etape = get_type_etape_by_etape_id(f"etape_{ordre}")
                        if type_etape:
                            etape.idtypeetape = type_etape
                            etape.save()
                            print(f"✅ Étape {etape.idetape} mise à jour avec type: {type_etape.libelletypeetape}")
                        else:
                            print(f"⚠️ Impossible de déterminer le type pour {etape.idetape}")
                    except ValueError:
                        print(f"⚠️ ID d'étape non numérique: {etape.idetape}")
                        
            except Exception as e:
                print(f"❌ Erreur lors de la mise à jour de l'étape {etape.idetape}: {str(e)}")
        
        print(f"✅ Mise à jour terminée!")
        
    except Exception as e:
        print(f"❌ Erreur lors de la mise à jour des étapes: {str(e)}")



# ViewSet pour la gestion des clients avec recherche et suppression en cascade
class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientProfileSerializer
    
    def get_queryset(self):
        queryset = Client.objects.all()
        search = self.request.query_params.get('search', None)
        type_filter = self.request.query_params.get('type', None)
        
        if search:
            queryset = queryset.filter(
                Q(nomclient_fr__icontains=search) |
                Q(nomclient_ar__icontains=search) |
                Q(prenomclient_fr__icontains=search) |
                Q(prenomclient_ar__icontains=search) |
                Q(email__icontains=search) |
                Q(numtel1__icontains=search) |
                Q(numtel2__icontains=search)
            )
        
        if type_filter:
            # Filtrer par type (français ou arabe)
            queryset = queryset.filter(
                Q(idtypeclient__libelletypeclient_fr__icontains=type_filter) |
                Q(idtypeclient__libelletypeclient_ar__icontains=type_filter)
            )
        
        return queryset
    
    def destroy(self, request, *args, **kwargs):
        try:
            with transaction.atomic():
                client = self.get_object()
                Affairejudiciaire.objects.filter(idclient=client).delete()
                Contrat.objects.filter(idclient=client).delete()
                Facture.objects.filter(idclient=client).delete()

                if client.user:
                    client.user.delete()
                
                client.delete()
                return Response({'message': 'Client supprimé avec succès'}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({
                'error': f'Erreur lors de la suppression du client: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)


# ViewSet pour le profil client mobile avec gestion des types (société/particulier)
class ClientMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            client = Client.objects.get(user=request.user)
        except Client.DoesNotExist:
            return Response({'detail': 'Not a client'}, status=404)
        serializer = ClientProfileSerializer(client)
        return Response(serializer.data)

    def patch(self, request):
        try:
            client = Client.objects.get(user=request.user)
        except Client.DoesNotExist:
            return Response({'detail': 'Not a client'}, status=404)

        # Autoriser uniquement la mise à jour de preferred_language
        preferred_language = request.data.get('preferred_language')
        if preferred_language not in (None, 'fr', 'ar'):
            return Response({'error': "preferred_language doit être 'fr' ou 'ar'"}, status=status.HTTP_400_BAD_REQUEST)

        if preferred_language is not None:
            client.preferred_language = preferred_language
            client.save(update_fields=['preferred_language'])

        serializer = ClientProfileSerializer(client)
        return Response(serializer.data)


# ViewSet principal pour la gestion des affaires judiciaires avec filtrage automatique
class AffairejudiciaireViewSet(viewsets.ModelViewSet):
    serializer_class = AffairejudiciaireSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['idtypeaffaire', 'phase_processus']
    search_fields = ['numero_dossier', 'code_dossier']
    ordering_fields = ['dateouverture', 'datecloture']

    def get_queryset(self):
        """
        Filtrage automatique selon le type d'utilisateur :
        - Client  : voit seulement ses affaires
        - Staff/Avocat  : voit toutes les affaires
        """
        user = self.request.user
        
        # Client  (app mobile)
        if hasattr(user, 'client') and user.client:
            print(f"🔍 Client connecté: {user.username} (ID: {user.client.idclient})")
            queryset = Affairejudiciaire.objects.filter(
                idclient=user.client.idclient
            )
            print(f"📊 Affaires trouvées pour le client: {queryset.count()}")
            
        # Staff/Avocat  (app web)
        elif user.is_staff:
            print(f"👨‍💼 Staff connecté: {user.username} - Accès à toutes les affaires".encode("utf-8", "ignore").decode())
            queryset = Affairejudiciaire.objects.all()
            print(f"📊 Total affaires dans la base: {queryset.count()}")
            
        # Utilisateur non autorisé
        else:
            print(f"❌ Utilisateur non autorisé: {user.username}")
            queryset = Affairejudiciaire.objects.none()
        
        # Filtres additionnels
        statut = self.request.query_params.get('statut', None)
        if statut:
            if statut == 'actives':
                queryset = queryset.filter(datecloture__isnull=True)
                print(f"🔍 Filtre 'actives' appliqué: {queryset.count()} affaires")
            elif statut == 'terminees':
                queryset = queryset.filter(datecloture__isnull=False)
                print(f"🔍 Filtre 'terminees' appliqué: {queryset.count()} affaires")
        
        return queryset


    # debug
    @action(detail=False, methods=['get'])
    def debug_info(self, request):
        # Endpoint de debug pour vérifier le filtrage des affaires
        user = request.user
        debug_info = {
            'user_info': {
                'username': user.username,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'user_id': user.id,
            },
            'client_info': None,
            'affaires_count': 0,
            'affaires_details': []
        }

        # Informations sur le client
        if hasattr(user, 'client') and user.client:
            debug_info['client_info'] = {
                'client_id': user.client.idclient,
                'nom': user.client.nomclient,
                'prenom': user.client.prenomclient_fr or user.client.prenomclient_ar or '',
                'email': user.client.email
            }

        # Compter les affaires selon le filtrage
        queryset = self.get_queryset()
        debug_info['affaires_count'] = queryset.count()

        # Détails des affaires 5 pour éviter la surcharge
        affaires_sample = queryset[:5]
        for affaire in affaires_sample:
            debug_info['affaires_details'].append({
                'id': affaire.idaffaire,
                'numero_dossier': affaire.numero_dossier,
                'code_dossier': affaire.code_dossier,
                'annee_dossier': affaire.annee_dossier,
                'client_id': affaire.idclient.idclient if affaire.idclient else None,
                'date_ouverture': affaire.dateouverture.isoformat() if affaire.dateouverture else None,
                'date_cloture': affaire.datecloture.isoformat() if affaire.datecloture else None
            })

        return Response(debug_info)

    @action(detail=False, methods=['get'])
    def client_statistics(self, request):
        # Endpoint pour récupérer les statistiques du client

        try:
            user = request.user

            # l'utilisateur est un client
            if not hasattr(user, 'client') or not user.client:
                return Response(
                    {'error': 'Accès réservé aux clients'},
                    status=status.HTTP_403_FORBIDDEN
                )

            client = user.client
            client_id = client.idclient

            print(f"🔍 Statistiques demandées pour le client: {client.nomclient} (ID: {client_id})")

            #  Nombre d'affaires actives du client
            affaires_count = Affairejudiciaire.objects.filter(
                idclient=client_id,
                datecloture__isnull=True  # Affaires non clôturées
            ).count()

            print(f"📊 Affaires actives trouvées: {affaires_count}")

            #  Prochaine audience du client
            affaires_client = Affairejudiciaire.objects.filter(
                idclient=client_id
            ).values_list('idaffaire', flat=True)

            prochaine_audience = None
            if affaires_client.exists():
                prochaine_audience_obj = Audience.objects.filter(
                    idaffaire__in=affaires_client,
                    dateaudience__gte=date.today()  # a partir d'aujourd'hui
                ).order_by('dateaudience', 'heureaudience').first()

                if prochaine_audience_obj:

                    try:
                        type_rdv = getattr(prochaine_audience_obj, 'type_rendez_vous')
                    except Exception:
                        type_rdv = None
                    try:
                        type_rdv_display = prochaine_audience_obj.get_type_rendez_vous_display() if hasattr(prochaine_audience_obj, 'get_type_rendez_vous_display') else None
                    except Exception:
                        type_rdv_display = None
                    titre = getattr(prochaine_audience_obj, 'titre', None)
                    lieu = getattr(prochaine_audience_obj, 'lieu', None)
                    statut = getattr(prochaine_audience_obj, 'statut', None)
                    description = getattr(prochaine_audience_obj, 'description', None)

                    tribunal_nom = (prochaine_audience_obj.idtribunal.nomtribunal_fr or prochaine_audience_obj.idtribunal.nomtribunal_ar or '') if prochaine_audience_obj.idtribunal else None
                    tribunal_adresse = (prochaine_audience_obj.idtribunal.adressetribunal_fr or prochaine_audience_obj.idtribunal.adressetribunal_ar or '') if prochaine_audience_obj.idtribunal else None

                    # Fallback lieu si non renseigné: composer depuis tribunal
                    if (lieu or '').strip() == '' and (tribunal_nom or tribunal_adresse):
                        composed = " - ".join([s for s in [tribunal_nom, tribunal_adresse] if s and str(s).strip()])
                        lieu = composed or None

                    prochaine_audience = {
                        'date': prochaine_audience_obj.dateaudience.isoformat(),
                        'heure': prochaine_audience_obj.heureaudience.isoformat() if prochaine_audience_obj.heureaudience else None,
                        'affaire_id': prochaine_audience_obj.idaffaire.idaffaire,
                        'affaire_numero': prochaine_audience_obj.idaffaire.numero_dossier,
                        'tribunal': tribunal_nom,
                        'adresse': tribunal_adresse,
                        'remarques': prochaine_audience_obj.remarques,
                        'type_rendez_vous': type_rdv or 'AUDIENCE',
                        'type_rendez_vous_display': type_rdv_display or 'Audience',
                        'titre': titre,
                        'lieu': lieu,
                        'statut': statut,
                        'description': description,
                    }
                    print(f"📅 Prochaine audience trouvée: {prochaine_audience['date']}")
                else:
                    print(f"📅 Aucune audience future trouvée")

            #  Statistiques des factures du client
            factures = Facture.objects.filter(idclient=client_id)
            factures_count = factures.count()
            factures_total_montant = factures.aggregate(
                total=Sum('montantfacture')
            )['total'] or 0.0

            print(f"💰 Factures trouvées: {factures_count}, Montant total: {factures_total_montant}")

            # Nombre de documents du client
            documents_count = Fichier.objects.filter(
                affaire__in=affaires_client
            ).count()

            print(f"📄 Documents trouvés: {documents_count}")

            # Résumé des statistiques
            statistics = {
                'client_info': {
                    'id': client_id,
                    'nom': client.nomclient,
                    'prenom': client.prenomclient_fr or client.prenomclient_ar or '',
                    'email': client.email
                },
                'affaires': {
                    'count': affaires_count,
                    'actives': affaires_count,
                    'terminees': Affairejudiciaire.objects.filter(
                        idclient=client_id,
                        datecloture__isnull=False
                    ).count()
                },
                'prochaine_audience': prochaine_audience,
                'factures': {
                    'count': factures_count,
                    'total_montant': factures_total_montant,
                    'moyenne': factures_total_montant / factures_count if factures_count > 0 else 0
                },
                'documents': {
                    'count': documents_count
                },
                'timestamp': datetime.now().isoformat()
            }

            print(f"✅ Statistiques générées avec succès pour le client {client_id}")
            return Response(statistics)

        except Exception as e:
            print(f"❌ Erreur lors de la génération des statistiques: {str(e)}")
            return Response(
                {'error': f'Erreur lors de la génération des statistiques: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def create(self, request, *args, **kwargs):
        with transaction.atomic():
            data = request.data.copy()
            role_client = data.get('roleClient')
            idclient = data.get('idclient')
            
            affaire = None
            opposant = None
            # Création de l'affaire sans opposant pour l'instant
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            affaire = serializer.save()
            
            # Si le rôle est opposant, créer un opposant et lier à l'affaire
            if role_client == 'opposant' and idclient:
                try:
                    client = Client.objects.get(pk=idclient)
                    opposant, created = Opposant.objects.get_or_create(
                        nomopposant_fr=client.nomclient_fr,
                        nomopposant_ar=client.nomclient_ar,
                        defaults={
                            'adresse1_fr': client.adresse1_fr,
                            'adresse1_ar': client.adresse1_ar,
                            'adresse2_fr': client.adresse2_fr,
                            'adresse2_ar': client.adresse2_ar,
                            'numtel1': client.numtel1,
                            'numtel2': client.numtel2,
                            'email': client.email,
                        }
                    )
                    
                    # Mettre à jour l'opposant si il existait déjà
                    if not created:
                        opposant.adresse1 = client.adresse1
                        opposant.adresse2 = client.adresse2
                        opposant.numtel1 = client.numtel1
                        opposant.numtel2 = client.numtel2
                        opposant.email = client.email
                        opposant.save()
                    
                    #  l'enregistrement dans AffaireOpposantAvocat
                    #  avocat temporaire
                    avocat_default = Avocat.objects.first()
                    
                    if not avocat_default:
                        #  un avocat temporaire avec un ID par défaut
                        avocat_default, created = Avocat.objects.get_or_create(
                            idavocat='TEMP001',
                            defaults={
                                'nomavocat': 'Avocat temporaire',
                                'specialisation': 'À définir'
                            }
                        )
                    
                    relation = AffaireOpposantAvocat.objects.create(
                        affaire=affaire,
                        opposant=opposant,
                        avocat=avocat_default,
                        role_avocat='À définir',
                        actif=True
                    )
                    
                    affaire.idopposant = opposant
                    affaire.save()
                except Client.DoesNotExist:
                    pass
            else:
                pass
            
            # Créer automatiquement l'étape actuelle selon la logique unifiée
            try:
                from .services import get_etape_actuelle_par_phase
                etape_actuelle = get_etape_actuelle_par_phase(affaire)
                if etape_actuelle:
                    affaire.etape_actuelle = etape_actuelle
                    affaire.save()
                    print(f"✅ Étape actuelle créée pour l'affaire {affaire.idaffaire}: {etape_actuelle.idtypeetape.libelletypeetape if etape_actuelle.idtypeetape else 'Sans type'}")
                else:
                    print(f"⚠️ Aucune étape actuelle créée pour l'affaire {affaire.idaffaire}")
            except Exception as e:
                print(f"❌ Erreur lors de la création de l'étape actuelle: {e}")
            
            headers = self.get_success_headers(serializer.data)
            return Response(self.get_serializer(affaire).data, status=status.HTTP_201_CREATED, headers=headers)

    def destroy(self, request, *args, **kwargs):
        try:
            with transaction.atomic():
                affaire = self.get_object()
                affaire.etape_actuelle = None
                affaire.save()

                from .models import StatutEtape
                etapes = Etapejudiciaire.objects.filter(idaffaire=affaire)
                for etape in etapes:
                    StatutEtape.objects.filter(idetape=etape).delete()
                

                Etapejudiciaire.objects.filter(idaffaire=affaire).delete()

                Audience.objects.filter(idaffaire=affaire).delete()
                StatutAffaire.objects.filter(idaffaire=affaire).delete()
                
                #  relations opposant-avocat
                AffaireOpposantAvocat.objects.filter(affaire=affaire).delete()
                
                #relations affaire-tribunal
                try:
                    with connection.cursor() as cursor:
                        cursor.execute("DELETE FROM affairetribunal WHERE idAffaire = %s", [affaire.idaffaire])
                except Exception as e:
                    print(f"Erreur lors de la suppression des relations affaire-tribunal: {e}")
                
                #  les données d'exécution
                try:
                    from .models import PVExecution
                    PVExecution.objects.filter(etape__idaffaire=affaire).delete()
                except ImportError:
                    pass  # Le modèle n'existe pas, on continue
                
                #  les fichiers associés
                try:
                    from .models import Fichier
                    Fichier.objects.filter(affaire=affaire).delete()
                except ImportError:
                    pass  # Le modèle n'existe pas, on continue
                
                # supprimer l'affaire
                affaire.delete()
                return Response({'message': 'Affaire supprimée avec succès'}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({
                'error': f'Erreur lors de la suppression de l\'affaire: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)




# ViewSet pour créer des utilisateurs Django simples
class CreateUserView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        if not username or not password:
            return Response({'error': 'username and password required'}, status=400)
        if User.objects.filter(username=username).exists():
            return Response({'error': 'username already exists'}, status=400)
        user = User.objects.create_user(username=username, password=password)
        return Response({'id': user.id, 'username': user.username})


# ViewSet personnalisé pour l'authentification JWT avec restrictions d'accès
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer




# ViewSet pour créer des clients et utilisateurs en une seule opération

class CreateClientView(APIView):
    def post(self, request):
        try:
            with transaction.atomic():
                user = User.objects.create_user(
                    username=request.data['username'],
                    password=request.data['password']
                )
                idtypeclient = request.data['idtypeclient']
                if isinstance(idtypeclient, dict) and 'idtypeclient' in idtypeclient:
                    idtypeclient = idtypeclient['idtypeclient']
                elif not isinstance(idtypeclient, (int, str)):
                    raise ValueError(f"idtypeclient doit être un nombre, reçu: {type(idtypeclient)}")
                def get_first(data, key):
                    v = data.getlist(key)
                    return v[0] if v else ''
                client = Client.objects.create(
                    nomclient_fr=get_first(request.data, 'nomclient_fr'),
                    nomclient_ar=get_first(request.data, 'nomclient_ar'),
                    prenomclient_fr=get_first(request.data, 'prenomclient_fr'),
                    prenomclient_ar=get_first(request.data, 'prenomclient_ar'),
                    email=get_first(request.data, 'email'),
                    numtel1=get_first(request.data, 'numtel1'),
                    numtel2=get_first(request.data, 'numtel2'),
                    adresse1_fr=get_first(request.data, 'adresse1_fr'),
                    adresse1_ar=get_first(request.data, 'adresse1_ar'),
                    adresse2_fr=get_first(request.data, 'adresse2_fr'),
                    adresse2_ar=get_first(request.data, 'adresse2_ar'),
                    idtypeclient_id=idtypeclient,
                    user=user,
                )
                contrat = None
                if request.data.get('is_societe') and request.FILES.get('fichier'):
                    fichier = request.FILES.get('fichier')
                    contrat = Contrat.objects.create(
                        idclient=client,
                        fichier=fichier
                    )
                type_client = client.idtypeclient
                return Response({
                    'success': True,
                    'message': 'Client créé avec succès',
                    'client': {
                        'idclient': client.idclient,
                        'nomclient_fr': client.nomclient_fr,
                        'nomclient_ar': client.nomclient_ar,
                        'nomclient': client.nomclient,  # Pour compatibilité
                        'prenomclient_fr': client.prenomclient_fr,
                        'prenomclient_ar': client.prenomclient_ar,
                        'adresse1_fr': client.adresse1_fr,
                        'adresse1_ar': client.adresse1_ar,
                        'adresse1': client.adresse1,  # Pour compatibilité
                        'adresse2_fr': client.adresse2_fr,
                        'adresse2_ar': client.adresse2_ar,
                        'adresse2': client.adresse2,  # Pour compatibilité
                        'type_client': type_client.libelletypeclient_fr or type_client.libelletypeclient_ar or '',
                        'user_id': user.id
                    },
                    'contrat': contrat.idcontrat if contrat else None
                }, status=status.HTTP_201_CREATED)
        except User.DoesNotExist:
            return Response({
                'error': 'Erreur lors de la création de l\'utilisateur'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'error': f'Erreur lors de la création du client: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)






# ViewSet pour la gestion des statuts d'affaires avec gestion automatique des dates
class StatutAffaireViewSet(viewsets.ModelViewSet):
    queryset = StatutAffaire.objects.all()
    serializer_class = StatutAffaireSerializer

    def perform_create(self, serializer):
        idaffaire = self.request.data.get('idaffaire')
        nouvelle_date_debut = self.request.data.get('datedebut')
        if idaffaire:
            dernier_statut = StatutAffaire.objects.filter(
                idaffaire=idaffaire, datefin__isnull=True
            ).order_by('-datedebut').first()
            if dernier_statut:
                #  la date de début du nouveau statut si fournie, sinon la date du jour
                dernier_statut.datefin = nouvelle_date_debut or date.today()
                dernier_statut.save()
        serializer.save()

# ViewSet pour la gestion des relations affaires-tribunaux
class AffairetribunalViewSet(viewsets.ModelViewSet):
    queryset = Affairetribunal.objects.all()
    serializer_class = AffairetribunalSerializer


# ViewSet principal pour la gestion des audiences et rendez-vous avec normalisation des données
class AudienceViewSet(viewsets.ModelViewSet):
    queryset = Audience.objects.all()
    serializer_class = AudienceSerializer

    def create(self, request, *args, **kwargs):
        """Normalise les champs vides en null pour éviter les erreurs 400 """
        from rest_framework.response import Response
        from rest_framework import status
        from rest_framework.exceptions import ValidationError
        data = request.data.copy()
        nullable_fields = ['heureaudience', 'lieu', 'description', 'remarques', 'idtribunal', 'titre']
        for field in nullable_fields:
            value = data.get(field, None)
            if value == '' or value == '':
                data[field] = None
        # idaffaire peut être soit un objet, soit un id
        idaffaire_value = data.get('idaffaire')
        try:
            if isinstance(idaffaire_value, dict) and 'idaffaire' in idaffaire_value:
                data['idaffaire'] = idaffaire_value['idaffaire']
        except Exception:
            pass
        try:
            print("\n🟦 DEBUG RDV: payload reçu:", dict(request.data))
            print("🟦 DEBUG RDV: payload normalisé:", dict(data))
            serializer = self.get_serializer(data=data)
            if not serializer.is_valid():
                print("🟥 DEBUG RDV: erreurs de validation:", serializer.errors)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            print("🟩 DEBUG RDV: création OK, idaudience:", serializer.data.get('idaudience'))
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except ValidationError as ve:
            print("🟥 DEBUG RDV: ValidationError levée:", getattr(ve, 'detail', str(ve)))
            raise
        except Exception as e:
            print("🟥 DEBUG RDV: exception inattendue:", str(e))
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def get_queryset(self):
        queryset = super().get_queryset()
        idaffaire = self.request.query_params.get('idaffaire')
        idclient = self.request.query_params.get('idclient')
        future_only = self.request.query_params.get('future_only')
        type_rdv = self.request.query_params.get('type_rendez_vous')
        statut = self.request.query_params.get('statut')
        mine_only = self.request.query_params.get('mine_only')

        # Filtre par affaire (via la clé étrangère idaffaire_id)
        if idaffaire is not None:
            try:
                queryset = queryset.filter(idaffaire_id=int(idaffaire))
            except (TypeError, ValueError):
                pass

        # Filtre par client (via l'affaire liée)
        if idclient is not None:
            try:
                queryset = queryset.filter(idaffaire__idclient_id=int(idclient))
            except (TypeError, ValueError):
                pass

        # Option: ne retourner que les audiences futures
        if future_only in ("1", "true", "True"):
            from datetime import date
            queryset = queryset.filter(dateaudience__gte=date.today()).order_by('dateaudience', 'heureaudience')
        else:
            queryset = queryset.order_by('-dateaudience')

        # Filtre par type de rendez-vous
        if type_rdv:
            queryset = queryset.filter(type_rendez_vous=type_rdv)

        # Filtre par statut
        if statut:
            queryset = queryset.filter(statut=statut)

        # Limiter aux rendez-vous du client connecté (app mobile)
        user = getattr(self.request, 'user', None)
        if mine_only in ("1", "true", "True") and user and hasattr(user, 'client') and user.client:
            queryset = queryset.filter(idaffaire__idclient=user.client.idclient)

        return queryset

    @action(detail=False, methods=['get'])
    def types_disponibles(self, request):
        try:
            types = getattr(Audience, 'TYPE_RDV_CHOICES', [])
            statuts = getattr(Audience, 'STATUT_RDV_CHOICES', [])
            return Response({
                'types': types,
                'statuts': statuts
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def agenda_client(self, request):
        """Récupère l'agenda complet du client connecté (app mobile)"""
        try:
            user = request.user
            if not hasattr(user, 'client') or not user.client:
                return Response({'error': 'Accès non autorisé'}, status=status.HTTP_403_FORBIDDEN)
            
            client_id = user.client.idclient
            today = date.today()
            
            # Prochain rendez-vous
            prochain_rdv = Audience.objects.filter(
                idaffaire__idclient=client_id,
                dateaudience__gte=today,
                statut__in=['PLANIFIE', 'CONFIRME']
            ).order_by('dateaudience', 'heureaudience').first()
            
            # Tous les rendez-vous futurs
            rdv_futurs = Audience.objects.filter(
                idaffaire__idclient=client_id,
                dateaudience__gte=today
            ).order_by('dateaudience', 'heureaudience')
            
            # Statistiques par type
            stats_par_type = Audience.objects.filter(
                idaffaire__idclient=client_id,
                dateaudience__gte=today
            ).values('type_rendez_vous').annotate(
                count=Count('idaudience')
            )
            
            # Statistiques par statut
            stats_par_statut = Audience.objects.filter(
                idaffaire__idclient=client_id,
                dateaudience__gte=today
            ).values('statut').annotate(
                count=Count('idaudience')
            )
            
            return Response({
                'prochain_rdv': AudienceSerializer(prochain_rdv).data if prochain_rdv else None,
                'rdv_futurs': AudienceSerializer(rdv_futurs, many=True).data,
                'statistiques': {
                    'par_type': list(stats_par_type),
                    'par_statut': list(stats_par_statut),
                    'total_futurs': rdv_futurs.count()
                }
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def toggle_reminder(self, request, pk=None):
        """Active/désactive les rappels pour un rendez-vous spécifique"""
        try:
            audience = self.get_object()
            reminder_type = request.data.get('reminder_type')  # '24h' ou '1h'
            
            if reminder_type == '24h':
                audience.rappel_24h = not audience.rappel_24h
                audience.save(update_fields=['rappel_24h'])
                return Response({
                    'rappel_24h': audience.rappel_24h,
                    'message': f"Rappel 24h {'activé' if audience.rappel_24h else 'désactivé'}"
                })
            elif reminder_type == '1h':
                audience.rappel_1h = not audience.rappel_1h
                audience.save(update_fields=['rappel_1h'])
                return Response({
                    'rappel_1h': audience.rappel_1h,
                    'message': f"Rappel 1h {'activé' if audience.rappel_1h else 'désactivé'}"
                })
            else:
                return Response({'error': 'Type de rappel invalide'}, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def perform_create(self, serializer):
        import uuid
        from datetime import date
        data = self.request.data
        idaudience = data.get('idaudience')
        if not idaudience:
            idaudience = f"AUD-{date.today().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8]}"
        # Créer d'abord sans passer cree_par pour éviter les erreurs de kwargs inattendus
        instance = serializer.save(idaudience=idaudience)
        # Puis, si le champ existe et l'utilisateur est authentifié, l'assigner
        try:
            if hasattr(instance, 'cree_par') and getattr(self.request, 'user', None) and self.request.user.is_authenticated:
                instance.cree_par = self.request.user
                instance.save(update_fields=['cree_par'])
        except Exception:
            # Ne pas casser la création si ce champ n'existe pas dans le schéma en cours
            pass




# ViewSet pour la gestion des avocats
class AvocatViewSet(viewsets.ModelViewSet):
    queryset = Avocat.objects.all()
    serializer_class = AvocatSerializer




# ViewSets avec logique métier complexe et filtrage automatique

# ViewSet pour la gestion des contrats avec filtrage automatique selon le type d'utilisateur
class ContratViewSet(viewsets.ModelViewSet):
    serializer_class = ContratSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Filtrage automatique selon le type d'utilisateur :
        - Client connecté : voit seulement ses contrats
        - Staff/Avocat connecté : voit tous les contrats
        """
        user = self.request.user
        
        # Client connecté
        if hasattr(user, 'client') and user.client:
            print(f"🔍 Client connecté: {user.username} (ID: {user.client.idclient})")
            queryset = Contrat.objects.filter(
                idclient=user.client.idclient
            )
            print(f"📄 Contrats trouvés pour le client: {queryset.count()}")
            
        # Staff/Avocat connecté
        elif user.is_staff:
            print(f"👨‍💼 Staff connecté: {user.username} - Accès à tous les contrats")
            queryset = Contrat.objects.all()
            print(f"📄 Total contrats dans la base: {queryset.count()}")
            
        # Utilisateur non autorisé
        else:
            print(f"❌ Utilisateur non autorisé: {user.username}")
            queryset = Contrat.objects.none()
        
        return queryset
    
    def get_serializer_context(self):
        """ le contexte de la requête pour générer les URLs"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

# ViewSets pour la gestion du processus judiciaire et des étapes

class EtapejudiciaireViewSet(viewsets.ModelViewSet):
    queryset = Etapejudiciaire.objects.all()
    serializer_class = EtapejudiciaireSerializer
    
    def get_queryset(self):
        queryset = Etapejudiciaire.objects.all()
        affaire_id = self.request.query_params.get('idaffaire', None)
        if affaire_id is not None:
            queryset = queryset.filter(idaffaire=affaire_id)
        return queryset
    
    def destroy(self, request, *args, **kwargs):
        try:
            with transaction.atomic():
                etape = self.get_object()
                etape_id = etape.idetape
                
                print(f"DEBUG: Tentative de suppression de l'étape {etape_id}")
                
                # Vérifie et supprime les statuts d'étape
                statuts_count = StatutEtape.objects.filter(idetape=etape).count()
                print(f"DEBUG: {statuts_count} statuts trouvés pour l'étape {etape_id}")
                StatutEtape.objects.filter(idetape=etape).delete()
                print(f"DEBUG: Statuts supprimés")
                
                # Vérifie et supprime les participations d'experts
                experts_count = Participationexpertetape.objects.filter(idetape=etape).count()
                print(f"DEBUG: {experts_count} participations d'experts trouvées")
                Participationexpertetape.objects.filter(idetape=etape).delete()
                print(f"DEBUG: Participations d'experts supprimées")
                
                # Vérifier et supprimer les participations d'huissiers
                huissiers_count = Participationhuissieretape.objects.filter(idetape=etape).count()
                print(f"DEBUG: {huissiers_count} participations d'huissiers trouvées")
                Participationhuissieretape.objects.filter(idetape=etape).delete()
                print(f"DEBUG: Participations d'huissiers supprimées")
                
                # Vérifier et supprimer les participations de témoins
                temoins_count = Participationtemoinetape.objects.filter(idetape=etape).count()
                print(f"DEBUG: {temoins_count} participations de témoins trouvées")
                Participationtemoinetape.objects.filter(idetape=etape).delete()
                print(f"DEBUG: Participations de témoins supprimées")
                
                # Vérifier et supprimer les paiements d'honoraires
                paiements_count = Paiementhonoraires.objects.filter(idetape=etape).count()
                print(f"DEBUG: {paiements_count} paiements d'honoraires trouvés")
                Paiementhonoraires.objects.filter(idetape=etape).delete()
                print(f"DEBUG: Paiements d'honoraires supprimés")
                
                # Vérifier et supprimer les PV d'exécution
                pv_count = PVExecution.objects.filter(etape=etape).count()
                print(f"DEBUG: {pv_count} PV d'exécution trouvés")
                PVExecution.objects.filter(etape=etape).delete()
                print(f"DEBUG: PV d'exécution supprimés")
                
                # Mettre à jour les affaires qui référencent cette étape comme étape actuelle
                affaires_count = Affairejudiciaire.objects.filter(etape_actuelle=etape).count()
                print(f"DEBUG: {affaires_count} affaires référencent cette étape")
                Affairejudiciaire.objects.filter(etape_actuelle=etape).update(etape_actuelle=None)
                print(f"DEBUG: Références d'affaires mises à jour")
                
                # Vérifier s'il reste des références
                remaining_statuts = StatutEtape.objects.filter(idetape=etape).count()
                if remaining_statuts > 0:
                    print(f"DEBUG: ATTENTION - {remaining_statuts} statuts restent encore!")
                    # Forcer la suppression des statuts restants
                    StatutEtape.objects.filter(idetape=etape).delete()
                    print(f"DEBUG: Statuts restants supprimés de force")
                
                #  supprimer l'étape
                print(f"DEBUG: Suppression de l'étape {etape_id}")
                etape.delete()
                print(f"DEBUG: Étape {etape_id} supprimée avec succès")
                
                return Response({'message': 'Étape supprimée avec succès'}, status=status.HTTP_204_NO_CONTENT)
                
        except Exception as e:
            print(f"DEBUG: Erreur lors de la suppression: {str(e)}")
            import traceback
            print(f"DEBUG: Traceback: {traceback.format_exc()}")
            return Response({'error': f'Erreur lors de la suppression: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

class ExpertViewSet(viewsets.ModelViewSet):
    queryset = Expert.objects.all()
    serializer_class = ExpertSerializer

class FactureViewSet(viewsets.ModelViewSet):
    queryset = Facture.objects.all()
    serializer_class = FactureSerializer

class HuissierViewSet(viewsets.ModelViewSet):
    queryset = Huissier.objects.all()
    serializer_class = HuissierSerializer

class PaiementhonorairesViewSet(viewsets.ModelViewSet):
    queryset = Paiementhonoraires.objects.all()
    serializer_class = PaiementhonorairesSerializer

class ParticipationexpertetapeViewSet(viewsets.ModelViewSet):
    queryset = Participationexpertetape.objects.all()
    serializer_class = ParticipationexpertetapeSerializer

class ParticipationhuissieretapeViewSet(viewsets.ModelViewSet):
    queryset = Participationhuissieretape.objects.all()
    serializer_class = ParticipationhuissieretapeSerializer

class ParticipationtemoinetapeViewSet(viewsets.ModelViewSet):
    queryset = Participationtemoinetape.objects.all()
    serializer_class = ParticipationtemoinetapeSerializer

class TemoinViewSet(viewsets.ModelViewSet):
    queryset = Temoin.objects.all()
    serializer_class = TemoinSerializer


class TypeInterventionViewSet(viewsets.ModelViewSet):
    queryset = TypeIntervention.objects.all()
    serializer_class = TypeInterventionSerializer


class TribunalViewSet(viewsets.ModelViewSet):
    queryset = Tribunal.objects.all()
    # print("queryset :" , queryset)
    serializer_class = TribunalSerializer
    
    def get_queryset(self):
        queryset = Tribunal.objects.all()
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                models.Q(nomtribunal__icontains=search) |
                models.Q(villetribunal__icontains=search) |
                models.Q(adressetribunal__icontains=search)
            )
        return queryset

class TypeTribunalViewSet(viewsets.ModelViewSet):
    queryset = TypeTribunal.objects.all()
    serializer_class = TypeTribunalSerializer
    
    def get_queryset(self):
        queryset = TypeTribunal.objects.all()
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                models.Q(libelletypetribunal__icontains=search) |
                models.Q(code_type__icontains=search)
            )
        return queryset

# Ajout pour les tables de statut et de type
class StatutAffairetribunalViewSet(viewsets.ModelViewSet):
    queryset = StatutAffairetribunal.objects.all()
    serializer_class = StatutAffairetribunalSerializer

class StatutAudienceViewSet(viewsets.ModelViewSet):
    queryset = StatutAudience.objects.all()
    serializer_class = StatutAudienceSerializer

class TypeClientViewSet(viewsets.ModelViewSet):
    queryset = TypeClient.objects.all()
    serializer_class = TypeClientSerializer

class TypeAffaireViewSet(viewsets.ModelViewSet):
    queryset = TypeAffaire.objects.all()
    serializer_class = TypeAffaireSerializer
    
    def get_queryset(self):
        queryset = TypeAffaire.objects.all()
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                models.Q(libelletypeaffaire__icontains=search)
            )
        return queryset

class FonctionClientViewSet(viewsets.ModelViewSet):
    queryset = FonctionClient.objects.all()
    serializer_class = FonctionClientSerializer

class OpposantViewSet(viewsets.ModelViewSet):
    queryset = Opposant.objects.all()
    serializer_class = OpposantSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['nomopposant_fr', 'nomopposant_ar', 'email']


class CategorieAffaireViewSet(viewsets.ModelViewSet):
    queryset = CategorieAffaire.objects.all()
    serializer_class = CategorieAffaireSerializer
    
    def get_queryset(self):
        queryset = CategorieAffaire.objects.all()
        search = self.request.query_params.get('search', None)
        # applique un filtre de recherche souple (case-insensitive, partiel) sur deux champs (libelle et code) grâce aux Q objects.
        if search:
            queryset = queryset.filter(
                models.Q(libelle__icontains=search) |
                models.Q(code__icontains=search)
            )
        return queryset

class TypeAvertissementViewSet(viewsets.ModelViewSet):
    queryset = TypeAvertissement.objects.all()
    serializer_class = TypeAvertissementSerializer
    
    def get_queryset(self):
        queryset = TypeAvertissement.objects.all()
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                models.Q(libelle__icontains=search) |
                models.Q(libelle_ar__icontains=search)
            )
        return queryset

class TypeDemandeViewSet(viewsets.ModelViewSet):
    queryset = TypeDemande.objects.all()
    serializer_class = TypeDemandeSerializer
    
    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                instance = serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def get_queryset(self):
        queryset = TypeDemande.objects.all()
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                models.Q(libelle__icontains=search) |
                models.Q(libelle_ar__icontains=search)
            )
        return queryset


class AffaireOpposantAvocatViewSet(viewsets.ModelViewSet):
    queryset = AffaireOpposantAvocat.objects.all()
    serializer_class = AffaireOpposantAvocatSerializer


# Vues d'API pour des fonctionnalités métier spécifiques

# vue de  suggestion et filtrage selon le code
class ClassificationAffaireView(LanguageMixin, APIView):
    
    def get(self, request):
        lang = self.get_lang(request)
        code = request.query_params.get('code')
        if not code:
            return Response({"error": "Code requis"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            # code exacte
            cat = CategorieAffaire.objects.select_related('sous_type__type_principale').get(code=code)
            # classification complete
            type_principale = cat.sous_type.type_principale
            sous_type = cat.sous_type

            classification = self.localize_struct({
                # keys you want in the response:
            }, {
                "type": (type_principale, "libelle"),
                "categorie": (sous_type, "libelle"),
                "detail": (cat, "libelle"),
                "type_principale": (type_principale, "libelle"),
            }, lang)
            
            # sugg de tribunaux
            logger.info("Classification calculée: %s", classification)
            tribunaux_suggestion = TribunalSuggestionService.get_tribunaux_by_classification(classification) or {}
            tribs = []
            for t in tribunaux_suggestion.get("tribunaux", []):
                print( " ttt ",t)
                tribs.append({
                    "id": (t.get("id") if isinstance(t, dict) else getattr(t, "id", None)) or
                          (t.get("idtribunal") if isinstance(t, dict) else getattr(t, "idtribunal", None)),
                    "nom": self.lbl(t, "nom", lang),
                    "type": self.lbl(t, "type", lang),
                    "ville": self.lbl(t, "ville", lang),
                    "niveau": self.lbl(t, "niveau", lang),
                    "adresse": (t.get("adresse") if isinstance(t, dict) else getattr(t, "adresse", "")) or "",
                    "telephone": (t.get("telephone") if isinstance(t, dict) else getattr(t, "telephone", "")) or "",
                })
            #print("tribstribs    ",tribs)

            return Response({**classification, "tribunaux": tribs}, status=status.HTTP_200_OK)
        # si le  code exacte ne se trouve pas :
        except CategorieAffaire.DoesNotExist:
            qs = (CategorieAffaire.objects
                  .select_related('sous_type__type_principale')
                  .filter(code__startswith=code)[:10])
            suggestions = []
            for s in qs:
                suggestions.append({
                    "code": s.code,
                    "libelle": self.lbl(s, "libelle", lang),
                    "categorie": self.lbl(s.sous_type, "libelle", lang),
                    "type": self.lbl(s.sous_type.type_principale, "libelle", lang),
                })
            return Response({"suggestions": suggestions}, status=status.HTTP_200_OK)

# Vue pour  tribunaux selon le type daffaire
class TribunalSuggestionView(APIView):

    def get(self, request):
        type_affaire = request.query_params.get('type_affaire')
        ville = request.query_params.get('ville')
        mode_appel = request.query_params.get('mode_appel', 'false')
        
        if not type_affaire:
            return Response({"error": "Type d'affaire requis"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Choisir la méthode selon le mode
        if mode_appel == 'true':
            # Pour l'appel : uniquement les cours d'appel
            tribunaux_data = TribunalSuggestionService.get_tribunaux_appel_by_classification({"type": type_affaire})
        else:
            # Pour la création d'affaire : tous les tribunaux
            tribunaux_data = TribunalSuggestionService.get_tribunaux_by_classification({"type": type_affaire})
        
        if not tribunaux_data:
            return Response({"error": "Aucun tribunal trouvé pour ce type d'affaire"}, status=status.HTTP_404_NOT_FOUND)
        
        tribunaux = tribunaux_data["tribunaux"]
        
        # Filtre par ville
        if ville:
            tribunaux = TribunalSuggestionService.filter_tribunaux_by_ville(tribunaux, ville)
        
        #  villes disponibles
        villes_disponibles = TribunalSuggestionService.get_villes_disponibles(tribunaux_data["tribunaux"])
        
        return Response({
            "type_affaire": tribunaux_data["classification"]["type"],
            "tribunaux": tribunaux,
            "villes_disponibles": villes_disponibles,
            "ville_selectionnee": ville
        })

# Vues d'API pour la gestion du processus judiciaire

# vues de etapes

@api_view(['GET'])
def affaire_etape_actuelle(request, affaire_id):
    """Obtenir l'étape actuelle d'une affaire"""
    try:
        affaire = Affairejudiciaire.objects.get(idaffaire=affaire_id)


        etape_actuelle = None
        
        #  Chercher l'étape actuelle assignée à l'affaire
        if hasattr(affaire, 'etape_actuelle') and affaire.etape_actuelle:
            etape_actuelle = affaire.etape_actuelle
            print(f"✅ Étape actuelle trouvée dans l'affaire: {etape_actuelle.idetape}")
        
        # 2. Si pas d'étape assignée, chercher la première étape non terminée
        if not etape_actuelle:
            etape_actuelle = Etapejudiciaire.objects.filter(
                idaffaire=affaire,
                date_fin_effective__isnull=True
            ).order_by('ordre_etape').first()
            
            if etape_actuelle:
                print(f"✅ Étape actuelle trouvée (première non terminée): {etape_actuelle.idetape}")
        
        # 3. Si toujours pas d'étape, utiliser la logique par défaut
        if not etape_actuelle:
            etape_actuelle = get_etape_actuelle_par_phase(affaire)
            if etape_actuelle:
                print(f"✅ Étape actuelle trouvée par logique: {etape_actuelle.idetape}")

        if not etape_actuelle:
            return Response({
                'phase': getattr(affaire, 'phase_processus', 'INITIALE'),
                'etape_actuelle': None,
                'message': 'جميع المراحل مكتملة' if getattr(affaire, 'phase_processus', 'INITIALE') == 'EXECUTION' else 'في انتظار بدء المرحلة'
            })

        return Response({
            'phase': getattr(affaire, 'phase_processus', 'INITIALE'),
            'etape_actuelle': {
                'id': etape_actuelle.idetape,
                'libelle': etape_actuelle.idtypeetape.libelletypeetape if etape_actuelle.idtypeetape else None,
                'libelle_ar': etape_actuelle.idtypeetape.libelletypeetape if etape_actuelle.idtypeetape else None,
                'delai_legal': getattr(etape_actuelle, 'delai_legal', 0),
                'date_limite': None,  # n'existe pas dans votre base
                'ordre': getattr(etape_actuelle, 'ordre_etape', 0)
            },
            'progression': get_progression_phase(affaire)
        })
    except Affairejudiciaire.DoesNotExist:
        return Response({'error': 'Affaire non trouvée'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
def avancer_etape_affaire(request, affaire_id):
    """Avancer d'étape dans une affaire - Redirigé vers completer_etape"""
    try:
        affaire = Affairejudiciaire.objects.get(idaffaire=affaire_id)
        
        # Rediriger vers completer_etape avec l'étape actuelle
        if affaire.etape_actuelle:
            return completer_etape(request, affaire_id, affaire.etape_actuelle.idetape)
        else:
            return Response({
                'message': 'Aucune étape actuelle à terminer',
                'phase': affaire.phase_processus
            })
    except Affairejudiciaire.DoesNotExist:
        return Response({'error': 'Affaire non trouvée'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
def terminer_etape_affaire(request, affaire_id):
    """Terminer l'étape actuelle d'une affaire - Redirigé vers completer_etape"""
    try:
        affaire = Affairejudiciaire.objects.get(idaffaire=affaire_id)
        
        # Rediriger vers completer_etape avec l'étape actuelle
        if affaire.etape_actuelle:
            return completer_etape(request, affaire_id, affaire.etape_actuelle.idetape)
        else:
            return Response({
                'message': 'Aucune étape actuelle à terminer',
                'phase': affaire.phase_processus
            })
    except Affairejudiciaire.DoesNotExist:
        return Response({'error': 'Affaire non trouvée'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
def progression_affaire(request, affaire_id):
    """Obtenir la progression complète d'une affaire"""
    try:
        affaire = Affairejudiciaire.objects.get(idaffaire=affaire_id)
        progression = get_progression_phase(affaire)

        return Response({
            'affaire_id': affaire_id,
            'phase': affaire.phase_processus,
            'progression': progression,
            'pourcentage': len([p for p in progression if p['terminee']]) / len(progression) * 100 if progression else 0
        })
    except Affairejudiciaire.DoesNotExist:
        return Response({'error': 'Affaire non trouvée'}, status=status.HTTP_404_NOT_FOUND)


#  GESTIONNAIRE D'ÉTAPES

@api_view(['GET'])
def affaire_etapes(request, affaire_id):
    """Récupérer les étapes avec indication des étapes optionnelles"""
    try:
        affaire = Affairejudiciaire.objects.get(idaffaire=affaire_id)
        
        # Utiliser la logique existante avec les étapes optionnelles
        etapes = get_etapes_phase_initiale(affaire)
        
        # Ajouter l'information sur les étapes optionnelles
        for etape in etapes:
            etape['optionnel'] = not etape['obligatoire']
            etape['recommandee'] = not etape['obligatoire']  # Pour l'interface
        
        return Response(etapes)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def affaire_etapes_reset(request, affaire_id):
    """Réinitialiser les étapes d'une affaire aux étapes par défaut"""
    try:
        affaire = Affairejudiciaire.objects.get(idaffaire=affaire_id)
        phase = request.data.get('phase', affaire.phase_processus)
        role_client = request.data.get('role_client', 'demandeur')
        
        # Supprimer les étapes existantes
        Etapejudiciaire.objects.filter(idaffaire=affaire).delete()
        
        # Créer les nouvelles étapes selon le contexte
        if phase == 'INITIALE':
            etapes_defaut = get_etapes_phase_initiale(affaire)
        elif phase == 'PROCEDURE':
            etapes_defaut = get_etapes_phase_procedure(affaire)
        else:
            etapes_defaut = []
        
        # Créer les étapes dans la base de données
        for i, etape_defaut in enumerate(etapes_defaut):
            type_etape = TypeEtape.objects.get_or_create(
                libelletypeetape=etape_defaut['nom']
            )[0]
            
            Etapejudiciaire.objects.create(
                idaffaire=affaire,
                idtypeetape=type_etape,
                delai_legal=etape_defaut['delai'],
                ordre_etape=i + 1,
                description_etape=etape_defaut.get('description', '')
            )
        
        return Response({
            'message': 'Étapes réinitialisées avec succès',
            'etapes_count': len(etapes_defaut)
        })
    except Affairejudiciaire.DoesNotExist:
        return Response({'error': 'Affaire non trouvée'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': f'Erreur lors de la réinitialisation: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def tribunaux_appel(request):
    """Obtenir la liste des tribunaux d'appel"""
    try:
        tribunaux = Tribunal.objects.filter(
            idtypetribunal__libelletypetribunal__icontains='appel'
        ).select_related('idtypetribunal')
        
        tribunaux_data = []
        for tribunal in tribunaux:
            tribunaux_data.append({
                'id': tribunal.idtribunal,
                'nom': tribunal.nomtribunal_fr or tribunal.nomtribunal_ar or '',
                'ville': tribunal.ville,
                'type': tribunal.idtypetribunal.libelletypetribunal
            })
        
        return Response(tribunaux_data)
    except Exception as e:
        return Response({'error': f'Erreur lors du chargement des tribunaux: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)



# Vues d'API pour la gestion des affaires en appel

#  GESTIONNAIRE D'APPEL

@api_view(['POST'])
def creer_affaire_appel(request):
    """Créer une nouvelle affaire d'appel liée à une affaire existante"""
    try:
        # Récupérer l'ID de l'affaire parent depuis les données frontend
        affaire_parent_id = request.data.get('affaire_parent')
        idclient = request.data.get('idclient')
        role_client = request.data.get('role_client')
        phase_processus = request.data.get('phase_processus', 'APPEL')
        
        # Récupérer l'affaire parent
        affaire_parent = Affairejudiciaire.objects.get(idaffaire=affaire_parent_id)
        
        # Créer la nouvelle affaire d'appel
        nouvelle_affaire = Affairejudiciaire.objects.create(
            affaire_parent=affaire_parent,
            phase_processus=phase_processus,
            numero_dossier=f"{affaire_parent.numero_dossier}-A",
            code_dossier=affaire_parent.code_dossier,
            annee_dossier=affaire_parent.annee_dossier,
            idclient=idclient,
            idfonctionclient=affaire_parent.idfonctionclient,
            idtypeaffaire=affaire_parent.idtypeaffaire,
            dateouverture=date.today(),
            datecloture=None
        )
        
        return Response({
            'message': 'Affaire d\'appel créée avec succès',
            'idaffaire': nouvelle_affaire.idaffaire,
            'numero_dossier': nouvelle_affaire.numero_dossier
        }, status=status.HTTP_201_CREATED)
    except Affairejudiciaire.DoesNotExist:
        return Response({'error': 'Affaire parent non trouvée'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': f'Erreur lors de la création: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)


# Vues d'API pour la gestion de l'exécution des jugements

#  GESTIONNAIRE D'EXÉCUTION

@api_view(['POST'])
def assigner_huissier_execution(request, affaire_id):
    """Assigner un huissier à l'exécution d'une affaire"""
    try:
        affaire = Affairejudiciaire.objects.get(idaffaire=affaire_id)
        huissier_id = request.data.get('huissier_id')
        
        huissier = Huissier.objects.get(idhuissier=huissier_id)
        
        # Créer ou mettre à jour l'assignation
        Participationhuissieretape.objects.update_or_create(
            idaffaire=affaire,
            idhuissier=huissier,
            defaults={'date_assignment': date.today()}
        )
        
        return Response({
            'message': 'Huissier assigné avec succès',
            'huissier': {
                'id': huissier.idhuissier,
                'nom': huissier.nomhuissier,
                'ville': huissier.ville
            }
        })
    except Affairejudiciaire.DoesNotExist:
        return Response({'error': 'Affaire non trouvée'}, status=status.HTTP_404_NOT_FOUND)
    except Huissier.DoesNotExist:
        return Response({'error': 'Huissier non trouvé'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': f'Erreur lors de l\'assignation: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def enregistrer_contact_execution(request, affaire_id):
    """Enregistrer le résultat du contact avec l'huissier"""
    try:
        affaire = Affairejudiciaire.objects.get(idaffaire=affaire_id)
        resultat = request.data.get('resultat')
        
        # Créer un enregistrement de contact
        ContactExecution.objects.create(
            idaffaire=affaire,
            resultat_contact=resultat,
            date_contact=date.today()
        )
        
        return Response({
            'message': 'Résultat du contact enregistré',
            'resultat': resultat
        })
    except Affairejudiciaire.DoesNotExist:
        return Response({'error': 'Affaire non trouvée'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': f'Erreur lors de l\'enregistrement: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def enregistrer_pv_execution(request, affaire_id):
    # Enregistrer PV d'exécution
    try:
        print(f"=== DEBUG PV EXECUTION ===")
        print(f"Affaire ID: {affaire_id}")
        print(f"Données reçues: {request.data}")
        
        affaire = Affairejudiciaire.objects.get(idaffaire=affaire_id)
        
        etape_id = request.data.get('etape_id')
        type_pv = request.data.get('type_pv')
        
        print(f"Étape ID reçu: {etape_id}")
        print(f"Type PV: {type_pv}")
        
        # Récupérer l'étape ou la créer si elle n'existe pas
        try:
            etape = Etapejudiciaire.objects.get(idetape=etape_id, idaffaire=affaire)
        except Etapejudiciaire.DoesNotExist:
            # Créer une nouvelle étape pour l'exécution
            etape = Etapejudiciaire.objects.create(
                idetape=etape_id,
                idaffaire=affaire,
                datedebut=date.today(),
                delai_legal=30,
                ordre_etape=1,
                etape_obligatoire=True
            )
        

        
        # Créer le PV d'exécution
        pv_data = {
            'etape': etape,
            'type_pv': type_pv,
            'date_pv': date.today(),
            'commentaires': request.data.get('commentaires', '')
        }
        
        # Ajouter les champs spécifiques selon le type
        if type_pv == 'paiement':
            pv_data.update({
                'montant_paye': request.data.get('montant_paye'),
                'mode_paiement': request.data.get('mode_paiement'),
                'numero_recu': request.data.get('numero_recu')
            })
        elif type_pv == 'pv_informatif':
            pv_data.update({
                'motif_absence': request.data.get('motif_absence')
            })
            

        
        # Créer le PV d'exécution dans la table pv_execution
        pv_data = {
            'etape': etape,
            'type_pv': type_pv,
            'date_pv': date.today(),
            'commentaires': request.data.get('commentaires', '')
        }
        
        # Ajouter les champs spécifiques selon le type
        if type_pv == 'paiement':
            pv_data.update({
                'montant_paye': request.data.get('montant_paye'),
                'mode_paiement': request.data.get('mode_paiement'),
                'numero_recu': request.data.get('numero_recu')
            })
        elif type_pv == 'pv_informatif':
            pv_data.update({
                'motif_absence': request.data.get('motif_absence')
            })
            
            # Créer une demande de coercition si demandée
            if request.data.get('demande_coercition'):
                demande = DemandesFichier.objects.create(
                    type_demande='COERCITION',
                    description='Demande de coercition suite à PV informatif',
                    statut='EN_ATTENTE',
                    priorite='URGENTE'
                )
                pv_data['demande_coercition'] = demande
        
        print(f"Données PV à créer: {pv_data}")
        
        pv = PVExecution.objects.create(**pv_data)
        
        print(f"PV créé avec succès - ID: {pv.id}")
        
        return Response({
            'message': 'PV d\'exécution enregistré avec succès',
            'pv_id': pv.id,
            'type': type_pv
        })
    except Affairejudiciaire.DoesNotExist:
        return Response({'error': 'Affaire non trouvée'}, status=status.HTTP_404_NOT_FOUND)
    except Etapejudiciaire.DoesNotExist:
        return Response({'error': 'Étape non trouvée'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': f'Erreur lors de l\'enregistrement du PV: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)





# Endpoint pour récupérer les choix pénaux
@api_view(['GET'])
def get_choix_penaux(request):
    """Récupérer tous les choix disponibles pour les affaires pénales"""
    return Response({
        'autorites_emettrice': AUTORITES_EMETTRICES,
        'types_action_penale': TYPES_ACTION_PENALE,
        'types_jugement': TYPES_JUGEMENT,
        'statuts_execution': STATUTS_EXECUTION,
        'types_execution': TYPES_EXECUTION
    })

@api_view(['POST'])
def update_all_etapes_types(request):
    """Met à jour toutes les étapes existantes qui n'ont pas de type d'étape"""
    try:
        update_existing_etapes_without_type()
        return Response({'message': 'Mise à jour des types d\'étapes terminée'}, status=200)
    except Exception as e:
        return Response({'error': f'Erreur lors de la mise à jour: {str(e)}'}, status=500)


# Vues d'API pour la gestion manuelle des étapes judiciaires

#  GESTION DIRECTE DES ÉTAPES

@api_view(['POST'])
def completer_etape(request, affaire_id, etape_id):
    """Compléter une étape avec observations et date effective"""
    try:
        print(f"=== DEBUG COMPLETER ETAPE ===")
        print(f"Affaire ID: {affaire_id}")
        print(f"Étape ID: {etape_id}")
        print(f"Données reçues: {request.data}")
        
        affaire = Affairejudiciaire.objects.get(idaffaire=affaire_id)
        
        # Récupérer les données de type d'avertissement et de demande
        type_avertissement_id = request.data.get('type_avertissement_id')
        type_demande_id = request.data.get('type_demande_id')
        delai_legal_personnalise = request.data.get('delai_legal')
        
        print(f"Type avertissement ID: {type_avertissement_id}")
        print(f"Type demande ID: {type_demande_id}")
        print(f"Délai légal personnalisé: {delai_legal_personnalise}")
        
        #  délai saisi par l'utilisateur
        delai_final = None
        if delai_legal_personnalise:
            try:
                delai_final = int(delai_legal_personnalise)
                # Limiter le délai à une valeur raisonnable (max 365 jours)
                if delai_final > 365:
                    delai_final = 365
                    print(f"Délai limité à 365 jours (valeur originale: {delai_legal_personnalise})")
                elif delai_final < 0:
                    delai_final = 0
                    print(f"Délai corrigé à 0 (valeur originale: {delai_legal_personnalise})")
            except (ValueError, TypeError):
                delai_final = None
                print(f"Valeur de délai invalide: {delai_legal_personnalise}")
        
        print(f"Délai final: {delai_final}")
        
        # Recherche intelligente d'étapes existantes
        etape = None
        
        # 1. Essayer de trouver l'étape par ID exact
        try:
            etape = Etapejudiciaire.objects.get(idetape=etape_id, idaffaire=affaire)
            print(f"✅ Étape existante trouvée par ID exact: {etape.idetape}")
        except Etapejudiciaire.DoesNotExist:
            print(f"ℹ️ Étape {etape_id} non trouvée par ID exact, recherche par pattern...")
            
            # 2. Essayer de trouver par pattern (etape_X_affaire_Y_hash)
            if '_' in str(etape_id):
                try:
                    etape = Etapejudiciaire.objects.filter(
                        idetape__startswith=f"{etape_id}_{affaire_id}_",
                        idaffaire=affaire
                    ).first()
                    if etape:
                        print(f"✅ Étape trouvée par pattern: {etape.idetape}")
                except Exception as e:
                    print(f"⚠️ Erreur lors de la recherche par pattern: {str(e)}")
            
            # 3. Si toujours pas trouvée, essayer par ordre d'étape
            if not etape:
                try:
                    ordre = int(etape_id.split('_')[1]) if '_' in str(etape_id) else int(etape_id)
                    etape = Etapejudiciaire.objects.filter(
                        idaffaire=affaire,
                        ordre_etape=ordre
                    ).first()
                    if etape:
                        print(f"✅ Étape trouvée par ordre: {etape.idetape} (ordre: {ordre})")
                except (ValueError, IndexError):
                    print(f"ℹ️ Impossible de déterminer l'ordre pour {etape_id}")
        
        # Si l'étape existe, la mettre à jour
        if etape:
            print(f"🔄 Mise à jour de l'étape existante: {etape.idetape}")
            
            # Mettre à jour les données de l'étape existante
            if delai_final is not None:
                etape.delai_legal = delai_final
                print(f"✅ Délai légal mis à jour: {etape.delai_legal}")
            
            if type_avertissement_id:
                try:
                    type_avertissement = TypeAvertissement.objects.get(idtypeavertissement=type_avertissement_id)
                    etape.idtypeavertissement = type_avertissement
                    print(f"✅ Type avertissement mis à jour: {type_avertissement.libelle_fr or type_avertissement.libelle_ar or ''}")
                except TypeAvertissement.DoesNotExist:
                    print(f"⚠️ Type avertissement {type_avertissement_id} non trouvé")
            
            if type_demande_id:
                try:
                    type_demande = TypeDemande.objects.get(idtypedemande=type_demande_id)
                    etape.idtypedemande = type_demande
                    print(f"✅ Type demande mis à jour: {type_demande.libelle_fr or type_demande.libelle_ar or ''}")
                except TypeDemande.DoesNotExist:
                    print(f"⚠️ Type demande {type_demande_id} non trouvé")
            
            # NOUVEAU : S'assurer que l'étape a un type valide
            if not etape.idtypeetape:
                print(f"⚠️ Étape sans type, assignation d'un type par défaut...")
                type_etape_defaut = get_type_etape_by_etape_id(etape_id)
                if type_etape_defaut:
                    etape.idtypeetape = type_etape_defaut
                    print(f"✅ Type d'étape assigné: {type_etape_defaut.libelletypeetape}")
            
            etape.save()
            print(f"✅ Étape existante mise à jour avec succès")
            
        else:
            # Créer une nouvelle étape
            print(f"🆕 Création d'une nouvelle étape pour {etape_id}")
            
            # Générer un ID unique pour la nouvelle étape
            import uuid
            etape_unique_id = f"{etape_id}_{affaire_id}_{uuid.uuid4().hex[:8]}"
            print(f"ID unique généré: {etape_unique_id}")
            
            # NOUVEAU : Utiliser la fonction de mapping au lieu de créer des types
            # Déterminer si c'est une affaire pénale et le rôle du client
            is_affaire_penale = False
            try:
                if affaire.idcategorieaffaire and hasattr(affaire.idcategorieaffaire, 'libelle_fr'):
                    is_affaire_penale = (affaire.idcategorieaffaire.libelle_fr or affaire.idcategorieaffaire.libelle_ar or '').lower() in ['penal', 'pénal', 'penale', 'pénale']
            except:
                pass
            
            # Déterminer le rôle du client selon sa fonction
            from .services import get_role_client_from_fonction
            role_client = get_role_client_from_fonction(affaire)
            
            print(f"🔍 DEBUG: is_affaire_penale = {is_affaire_penale}")
            print(f"🔍 DEBUG: role_client = {role_client}")
            print(f"🔍 DEBUG: etape_id = {etape_id}")
            
            # Déterminer la phase selon les données reçues
            phase = "INITIALE"  # Par défaut
            
            print(f"🔍 DEBUG: Appel get_type_etape_by_etape_id avec phase={phase}, role={role_client}")
            
            # NOUVELLE LOGIQUE: Utiliser la logique unifiée pour déterminer le type d'étape
            from .services import get_etapes_phase_initiale, get_etapes_phase_procedure
            
            type_etape = None
            
            # Déterminer la phase de l'affaire
            affaire_phase = getattr(affaire, 'phase_processus', 'INITIALE')
            print(f"🔍 DEBUG: Phase de l'affaire: {affaire_phase}")
            print(f"🔍 DEBUG: Début de la logique de mapping pour etape_id: {etape_id}")
            
            if affaire_phase == 'INITIALE':
                print(f"🔍 DEBUG: Phase INITIALE détectée")
                etapes_phase = get_etapes_phase_initiale(affaire)
                print(f"🔍 DEBUG: Étapes phase initiale: {etapes_phase}")
                print(f"🔍 DEBUG: Nombre d'étapes: {len(etapes_phase)}")
                
                # Chercher l'étape correspondante
                if etape_id.startswith('etape_'):
                    try:
                        index = int(etape_id.split('_')[1])
                        print(f"🔍 DEBUG: Index extrait: {index}")
                        if index < len(etapes_phase):
                            libelle_etape = etapes_phase[index]['libelle_ar']
                            print(f"🔍 DEBUG: Libellé étape trouvé: {libelle_etape}")
                            
                            # Chercher le type d'étape correspondant
                            type_etape = TypeEtape.objects.filter(libelletypeetape=libelle_etape).first()
                            if type_etape:
                                print(f"✅ Type d'étape trouvé: {type_etape.idtypeetape} - {type_etape.libelletypeetape}")
                            else:
                                print(f"❌ Type d'étape non trouvé pour: {libelle_etape}")
                        else:
                            print(f"❌ Index {index} hors limites (max: {len(etapes_phase)-1})")
                    except (ValueError, IndexError) as e:
                        print(f"❌ Impossible de déterminer l'index pour: {etape_id} - Erreur: {str(e)}")
                else:
                    print(f"❌ etape_id ne commence pas par 'etape_': {etape_id}")
            
            elif affaire_phase == 'PROCEDURE':
                etapes_phase = get_etapes_phase_procedure(affaire)
                print(f"🔍 DEBUG: Étapes phase procédure: {etapes_phase}")
                
                # Chercher l'étape correspondante
                if etape_id.startswith('etape_'):
                    try:
                        index = int(etape_id.split('_')[1])
                        if index < len(etapes_phase):
                            libelle_etape = etapes_phase[index][0]  # Format tuple (libelle, delai)
                            print(f"🔍 DEBUG: Libellé étape trouvé: {libelle_etape}")
                            
                            # Chercher le type d'étape correspondant
                            type_etape = TypeEtape.objects.filter(libelletypeetape=libelle_etape).first()
                            if type_etape:
                                print(f"✅ Type d'étape trouvé: {type_etape.idtypeetape} - {type_etape.libelletypeetape}")
                            else:
                                print(f"❌ Type d'étape non trouvé pour: {libelle_etape}")
                    except (ValueError, IndexError):
                        print(f"❌ Impossible de déterminer l'index pour: {etape_id}")
            
            # Fallback vers l'ancienne méthode si pas trouvé
            if not type_etape:
                print(f"🔍 DEBUG: Fallback vers get_type_etape_by_etape_id")
                type_etape = get_type_etape_by_etape_id(etape_id, phase, role_client)
            
            print(f"🔍 DEBUG: type_etape = {type_etape}")
            print(f"Type d'étape assigné: {type_etape.libelletypeetape if type_etape else 'Aucun'}")
            
            # Vérifier que le type d'étape existe bien en base
            if type_etape:
                try:
                    type_etape_verifie = TypeEtape.objects.get(idtypeetape=type_etape.idtypeetape)
                    print(f"✅ Type d'étape vérifié en base: {type_etape_verifie.idtypeetape} - {type_etape_verifie.libelletypeetape}")
                except TypeEtape.DoesNotExist:
                    print(f"❌ ERREUR: Type d'étape {type_etape.idtypeetape} n'existe pas en base!")
                    # Essayer de récupérer un type par défaut
                    type_etape_defaut = TypeEtape.objects.first()
                    if type_etape_defaut:
                        type_etape = type_etape_defaut
                        print(f"✅ Type d'étape par défaut assigné: {type_etape.libelletypeetape}")
                    else:
                        print(f"❌ Aucun type d'étape disponible en base!")
                        return Response({'error': 'Aucun type d\'étape disponible en base de données'}, status=400)
            else:
                print(f"❌ ERREUR: Aucun type d'étape trouvé pour {etape_id}")
                # Essayer de récupérer un type par défaut
                type_etape_defaut = TypeEtape.objects.first()
                if type_etape_defaut:
                    type_etape = type_etape_defaut
                    print(f"✅ Type d'étape par défaut assigné: {type_etape.libelletypeetape}")
                else:
                    print(f"❌ Aucun type d'étape disponible en base!")
                    return Response({'error': 'Aucun type d\'étape disponible en base de données'}, status=400)
            
            # Préparer les données pour la création d'étape
            etape_data = {
                'idetape': etape_unique_id,
                'idaffaire': affaire,
                'idtypeetape': type_etape,
                'datedebut': date.today(),
                'ordre_etape': int(etape_id.split('_')[1]) if '_' in etape_id else 0,
                'etape_obligatoire': True
            }
            
            print(f"Données de base: {etape_data}")
            
            # Ajouter le délai légal seulement s'il est fourni
            if delai_final is not None:
                etape_data['delai_legal'] = delai_final
                print(f"Délai légal ajouté: {delai_final}")
            
            # Ajouter les types personnalisés si fournis
            if type_avertissement_id:
                try:
                    type_avertissement = TypeAvertissement.objects.get(idtypeavertissement=type_avertissement_id)
                    etape_data['idtypeavertissement'] = type_avertissement
                    print(f"Type avertissement ajouté: {type_avertissement.libelle_fr or type_avertissement.libelle_ar or ''}")
                except TypeAvertissement.DoesNotExist:
                    print(f"Type avertissement {type_avertissement_id} non trouvé")
                    pass
            if type_demande_id:
                try:
                    type_demande = TypeDemande.objects.get(idtypedemande=type_demande_id)
                    etape_data['idtypedemande'] = type_demande
                    print(f"Type demande ajouté: {type_demande.libelle_fr or type_demande.libelle_ar or ''}")
                except TypeDemande.DoesNotExist:
                    print(f"Type demande {type_demande_id} non trouvé")
                    pass
            
            print(f"Données finales: {etape_data}")
            
            # NOUVEAU : Vérifier que l'étape a un type valide avant de la créer
            if not etape_data.get('idtypeetape'):
                print(f"⚠️ ATTENTION: L'étape n'a pas de type d'étape assigné!")
                # Essayer de récupérer un type par défaut
                try:
                    type_etape_defaut = TypeEtape.objects.first()
                    if type_etape_defaut:
                        etape_data['idtypeetape'] = type_etape_defaut
                        print(f"✅ Type d'étape par défaut assigné: {type_etape_defaut.libelletypeetape}")
                    else:
                        print(f"❌ Aucun type d'étape disponible en base!")
                        return Response({'error': 'Aucun type d\'étape disponible en base de données'}, status=400)
                except Exception as e:
                    print(f"❌ Erreur lors de la récupération du type d'étape par défaut: {str(e)}")
                    return Response({'error': f'Erreur lors de la récupération du type d\'étape: {str(e)}'}, status=400)
            
            # Vérification supplémentaire avant création
            if not etape_data.get('idtypeetape'):
                print(f"❌ ERREUR CRITIQUE: Impossible d'assigner un type d'étape!")
                return Response({'error': 'Impossible d\'assigner un type d\'étape à cette étape'}, status=400)
            
            print(f"🔍 DEBUG: Tentative de création de l'étape avec les données: {etape_data}")
            try:
                etape = Etapejudiciaire.objects.create(**etape_data)
                print(f"✅ Étape créée avec succès: {etape.idetape}")
            except Exception as e:
                print(f"❌ ERREUR lors de la création de l'étape: {str(e)}")
                print(f"❌ Traceback complet:")
                import traceback
                print(traceback.format_exc())
                return Response({'error': f'Erreur lors de la création de l\'étape: {str(e)}'}, status=400)
            print(f"✅ Type d'étape: {etape.idtypeetape.libelletypeetape if etape.idtypeetape else 'Aucun'}")
            print(f"✅ Délai légal: {etape.delai_legal}")
            print(f"✅ Type avertissement: {etape.idtypeavertissement}")
        
        observations = request.data.get('observations', '')
        # Saisie libre du nom de l'avocat du demandeur; on le stocke au niveau de l'affaire
        avocat_demandeur_nom = request.data.get('avocat_demandeur_nom')
        if avocat_demandeur_nom:
            affaire.avocat_demandeur_nom = avocat_demandeur_nom
            affaire.save(update_fields=['avocat_demandeur_nom'])
        date_effective = request.data.get('date_effective')
        
        # NOUVELLE LOGIQUE : Gestion des étapes pénales opposant - DÉPLACÉ ICI POUR S'EXÉCUTER TOUJOURS
        print(f"=== DEBUG DONNÉES PÉNALES ===")
        print(f"autorite_emettrice reçu: {request.data.get('autorite_emettrice')}")
        print(f"type_action_penale reçu: {request.data.get('type_action_penale')}")
        print(f"Toutes les données reçues: {request.data}")
        
        # NOUVELLE LOGIQUE : Détection des étapes pénales (INITIALE, PROCEDURE, EXECUTION)
        autorite = request.data.get('autorite_emettrice')
        type_action = request.data.get('type_action_penale')
        execution_faite = request.data.get('execution_faite')
        date_execution = request.data.get('date_execution')
        type_execution = request.data.get('type_execution')
        observations_defense = request.data.get('observations_defense')
        jugement = request.data.get('jugement')
        
        # Vérifier si c'est une étape pénale (INITIALE, PROCEDURE, ou EXECUTION)
        is_etape_penale = (
            (autorite and type_action) or  # Phase INITIALE
            (observations_defense or jugement) or  # Phase PROCEDURE
            (execution_faite or date_execution or type_execution)  # Phase EXECUTION
        )
        
        print(f"🔍 DEBUG: autorite = '{autorite}'")
        print(f"🔍 DEBUG: type_action = '{type_action}'")
        print(f"🔍 DEBUG: execution_faite = '{execution_faite}'")
        print(f"🔍 DEBUG: date_execution = '{date_execution}'")
        print(f"🔍 DEBUG: type_execution = '{type_execution}'")
        print(f"🔍 DEBUG: observations_defense = '{observations_defense}'")
        print(f"🔍 DEBUG: jugement = '{jugement}'")
        print(f"🔍 DEBUG: is_etape_penale = {is_etape_penale}")
        
        if is_etape_penale:
            print(f"✅ Traitement des données pénales")
            # Validation des choix pénaux (seulement si phase INITIALE)
            if autorite and type_action:
                autorites_valides = [choice[0] for choice in AUTORITES_EMETTRICES]
                types_valides = [choice[0] for choice in TYPES_ACTION_PENALE]
                
                print(f"✅ Autorité reçue: '{autorite}'")
                print(f"✅ Type action reçu: '{type_action}'")
                print(f"✅ Autorités valides: {autorites_valides}")
                print(f"✅ Types valides: {types_valides}")
                
                if autorite not in autorites_valides:
                    print(f"❌ Autorité invalide: '{autorite}'")
                    return Response({'error': f'Autorité émettrice invalide: {autorite}'}, status=400)
                
                if type_action not in types_valides:
                    print(f"❌ Type action invalide: '{type_action}'")
                    return Response({'error': f'Type d\'action pénale invalide: {type_action}'}, status=400)
            
            # Validation du jugement si fourni
            jugement = request.data.get('jugement')
            if jugement:
                jugements_valides = [choice[0] for choice in TYPES_JUGEMENT]
                if jugement not in jugements_valides:
                    print(f"❌ Jugement invalide: '{jugement}'")
                    return Response({'error': f'Jugement invalide: {jugement}'}, status=400)
            
            # Validation du type d'exécution si fourni
            type_execution = request.data.get('type_execution')
            if type_execution:
                types_execution_valides = [choice[0] for choice in TYPES_EXECUTION]
                if type_execution not in types_execution_valides:
                    print(f"❌ Type d'exécution invalide: '{type_execution}'")
                    return Response({'error': f'Type d\'exécution invalide: {type_execution}'}, status=400)
            
            print(f"✅ Validation réussie, traitement des données...")
            
            # Récupérer les fichiers PDF si fournis
            convocation_pdf = request.FILES.get('convocation_pdf') if request.FILES else None
            documents_defense = request.FILES.get('documents_defense') if request.FILES else None
            document_execution = request.FILES.get('document_execution') if request.FILES else None
            print(f"✅ Fichier convocation PDF reçu: {convocation_pdf}")
            print(f"✅ Fichier documents défense PDF reçu: {documents_defense}")
            print(f"✅ Fichier document exécution PDF reçu: {document_execution}")
            
            # DEBUG : Vérifier si on est dans une étape d'exécution
            execution_faite = request.data.get('execution_faite')
            date_execution = request.data.get('date_execution')
            print(f"🔍 DEBUG: execution_faite = {execution_faite}")
            print(f"🔍 DEBUG: date_execution = {date_execution}")
            print(f"🔍 DEBUG: documents_defense présent = {documents_defense is not None}")
            print(f"🔍 DEBUG: document_execution présent = {document_execution is not None}")
            
            # Encoder les données pénale dans les champs existants
            donnees_penales = {
                "autorite_emettrice": autorite,
                "type_action_penale": type_action,
                "date_convocation_arrestation": request.data.get('date_convocation_arrestation'),
                "audition_police_faite": request.data.get('audition_police_faite', False),
                "observations_penales": request.data.get('observations_penales', ''),
                # NOUVEAU : Données pour la phase PROCEDURE
                "observations_defense": request.data.get('observations_defense', ''),
                "jugement": request.data.get('jugement', ''),
                # NOUVEAU : Données pour la phase EXECUTION
                "execution_faite": request.data.get('execution_faite', False),
                "date_execution": request.data.get('date_execution', ''),
                "details_execution": request.data.get('details_execution', ''),
                "observations_execution": request.data.get('observations_execution', ''),
                "motif_non_execution": request.data.get('motif_non_execution', ''),
                "type_execution": request.data.get('type_execution', ''),
                "date_creation": str(date.today())
            }
            print(f"✅ Données pénales préparées: {donnees_penales}")
            
            try:
                import json
                # Stocker dans description_etape (champ existant)
                etape.description_etape = json.dumps(donnees_penales, ensure_ascii=False)
                print(f"✅ Données pénales stockées dans description_etape: {etape.description_etape}")
                
                # Stocker les métadonnées dans documents_requis (champ existant)
                metadonnees = {
                    "type_intervention": "PENALE_OPPOSANT",
                    "autorite": autorite,
                    "type_action": type_action,
                    "audition_statut": "FAITE" if request.data.get('audition_police_faite') else "NON_FAITE"
                }
                etape.documents_requis = json.dumps(metadonnees, ensure_ascii=False)
                print(f"✅ Métadonnées stockées dans documents_requis: {etape.documents_requis}")
                
                # Mettre à jour la date de début si fournie
                if request.data.get('date_convocation_arrestation'):
                    etape.datedebut = request.data.get('date_convocation_arrestation')
                    print(f"✅ Date de début mise à jour: {etape.datedebut}")
                
                # Stocker les observations dans le champ observations_etape
                observations_penales = request.data.get('observations_penales', '')
                observations_defense = request.data.get('observations_defense', '')
                observations_execution = request.data.get('observations_execution', '')
                motif_non_execution = request.data.get('motif_non_execution', '')
                
                # Priorité aux observations d'exécution si elles existent
                if observations_execution:
                    etape.observations_etape = observations_execution
                    print(f"✅ Observations exécution sauvegardées dans observations_etape: {observations_execution}")
                elif motif_non_execution:
                    etape.observations_etape = motif_non_execution
                    print(f"✅ Motif non-exécution sauvegardé dans observations_etape: {motif_non_execution}")
                elif observations_defense:
                    etape.observations_etape = observations_defense
                    print(f"✅ Observations défense sauvegardées dans observations_etape: {observations_defense}")
                elif observations_penales:
                    etape.observations_etape = observations_penales
                    print(f"✅ Observations pénale sauvegardées dans observations_etape: {observations_penales}")
                
                # Gérer l'upload du fichier PDF de convocation/arrestation
                if convocation_pdf:
                    try:
                        import uuid
                        file_extension = convocation_pdf.name.split('.')[-1]
                        filename = f"convocation_penale_{affaire.idaffaire}_{uuid.uuid4().hex[:8]}.{file_extension}"
                        
                        from django.conf import settings
                        import os
                        
                        file_path = os.path.join(settings.MEDIA_ROOT, 'convocations_penales', filename)
                        os.makedirs(os.path.dirname(file_path), exist_ok=True)
                        
                        with open(file_path, 'wb+') as destination:
                            for chunk in convocation_pdf.chunks():
                                destination.write(chunk)
                        
                        fichier = Fichier.objects.create(
                            nom_fichier=filename,
                            chemin_fichier=f'convocations_penales/{filename}',
                            type_fichier='convocation_penale',
                            idaffaire=affaire,
                            date_upload=date.today()
                        )
                        
                        # Ajouter le nom du fichier aux données JSON
                        donnees_penales["fichier_pdf"] = filename
                        print(f"✅ Fichier convocation PDF sauvegardé: {filename}")
                        
                    except Exception as e:
                        print(f"❌ Erreur lors de la sauvegarde du fichier convocation PDF: {str(e)}")
                
                # Gérer l'upload du fichier PDF de documents de défense
                if documents_defense:
                    print(f"🔍 DEBUG: documents_defense détecté: {documents_defense.name}")
                    try:
                        import uuid
                        file_extension = documents_defense.name.split('.')[-1]
                        filename = f"documents_defense_{affaire.idaffaire}_{uuid.uuid4().hex[:8]}.{file_extension}"
                        
                        from django.conf import settings
                        import os
                        
                        print(f"🔍 DEBUG: MEDIA_ROOT = {settings.MEDIA_ROOT}")
                        file_path = os.path.join(settings.MEDIA_ROOT, 'documents_defense', filename)
                        print(f"🔍 DEBUG: Chemin complet = {file_path}")
                        print(f"🔍 DEBUG: Dossier parent = {os.path.dirname(file_path)}")
                        
                        os.makedirs(os.path.dirname(file_path), exist_ok=True)
                        print(f"✅ DEBUG: Dossier créé avec succès")
                        
                        with open(file_path, 'wb+') as destination:
                            for chunk in documents_defense.chunks():
                                destination.write(chunk)
                        
                        fichier = Fichier.objects.create(
                            nom_fichier=filename,
                            chemin_fichier=f'documents_defense/{filename}',
                            type_fichier='documents_defense',
                            idaffaire=affaire,
                            date_upload=date.today()
                        )
                        
                        # Ajouter le nom du fichier aux données JSON
                        donnees_penales["fichier_documents_defense"] = filename
                        print(f"✅ Fichier documents défense PDF sauvegardé: {filename}")
                        
                    except Exception as e:
                        print(f"❌ Erreur lors de la sauvegarde du fichier documents défense PDF: {str(e)}")
                
                # Gérer l'upload du fichier PDF d'exécution
                if document_execution:
                    try:
                        import uuid
                        file_extension = document_execution.name.split('.')[-1]
                        filename = f"document_execution_{affaire.idaffaire}_{uuid.uuid4().hex[:8]}.{file_extension}"
                        
                        from django.conf import settings
                        import os
                        
                        file_path = os.path.join(settings.MEDIA_ROOT, 'execution_penale', filename)
                        os.makedirs(os.path.dirname(file_path), exist_ok=True)
                        
                        with open(file_path, 'wb+') as destination:
                            for chunk in document_execution.chunks():
                                destination.write(chunk)
                        
                        fichier = Fichier.objects.create(
                            nom_fichier=filename,
                            chemin_fichier=f'execution_penale/{filename}',
                            type_fichier='document_execution',
                            idaffaire=affaire,
                            date_upload=date.today()
                        )
                        
                        # Ajouter le nom du fichier aux données JSON
                        donnees_penales["fichier_document_execution"] = filename
                        print(f"✅ Fichier document exécution PDF sauvegardé: {filename}")
                        
                    except Exception as e:
                        print(f"❌ Erreur lors de la sauvegarde du fichier document exécution PDF: {str(e)}")
                
                # Mettre à jour le JSON final avec toutes les données
                etape.description_etape = json.dumps(donnees_penales, ensure_ascii=False)
                
                # Mettre à jour les métadonnées
                metadonnees = {
                    "type_intervention": "PENALE_OPPOSANT_EXECUTION" if request.data.get('execution_faite') or request.data.get('date_execution') else ("PENALE_OPPOSANT_PROCEDURE" if request.data.get('observations_defense') or request.data.get('jugement') else "PENALE_OPPOSANT_INITIALE"),
                    "autorite": autorite,
                    "type_action": type_action,
                    "audition_statut": "FAITE" if request.data.get('audition_police_faite') else "NON_FAITE",
                    "jugement": request.data.get('jugement', ''),
                    "execution_faite": request.data.get('execution_faite', False),
                    "type_execution": request.data.get('type_execution', '')
                }
                etape.documents_requis = json.dumps(metadonnees, ensure_ascii=False)
                
                print(f"✅ Tentative de sauvegarde de l'étape...")
                etape.save()
                print(f"✅ Étape sauvegardée avec les données pénales")
                
            except Exception as e:
                print(f"❌ Erreur lors de la sauvegarde: {str(e)}")
                return Response({'error': f'Erreur lors de la sauvegarde: {str(e)}'}, status=400)
        else:
            print(f"❌ Pas de données pénales détectées")
        
        # Récupérer les données du huissier et de l'opposant si fournies
        huissier_id = request.data.get('huissier_id')
        opposant_id = request.data.get('opposant_id')
        
        # Récupérer les données de délibération si fournies
        type_deliberation = request.data.get('type_deliberation', None)
        type_intervention = request.data.get('type_intervention', None)
        intervenant_inspection = request.data.get('intervenant_inspection', None)
        type_expertise = request.data.get('type_expertise', None)
        expert_selection = request.data.get('expert_selection', None)
        
        # Récupérer les données des témoins si fournies
        temoins = request.data.get('temoins', [])
        
        # Construire les observations avec les détails de délibération
        observations_completes = observations or ""
        
        if type_deliberation:
            observations_completes += f"\n\n=== DÉTAILS DE LA DÉLIBÉRATION ===\n"
            observations_completes += f"Type de décision: {type_deliberation}\n"
            
            if type_deliberation == "inspection" and type_intervention:
                observations_completes += f"Type d'intervention: {type_intervention}\n"
                if intervenant_inspection:
                    observations_completes += f"Intervenant: {intervenant_inspection}\n"
                    
            elif type_deliberation == "expertise" and type_expertise:
                observations_completes += f"Type d'expertise: {type_expertise}\n"
                if expert_selection:
                    observations_completes += f"Expert sélectionné: {expert_selection}\n"
        
        # Ajouter les détails des témoins si présents
        if temoins:
            observations_completes += f"\n\n=== TÉMOINS PRÉSENTS ===\n"
            for i, temoin in enumerate(temoins, 1):
                observations_completes += f"Témoin {i}:\n"
                observations_completes += f"  - Nom: {temoin.get('nom', 'Non spécifié')}\n"
                observations_completes += f"  - Rôle: {temoin.get('role', 'Non spécifié')}\n"
                if temoin.get('adresse'):
                    observations_completes += f"  - Adresse: {temoin['adresse']}\n"
                if temoin.get('telephone'):
                    observations_completes += f"  - Téléphone: {temoin['telephone']}\n"
                observations_completes += "\n"
            
            # Créer les témoins en base de données
            for temoin_data in temoins:
                # Générer un ID unique pour le témoin
                temoin_id = f"T{date.today().strftime('%Y%m%d')}_{len(Temoin.objects.all()) + 1}"
                
                # Créer le témoin
                temoin = Temoin.objects.create(
                    idtemoin=temoin_id,
                    nomtemoin=temoin.get('nom', ''),
                    adressetemoin=temoin.get('adresse', ''),
                    roletemoin=temoin.get('role', ''),
                    telephonetemoin=temoin.get('telephone', '')
                )
                
                # Créer la participation du témoin à l'étape
                Participationtemoinetape.objects.create(
                    idetape=etape,
                    idtemoin=temoin,
                    dateintervention=date.today(),
                    typeintervention="Témoignage lors de l'audience"
                )
        
        # Récupérer les données d'audience selon l'étape
        tribunal_id = request.data.get('tribunal_id')
        date_audience = request.data.get('date_audience')
        heure_audience = request.data.get('heure_audience')
        
        # Données pour audience pénale
        tribunal_audience_penale_id = request.data.get('tribunal_audience_penale_id')
        date_audience_penale = request.data.get('date_audience_penale')
        heure_audience_penale = request.data.get('heure_audience_penale')
        
        print(f"=== DEBUG DONNÉES AUDIENCE ===")
        print(f"Données convocation: tribunal_id={tribunal_id}, date_audience={date_audience}, heure_audience={heure_audience}")
        print(f"Données pénale: tribunal_audience_penale_id={tribunal_audience_penale_id}, date_audience_penale={date_audience_penale}, heure_audience_penale={heure_audience_penale}")
        print(f"Tous les champs: {list(request.data.keys())}")
        
        # Récupérer les données de plainte si c'est l'étape "استلام شكاية"
        contenu_plainte = request.data.get('contenu_plainte')
        delai_reponse = request.data.get('delai_reponse')
        
        # Récupérer les données de représentation si c'est l'étape "تقديم تمثيل"
        resume_contenu = request.data.get('resume_contenu')
        date_soumission = request.data.get('date_soumission')
        
        # Récupérer les données de délibération si c'est l'étape "مداولة"
        conclusion_definitives = request.data.get('conclusion_definitives')
        
        # Récupérer les données de réponse si c'est l'étape "رد على المقال"
        resume_reponse = request.data.get('resume_reponse')
        
        # Récupérer les données de plainte pénale si c'est l'étape "شكاية"
        resume_faits = request.data.get('resume_faits')
        plainte_pdf = request.FILES.get('plainte_pdf') if request.FILES else None
        docs_supplementaires = request.FILES.getlist('docs_supplementaires') if request.FILES else None
        temoins_a_ajouter = request.data.get('temoins_a_ajouter', [])
        
        # Debug pour voir toutes les données reçues
        print(f"=== DEBUG DONNEES RECUES ===")
        print(f"Toutes les données reçues: {request.data}")
        print(f"contenu_plainte: '{contenu_plainte}'")
        print(f"delai_reponse: '{delai_reponse}'")
        print(f"resume_contenu: '{resume_contenu}'")
        print(f"date_soumission: '{date_soumission}'")
        print(f"conclusion_definitives: '{conclusion_definitives}'")
        print(f"resume_reponse: '{resume_reponse}'")
        print(f"resume_faits: '{resume_faits}'")
        print(f"plainte_pdf: {plainte_pdf}")
        print(f"docs_supplementaires: {docs_supplementaires}")
        print(f"temoins_a_ajouter: {temoins_a_ajouter}")
        
        # Debug pour vérifier le type d'étape
        print(f"=== DEBUG TYPE ETAPE ===")
        print(f"Étape ID: {etape.idetape}")
        print(f"Type étape: {etape.idtypeetape}")
        if etape.idtypeetape:
            print(f"Libellé type étape: '{etape.idtypeetape.libelletypeetape}'")
            print(f"Comparaison avec 'استدعاء للمثول': {etape.idtypeetape.libelletypeetape == 'استدعاء للمثول'}")
        
        # Traitement des données de plainte pénale pour l'étape "شكاية" - AVANT TOUTE AUTRE TRAITEMENT
        if etape.idtypeetape and etape.idtypeetape.libelletypeetape == "شكاية":
            print(f"Traitement des données de plainte pénale pour l'étape شكاية")
            print(f"Résumé faits: {resume_faits}")
            print(f"Plainte PDF: {plainte_pdf}")
            print(f"Docs supplémentaires: {docs_supplementaires}")
            
            # Stocker le résumé des faits dans le champ description_etape de l'étape
            if resume_faits:
                print(f"=== DEBUG AVANT MODIFICATION ===")
                print(f"description_etape avant: '{etape.description_etape}'")
                etape.description_etape = resume_faits
                print(f"=== DEBUG APRÈS MODIFICATION ===")
                print(f"description_etape après: '{etape.description_etape}'")
                print(f"✅ Résumé des faits stocké dans description_etape: {resume_faits}")
            
            # Ajouter les autres informations aux observations
            if plainte_pdf or docs_supplementaires:
                observations_completes += f"\n\n=== DONNEES PLAINTE PENALE ===\n"
                
                # Gérer l'upload de la plainte PDF
                if plainte_pdf:
                    try:
                        import uuid
                        file_extension = plainte_pdf.name.split('.')[-1]
                        filename = f"plainte_penale_{affaire.idaffaire}_{uuid.uuid4().hex[:8]}.{file_extension}"
                        
                        from django.conf import settings
                        import os
                        
                        file_path = os.path.join(settings.MEDIA_ROOT, 'plaintes_penales', filename)
                        os.makedirs(os.path.dirname(file_path), exist_ok=True)
                        
                        with open(file_path, 'wb+') as destination:
                            for chunk in plainte_pdf.chunks():
                                destination.write(chunk)
                        
                        fichier = Fichier.objects.create(
                            nom_fichier=filename,
                            chemin_fichier=f'plaintes_penales/{filename}',
                            type_fichier='plainte_penale',
                            idaffaire=affaire,
                            date_upload=date.today()
                        )
                        
                        observations_completes += f"Plainte PDF: {filename}\n"
                        print(f"✅ Plainte PDF sauvegardée: {filename}")
                        
                    except Exception as e:
                        print(f"❌ Erreur lors de la sauvegarde de la plainte PDF: {str(e)}")
                        observations_completes += f"Erreur upload plainte PDF: {str(e)}\n"
                
                # Gérer l'upload des documents supplémentaires
                if docs_supplementaires:
                    try:
                        for i, doc in enumerate(docs_supplementaires):
                            import uuid
                            file_extension = doc.name.split('.')[-1]
                            filename = f"doc_supp_{affaire.idaffaire}_{uuid.uuid4().hex[:8]}.{file_extension}"
                            
                            from django.conf import settings
                            import os
                            
                            file_path = os.path.join(settings.MEDIA_ROOT, 'docs_supplementaires', filename)
                            os.makedirs(os.path.dirname(file_path), exist_ok=True)
                            
                            with open(file_path, 'wb+') as destination:
                                for chunk in doc.chunks():
                                    destination.write(chunk)
                            
                            fichier = Fichier.objects.create(
                                nom_fichier=filename,
                                chemin_fichier=f'docs_supplementaires/{filename}',
                                type_fichier='doc_supplementaire',
                                idaffaire=affaire,
                                date_upload=date.today()
                            )
                            
                            observations_completes += f"Document supplémentaire {i+1}: {filename}\n"
                            print(f"✅ Document supplémentaire {i+1} sauvegardé: {filename}")
                            
                    except Exception as e:
                        print(f"❌ Erreur lors de la sauvegarde des documents supplémentaires: {str(e)}")
                        observations_completes += f"Erreur upload docs supplémentaires: {str(e)}\n"
                
                # Créer les participations des témoins après la création de l'étape
                if temoins_a_ajouter and len(temoins_a_ajouter) > 0:
                    print(f"Création des participations pour {len(temoins_a_ajouter)} témoins")
                    for temoin_id in temoins_a_ajouter:
                        try:
                            from .models import Participationtemoinetape
                            participation_data = {
                                'idetape': etape,
                                'idtemoin_id': temoin_id,
                                'dateintervention': date.today(),
                            }
                            Participationtemoinetape.objects.create(**participation_data)
                            print(f"✅ Participation créée pour le témoin {temoin_id}")
                        except Exception as e:
                            print(f"❌ Erreur lors de la création de la participation pour le témoin {temoin_id}: {str(e)}")
        
        # Traitement des étapes pénales de la phase PROCÉDURE
        # 1. Étape "التحقيق الأولي" (Enquête préliminaire)
        if etape.idtypeetape and etape.idtypeetape.libelletypeetape == "التحقيق الأولي":
            print(f"Traitement des données d'enquête préliminaire pour l'étape التحقيق الأولي")
            
            # Récupérer les données de l'enquête préliminaire
            enquete_effectuee = request.data.get('enquete_effectuee', False)
            observations_enquete = request.data.get('observations_enquete', '')
            
            print(f"Enquête effectuée: {enquete_effectuee}")
            print(f"Observations enquête: {observations_enquete}")
            
            # Construire les observations pour l'enquête préliminaire
            observations_enquete_completes = f"\n\n=== ENQUÊTE PRÉLIMINAIRE ===\n"
            observations_enquete_completes += f"Enquête préliminaire effectuée: {enquete_effectuee}\n"
            if observations_enquete:
                observations_enquete_completes += f"Observations: {observations_enquete}\n"
            
            observations_completes += observations_enquete_completes
            print(f"✅ Données d'enquête préliminaire ajoutées aux observations")
        
        # 2. Étape "قرار النيابة العامة" (Décision du parquet)
        elif etape.idtypeetape and etape.idtypeetape.libelletypeetape == "قرار النيابة العامة":
            print(f"Traitement des données de décision du parquet pour l'étape قرار النيابة العامة")
            
            # Récupérer les données de la décision du parquet
            type_decision = request.data.get('type_decision', '')
            tribunal_competent_id = request.data.get('tribunal_competent_id', '')
            observations_decision = request.data.get('observations_decision', '')
            decision_officielle_pdf = request.FILES.get('decision_officielle_pdf') if request.FILES else None
            
            print(f"Type de décision: {type_decision}")
            print(f"Tribunal compétent ID: {tribunal_competent_id}")
            print(f"Observations décision: {observations_decision}")
            print(f"PDF décision officielle: {decision_officielle_pdf}")
            
            # Construire les observations pour la décision du parquet
            observations_decision_completes = f"\n\n=== DÉCISION DU PARQUET ===\n"
            observations_decision_completes += f"Type de décision: {type_decision}\n"
            if tribunal_competent_id:
                observations_decision_completes += f"Tribunal compétent: {tribunal_competent_id}\n"
            if observations_decision:
                observations_decision_completes += f"Observations: {observations_decision}\n"
            
            # Gérer l'upload du PDF de la décision officielle
            if decision_officielle_pdf:
                try:
                    import uuid
                    file_extension = decision_officielle_pdf.name.split('.')[-1]
                    filename = f"decision_parquet_{affaire.idaffaire}_{uuid.uuid4().hex[:8]}.{file_extension}"
                    
                    from django.conf import settings
                    import os
                    
                    file_path = os.path.join(settings.MEDIA_ROOT, 'decisions_parquet', filename)
                    os.makedirs(os.path.dirname(file_path), exist_ok=True)
                    
                    with open(file_path, 'wb+') as destination:
                        for chunk in decision_officielle_pdf.chunks():
                            destination.write(chunk)
                    
                    fichier = Fichier.objects.create(
                        nom_fichier=filename,
                        chemin_fichier=f'decisions_parquet/{filename}',
                        type_fichier='decision_parquet',
                        idaffaire=affaire,
                        date_upload=date.today()
                    )
                    
                    observations_decision_completes += f"PDF décision officielle: {filename}\n"
                    print(f"✅ PDF décision officielle sauvegardé: {filename}")
                    
                except Exception as e:
                    print(f"❌ Erreur lors de la sauvegarde du PDF décision officielle: {str(e)}")
                    observations_decision_completes += f"Erreur upload PDF décision: {str(e)}\n"
            
            observations_completes += observations_decision_completes
            print(f"✅ Données de décision du parquet ajoutées aux observations")
        
        # 3. Étape "جلسة المحاكمة" (Audience pénale) - UNIQUEMENT par type
        is_audience_penale = (
            etape.idtypeetape and etape.idtypeetape.libelletypeetape == "جلسة المحاكمة"
        )
        
        print(f"=== DEBUG AUDIENCE PÉNALE ===")
        print(f"is_audience_penale: {is_audience_penale}")
        print(f"Reconnaissance par type: {etape.idtypeetape and etape.idtypeetape.libelletypeetape == 'جلسة المحاكمة'}")
        
        if is_audience_penale:
            print(f"🎯 ÉTAPE RECONNUE: جلسة المحاكمة (par type ou par ID)")
            print(f"Traitement des données d'audience pénale pour l'étape جلسة المحاكمة")
            print(f"=== DEBUG IDENTIFICATION ÉTAPE ===")
            print(f"Étape ID: {etape.idetape}")
            print(f"Type étape: {etape.idtypeetape}")
            if etape.idtypeetape:
                print(f"Libellé type étape: '{etape.idtypeetape.libelletypeetape}'")
            print(f"Reconnaissance par ID: {'etape_2' in str(etape.idetape)}")
            
            # Debug des données reçues
            print(f"=== DEBUG DONNÉES REÇUES ===")
            print(f"request.data complet: {request.data}")
            print(f"request.FILES: {request.FILES}")
            
            # Récupérer les données de l'audience pénale
            date_audience_penale = request.data.get('date_audience_penale')
            heure_audience_penale = request.data.get('heure_audience_penale')
            tribunal_audience_penale_id = request.data.get('tribunal_audience_penale_id')
            plaignant_present = request.data.get('plaignant_present', False)
            accuse_present = request.data.get('accuse_present', False)
            avocat_present = request.data.get('avocat_present', False)
            ministere_public_present = request.data.get('ministere_public_present', False)
            temoins_a_ajouter_audience = request.data.get('temoins_a_ajouter', [])
            compte_rendu_audience_pdf = request.FILES.get('compte_rendu_audience_pdf') if request.FILES else None
            observations_audience = request.data.get('observations_audience', '')
            
            # Convertir la chaîne JSON en liste si nécessaire
            if isinstance(temoins_a_ajouter_audience, str):
                try:
                    import json
                    temoins_a_ajouter_audience = json.loads(temoins_a_ajouter_audience)
                except json.JSONDecodeError:
                    temoins_a_ajouter_audience = []
                    print(f"❌ Erreur lors du parsing JSON des témoins: {temoins_a_ajouter_audience}")
            
            print(f"Date audience pénale: {date_audience_penale}")
            print(f"Heure audience pénale: {heure_audience_penale}")
            print(f"Tribunal audience pénale ID: {tribunal_audience_penale_id}")
            print(f"Présence - Plaignant: {plaignant_present}, Accusé: {accuse_present}, Avocat: {avocat_present}, Ministère public: {ministere_public_present}")
            print(f"Témoins audience: {temoins_a_ajouter_audience}")
            print(f"PDF compte-rendu audience: {compte_rendu_audience_pdf}")
            print(f"Observations audience: {observations_audience}")
            
            # Construire les observations pour l'audience pénale
            observations_audience_completes = f"\n\n=== AUDIENCE PÉNALE ===\n"
            if date_audience_penale:
                observations_audience_completes += f"Date d'audience: {date_audience_penale}\n"
            if heure_audience_penale:
                observations_audience_completes += f"Heure d'audience: {heure_audience_penale}\n"
            if tribunal_audience_penale_id:
                observations_audience_completes += f"Tribunal: {tribunal_audience_penale_id}\n"
            
            observations_audience_completes += f"Présence des parties:\n"
            observations_audience_completes += f"  - Plaignant: {plaignant_present}\n"
            observations_audience_completes += f"  - Accusé: {accuse_present}\n"
            observations_audience_completes += f"  - Avocat du plaignant: {avocat_present}\n"
            observations_audience_completes += f"  - Ministère public: {ministere_public_present}\n"
            
            if observations_audience:
                observations_audience_completes += f"Observations: {observations_audience}\n"
            
            # Créer l'audience pénale dans la table Audience - ADAPTÉE de la logique "استدعاء للمثول"
            print(f"=== DEBUG CRÉATION AUDIENCE ===")
            print(f"date_audience_penale: '{date_audience_penale}' (type: {type(date_audience_penale)})")
            print(f"tribunal_audience_penale_id: '{tribunal_audience_penale_id}' (type: {type(tribunal_audience_penale_id)})")
            
            # Créer l'audience dans TOUS les cas pour l'étape جلسة المحاكمة
            print(f"🎯 CRÉATION FORCÉE DE L'AUDIENCE PÉNALE")
            try:
                # Générer un ID unique pour l'audience pénale
                import uuid
                audience_penale_id = f"AUD_PEN_{date.today().strftime('%Y%m%d')}_{uuid.uuid4().hex[:8]}"
                print(f"ID audience pénale généré: {audience_penale_id}")
                
                # Préparer les données de l'audience
                audience_penale_data = {
                    'idaudience': audience_penale_id,
                    'idaffaire': affaire,
                }
                
                # Ajouter le tribunal si fourni
                if tribunal_audience_penale_id:
                    try:
                        tribunal_audience = Tribunal.objects.get(idtribunal=tribunal_audience_penale_id)
                        audience_penale_data['idtribunal'] = tribunal_audience
                        print(f"✅ Tribunal audience trouvé: {tribunal_audience.nomtribunal_fr or tribunal_audience.nomtribunal_ar or ''}")
                    except Tribunal.DoesNotExist:
                        print(f"❌ Tribunal {tribunal_audience_penale_id} non trouvé!")
                        observations_audience_completes += f"Erreur: Tribunal {tribunal_audience_penale_id} non trouvé\n"
                        # Continuer sans tribunal
                else:
                    print(f"⚠️ Aucun tribunal spécifié pour l'audience")
                
                # Ajouter la date si fournie
                if date_audience_penale:
                    audience_penale_data['dateaudience'] = date_audience_penale
                    print(f"✅ Date d'audience ajoutée: {date_audience_penale}")
                else:
                    # Utiliser la date d'aujourd'hui par défaut
                    audience_penale_data['dateaudience'] = date.today()
                    print(f"⚠️ Date d'audience par défaut: {date.today()}")
                
                # Ajouter l'heure si fournie (vérifier si la colonne existe)
                if heure_audience_penale:
                    try:
                        audience_penale_data['heureaudience'] = heure_audience_penale
                        print(f"✅ Heure d'audience ajoutée: {heure_audience_penale}")
                    except Exception as e:
                        print(f"⚠️ Impossible d'ajouter l'heure d'audience (colonne manquante): {str(e)}")
                        # Continuer sans l'heure
                
                # Ajouter les remarques (sans caractères arabes pour éviter les problèmes d'encodage)
                audience_penale_data['remarques'] = f"Audience penale - Presence: Plaignant({plaignant_present}), Accuse({accuse_present}), Avocat({avocat_present}), Ministere public({ministere_public_present})"
                
                print(f"✅ Données audience préparées: {audience_penale_data}")
                audience_penale = Audience.objects.create(**audience_penale_data)
                print(f"✅ Audience pénale créée avec succès: {audience_penale.idaudience}")
                
                # Créer le statut de l'audience pénale
                StatutAudience.objects.create(
                    idaudience=audience_penale,
                    libellestatutaudience='Programmée',
                    datedebut=date.today()
                )
                
                observations_audience_completes += f"Audience créée avec succès: {audience_penale_id}\n"
                
            except Exception as e:
                print(f"❌ Erreur lors de la création de l'audience pénale: {str(e)}")
                # Essayer de créer l'audience avec des données minimales
                try:
                    audience_penale_data_minimal = {
                        'idaudience': audience_penale_id,
                        'idaffaire': affaire,
                        'dateaudience': date.today(),
                        'remarques': f"Audience penale - Erreur creation - Presence: Plaignant({plaignant_present}), Accuse({accuse_present}), Avocat({avocat_present}), Ministere public({ministere_public_present})"
                    }
                    audience_penale = Audience.objects.create(**audience_penale_data_minimal)
                    print(f"✅ Audience pénale créée avec données minimales: {audience_penale.idaudience}")
                    observations_audience_completes += f"Audience créée avec données minimales: {audience_penale_id}\n"
                except Exception as e2:
                    print(f"❌ Erreur même avec données minimales: {str(e2)}")
                    observations_audience_completes += f"Erreur création audience: {str(e2)}\n"
            
            # Gérer l'upload du PDF du compte-rendu d'audience
            if compte_rendu_audience_pdf:
                try:
                    import uuid
                    file_extension = compte_rendu_audience_pdf.name.split('.')[-1]
                    filename = f"compte_rendu_audience_penale_{affaire.idaffaire}_{uuid.uuid4().hex[:8]}.{file_extension}"
                    
                    from django.conf import settings
                    import os
                    
                    file_path = os.path.join(settings.MEDIA_ROOT, 'comptes_rendus_audience', filename)
                    os.makedirs(os.path.dirname(file_path), exist_ok=True)
                    
                    with open(file_path, 'wb+') as destination:
                        for chunk in compte_rendu_audience_pdf.chunks():
                            destination.write(chunk)
                    
                    fichier = Fichier.objects.create(
                        nom_fichier=filename,
                        chemin_fichier=f'comptes_rendus_audience/{filename}',
                        type_fichier='compte_rendu_audience_penale',
                        idaffaire=affaire,
                        date_upload=date.today()
                    )
                    
                    observations_audience_completes += f"Compte-rendu d'audience (PDF): {filename}\n"
                    print(f"✅ Compte-rendu d'audience PDF sauvegardé: {filename}")
                    
                except Exception as e:
                    print(f"❌ Erreur lors de la sauvegarde du compte-rendu d'audience PDF: {str(e)}")
                    observations_audience_completes += f"Erreur upload compte-rendu audience PDF: {str(e)}\n"
            
            # Créer les participations des témoins pour l'audience pénale
            if temoins_a_ajouter_audience and len(temoins_a_ajouter_audience) > 0:
                print(f"Création des participations pour {len(temoins_a_ajouter_audience)} témoins de l'audience pénale")
                for temoin_id in temoins_a_ajouter_audience:
                    try:
                        from .models import Participationtemoinetape
                        participation_data = {
                            'idetape': etape,
                            'idtemoin_id': temoin_id,
                            'dateintervention': date.today(),
                        }
                        Participationtemoinetape.objects.create(**participation_data)
                        print(f"✅ Participation créée pour le témoin {temoin_id} de l'audience pénale")
                    except Exception as e:
                        print(f"❌ Erreur lors de la création de la participation pour le témoin {temoin_id} de l'audience pénale: {str(e)}")
            
            observations_completes += observations_audience_completes
            print(f"✅ Données d'audience pénale ajoutées aux observations")
        
        # ===== GESTION UNIFIÉE DES AUDIENCES =====
        print(f"=== GESTION AUDIENCES ===")
        print(f"Étape ID: {etape.idetape}")
        print(f"Type étape: {etape.idtypeetape}")
        if etape.idtypeetape:
            etape_libelle = etape.idtypeetape.libelletypeetape
            print(f"Libellé étape: '{etape_libelle}'")
            print(f"Longueur libellé: {len(etape_libelle)}")
            print(f"Caractères libellé: {[ord(c) for c in etape_libelle]}")
        else:
            print(f"❌ Aucun type d'étape trouvé!")
            etape_libelle = None
        
        # Fonction pour créer une audience
        def creer_audience(etape_type, tribunal_id, date_audience, heure_audience, remarques):
            print(f"🔧 Tentative création audience: {etape_type}")
            print(f"   - tribunal_id: {tribunal_id}")
            print(f"   - date_audience: {date_audience}")
            print(f"   - heure_audience: {heure_audience}")
            
            if not tribunal_id or not date_audience:
                print(f"❌ Données manquantes pour créer l'audience: tribunal_id={tribunal_id}, date_audience={date_audience}")
                return None
                
            try:
                import uuid
                audience_id = f"AUD_{date.today().strftime('%Y%m%d')}_{uuid.uuid4().hex[:8]}"
                print(f"   - audience_id généré: {audience_id}")
                
                # Récupérer le tribunal
                tribunal = Tribunal.objects.get(idtribunal=tribunal_id)
                print(f"   - tribunal trouvé: {tribunal.nomtribunal_fr or tribunal.nomtribunal_ar or ''}")
                
                audience_data = {
                    'idaudience': audience_id,
                    'idaffaire': affaire,
                    'idtribunal': tribunal,
                    'dateaudience': date_audience,
                    'heureaudience': heure_audience,
                    'remarques': remarques
                }
                print(f"   - audience_data: {audience_data}")
                
                audience = Audience.objects.create(**audience_data)
                print(f"   - audience créée en base: {audience.idaudience}")
                
                # Créer le statut
                StatutAudience.objects.create(
                    idaudience=audience,
                    libellestatutaudience='Programmée',
                    datedebut=date.today()
                )
                print(f"   - statut créé")
                
                print(f"✅ Audience créée avec succès: {audience_id}")
                return audience
                
            except Exception as e:
                print(f"❌ Erreur création audience: {str(e)}")
                import traceback
                print(f"❌ Traceback: {traceback.format_exc()}")
                return None
        
        # Créer audience selon le type d'étape
        if etape_libelle:
            print(f"🎯 Traitement de l'étape: '{etape_libelle}'")
            
            # Étape "استدعاء للمثول" (Convocation)
            if etape_libelle == "استدعاء للمثول":
                print(f"🎯 CRÉATION AUDIENCE CONVOCATION")
                
                # Vérifier si c'est une affaire pénale (données d'audience pénale présentes)
                date_audience_penale = request.data.get('date_audience_penale')
                heure_audience_penale = request.data.get('heure_audience_penale')
                tribunal_audience_penale_id = request.data.get('tribunal_audience_penale_id')
                
                if date_audience_penale and tribunal_audience_penale_id:
                    print(f"🎯 Détection affaire pénale - Utilisation des données d'audience pénale")
                    plaignant_present = request.data.get('plaignant_present', False)
                    accuse_present = request.data.get('accuse_present', False)
                    avocat_present = request.data.get('avocat_present', False)
                    ministere_public_present = request.data.get('ministere_public_present', False)
                    
                    audience = creer_audience(
                        etape_type="penale",
                        tribunal_id=tribunal_audience_penale_id,
                        date_audience=date_audience_penale,
                        heure_audience=heure_audience_penale,
                        remarques=f"Audience penale - Presence: Plaignant({plaignant_present}), Accuse({accuse_present}), Avocat({avocat_present}), Ministere public({ministere_public_present})"
                    )
                    if audience:
                        observations_completes += f"\n=== AUDIENCE PENALE ===\nTribunal: {audience.idtribunal.nomtribunal_fr or audience.idtribunal.nomtribunal_ar or ''}\nDate: {date_audience_penale}\nHeure: {heure_audience_penale or 'Non spécifiée'}\n"
                else:
                    print(f"🎯 Affaire non-pénale - Utilisation des données de convocation normale")
                    audience = creer_audience(
                        etape_type="convocation",
                        tribunal_id=tribunal_id,
                        date_audience=date_audience,
                        heure_audience=heure_audience,
                        remarques="Audience convocation"
                    )
                    if audience:
                        observations_completes += f"\n=== AUDIENCE CONVOCATION ===\nTribunal: {audience.idtribunal.nomtribunal_fr or audience.idtribunal.nomtribunal_ar or ''}\nDate: {date_audience}\nHeure: {heure_audience or 'Non spécifiée'}\n"
            
            # Étape "جلسة المحاكمة" (Audience pénale)
            elif etape_libelle == "جلسة المحاكمة":
                print(f"🎯 CRÉATION AUDIENCE PÉNALE")
                # Récupérer les données spécifiques à l'audience pénale
                date_audience_penale = request.data.get('date_audience_penale')
                heure_audience_penale = request.data.get('heure_audience_penale')
                tribunal_audience_penale_id = request.data.get('tribunal_audience_penale_id')
                plaignant_present = request.data.get('plaignant_present', False)
                accuse_present = request.data.get('accuse_present', False)
                avocat_present = request.data.get('avocat_present', False)
                ministere_public_present = request.data.get('ministere_public_present', False)
                
                audience = creer_audience(
                    etape_type="penale",
                    tribunal_id=tribunal_audience_penale_id,
                    date_audience=date_audience_penale,
                    heure_audience=heure_audience_penale,
                    remarques=f"Audience penale - Presence: Plaignant({plaignant_present}), Accuse({accuse_present}), Avocat({avocat_present}), Ministere public({ministere_public_present})"
                )
                if audience:
                    observations_completes += f"\n=== AUDIENCE PENALE ===\nTribunal: {audience.idtribunal.nomtribunal_fr or audience.idtribunal.nomtribunal_ar or ''}\nDate: {date_audience_penale}\nHeure: {heure_audience_penale or 'Non spécifiée'}\n"
            
            # Autres étapes - Créer une audience si des données sont fournies
            else:
                print(f"ℹ️ Étape '{etape_libelle}' - Vérification si données d'audience disponibles")
                
                # Si des données d'audience sont fournies, créer une audience générique
                if tribunal_id and date_audience:
                    print(f"🎯 CRÉATION AUDIENCE GÉNÉRIQUE pour l'étape '{etape_libelle}'")
                    audience = creer_audience(
                        etape_type="generique",
                        tribunal_id=tribunal_id,
                        date_audience=date_audience,
                        heure_audience=heure_audience,
                        remarques=f"Audience pour étape: {etape_libelle}"
                    )
                    if audience:
                        observations_completes += f"\n=== AUDIENCE GÉNÉRIQUE ===\nÉtape: {etape_libelle}\nTribunal: {audience.idtribunal.nomtribunal_fr or audience.idtribunal.nomtribunal_ar or ''}\nDate: {date_audience}\nHeure: {heure_audience or 'Non spécifiée'}\n"
                else:
                    print(f"ℹ️ Aucune donnée d'audience fournie pour l'étape '{etape_libelle}'")
        else:
            print(f"❌ Impossible de traiter l'audience - Aucun libellé d'étape")
            
        
        # Traitement des données de plainte pour l'étape "استلام شكاية"
        if etape.idtypeetape and etape.idtypeetape.libelletypeetape == "استلام شكاية":
            print(f"Traitement des données de plainte pour l'étape استلام شكاية")
            print(f"Contenu plainte: {contenu_plainte}")
            print(f"Délai réponse: {delai_reponse}")
            
            # Ajouter les informations de plainte aux observations
            if contenu_plainte or delai_reponse:
                observations_completes += f"\n\n=== DONNEES PLAINTE ===\n"
                if contenu_plainte:
                    observations_completes += f"Contenu de la plainte: {contenu_plainte}\n"
                if delai_reponse:
                    observations_completes += f"Délai de réponse: {delai_reponse}\n"
                
                # Mettre à jour les observations de l'étape
                etape.observations_etape = observations_completes
                etape.save()
                print(f"✅ Données de plainte ajoutées aux observations")
        
        # Traitement des données de représentation pour l'étape "تقديم تمثيل"
        if etape.idtypeetape and etape.idtypeetape.libelletypeetape == "تقديم تمثيل":
            print(f"Traitement des données de représentation pour l'étape تقديم تمثيل")
            print(f"Résumé contenu: {resume_contenu}")
            print(f"Date soumission: {date_soumission}")
            
            # Ajouter les informations de représentation aux observations
            if resume_contenu or date_soumission:
                observations_completes += f"\n\n=== DONNEES REPRESENTATION ===\n"
                if resume_contenu:
                    observations_completes += f"Résumé du contenu: {resume_contenu}\n"
                if date_soumission:
                    observations_completes += f"Date de soumission: {date_soumission}\n"
                
                # Mettre à jour les observations de l'étape
                etape.observations_etape = observations_completes
                etape.save()
                print(f"✅ Données de représentation ajoutées aux observations")
        
        # Traitement des données de délibération pour l'étape "مداولة"
        if etape.idtypeetape and etape.idtypeetape.libelletypeetape == "مداولة":
            print(f"Traitement des données de délibération pour l'étape مداولة")
            print(f"Conclusion définitives: {conclusion_definitives}")
            
            # Ajouter les informations de délibération aux observations
            if conclusion_definitives:
                observations_completes += f"\n\n=== DONNEES DELIBERATION ===\n"
                observations_completes += f"Conclusion définitives: {conclusion_definitives}\n"
                
                # Mettre à jour les observations de l'étape
                etape.observations_etape = observations_completes
                etape.save()
                print(f"✅ Données de délibération ajoutées aux observations")
        
        # Traitement des données de réponse pour l'étape "رد على المقال"
        if etape.idtypeetape and etape.idtypeetape.libelletypeetape == "رد على المقال":
            print(f"Traitement des données de réponse pour l'étape رد على المقال")
            print(f"Résumé réponse: {resume_reponse}")
            
            # Ajouter les informations de réponse aux observations
            if resume_reponse:
                observations_completes += f"\n\n=== DONNEES REPONSE ===\n"
                observations_completes += f"Résumé de la réponse: {resume_reponse}\n"
                
                # Mettre à jour les observations de l'étape
                etape.observations_etape = observations_completes
                etape.save()
                print(f"✅ Données de réponse ajoutées aux observations")
        

        
        # Mettre à jour les observations de l'étape avec toutes les données collectées
        etape.observations_etape = observations_completes
        
        # Sauvegarder l'étape avec toutes les modifications
        etape.save()
        print(f"✅ Étape sauvegardée avec succès")
        
        # Mettre à jour les paramètres de notification de l'affaire si fournis
        if huissier_id or opposant_id:
            if huissier_id:
                affaire.huissier_notification_id = huissier_id
            if opposant_id:
                affaire.opposant_notification_id = opposant_id
            affaire.save()
        
        # NOUVEAU : Mettre à jour l'étape actuelle et fermer les étapes précédentes
        print(f"🔄 Mise à jour de l'étape actuelle et fermeture des étapes précédentes")
        
        # 1. Marquer l'étape actuelle comme terminée
        if not etape.date_fin_effective:
            etape.date_fin_effective = date.today()
            etape.save()
            print(f"✅ Étape {etape.idetape} marquée comme terminée (date_fin_effective: {etape.date_fin_effective})")
        
        # 2. Fermer toutes les étapes précédentes non terminées
        etapes_precedentes = Etapejudiciaire.objects.filter(
            idaffaire=affaire,
            ordre_etape__lt=etape.ordre_etape,
            date_fin_effective__isnull=True
        )
        for etape_prec in etapes_precedentes:
            etape_prec.date_fin_effective = date.today()
            etape_prec.save()
            print(f"✅ Étape précédente {etape_prec.idetape} fermée (date_fin_effective: {etape_prec.date_fin_effective})")
        
        # 3. NOUVELLE LOGIQUE : Utiliser get_etape_actuelle_par_phase pour déterminer la prochaine étape
        print(f"🔄 NOUVELLE LOGIQUE: Détermination de l'étape actuelle avec get_etape_actuelle_par_phase")
        
        from .services import get_etape_actuelle_par_phase
        nouvelle_etape_actuelle = get_etape_actuelle_par_phase(affaire)
        
        if nouvelle_etape_actuelle:
            # Mettre à jour l'étape actuelle de l'affaire avec la nouvelle logique
            affaire.etape_actuelle = nouvelle_etape_actuelle
            affaire.save()
            print(f"✅ Étape actuelle mise à jour avec la nouvelle logique: {nouvelle_etape_actuelle.idetape}")
            print(f"✅ Type d'étape: {nouvelle_etape_actuelle.idtypeetape.libelletypeetape if nouvelle_etape_actuelle.idtypeetape else 'Sans type'}")
            
            # Démarrer la nouvelle étape si elle n'est pas encore commencée
            if not nouvelle_etape_actuelle.date_debut_effective:
                nouvelle_etape_actuelle.date_debut_effective = date.today()
                nouvelle_etape_actuelle.save()
                print(f"✅ Nouvelle étape {nouvelle_etape_actuelle.idetape} démarrée")
            
            prochaine_etape = nouvelle_etape_actuelle
        else:
            # Si pas de nouvelle étape, l'étape actuelle reste la même
            affaire.etape_actuelle = etape
            affaire.save()
            print(f"ℹ️ Aucune nouvelle étape trouvée, étape actuelle reste: {etape.idetape}")
            prochaine_etape = None
        
        # Créer le statut terminé
        StatutEtape.objects.create(
            idetape=etape,
            libellestatutetape='Terminee',
            datedebut=date.today()
        )
        
        # Créer le statut en cours pour l'étape suivante si elle existe
        if prochaine_etape:
            StatutEtape.objects.create(
                idetape=prochaine_etape,
                libellestatutetape='En cours',
                datedebut=date.today()
            )
            print(f"✅ Statut 'En cours' créé pour l'étape suivante: {prochaine_etape.idetape}")
        else:
            print(f"ℹ️ Aucune étape suivante, pas de statut 'En cours' à créer")
        
        return Response({
            'message': 'Étape complétée avec succès',
            'etape_suivante': prochaine_etape.idetape if prochaine_etape else None
        })
        
    except Affairejudiciaire.DoesNotExist:
        return Response({'error': 'Affaire non trouvée'}, status=status.HTTP_404_NOT_FOUND)
    except Etapejudiciaire.DoesNotExist:
        return Response({'error': 'Étape non trouvée'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': f'Erreur lors de la complétion: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def types_avertissement(request):
    """Récupérer tous les types d'avertissement"""
    try:
        types = TypeAvertissement.objects.all()
        data = []
        for type_avert in types:
            data.append({
                'idTypeAvertissement': type_avert.idtypeavertissement,
                'libelle': type_avert.libelle_fr or type_avert.libelle_ar or '',
                'libelle_ar': type_avert.libelle_ar,
                'delai_legal': type_avert.delai_legal,
                'obligatoire': type_avert.obligatoire,
                'description': type_avert.description,
                'categorie': type_avert.categorie,
                'notification_automatique': type_avert.notification_automatique
            })
        return Response(data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def types_demande(request):
    """Récupérer tous les types de demande"""
    try:
        types = TypeDemande.objects.all()
        data = []
        for type_demande in types:
            data.append({
                'idTypeDemande': type_demande.idtypedemande,
                'libelle': type_demande.libelle_fr or type_demande.libelle_ar or '',
                'libelle_ar': type_demande.libelle_ar,
                'delai_legal': type_demande.delai_legal,
                'categorie': type_demande.categorie,
                'description': type_demande.description,
                'documents_requis': type_demande.documents_requis,
                'notification_automatique': type_demande.notification_automatique
            })
        return Response(data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def creer_etape_personnalisee(request, affaire_id):
    """Créer une étape personnalisée pour une affaire"""
    try:
        affaire = Affairejudiciaire.objects.get(idaffaire=affaire_id)
        
        libelle = request.data.get('libelle')
        delai = request.data.get('delai_legal', 0)
        observations = request.data.get('observations', '')
        
        if not libelle:
            return Response({'error': 'Libellé requis'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Créer le type d'étape s'il n'existe pas
        type_etape, created = TypeEtape.objects.get_or_create(
            libelletypeetape=libelle
        )
        
        # Déterminer l'ordre de l'étape
        ordre_max = Etapejudiciaire.objects.filter(idaffaire=affaire).aggregate(
            Max('ordre_etape')
        )['ordre_etape__max'] or 0
        
        # Générer un ID unique pour l'étape
        import uuid
        etape_id = f"ETAPE_{uuid.uuid4().hex[:8].upper()}"
        
        # Créer l'étape
        etape = Etapejudiciaire.objects.create(
            idetape=etape_id,
            idaffaire=affaire,
            idtypeetape=type_etape,
            delai_legal=delai,
            ordre_etape=ordre_max + 1,
            description_etape=observations,
            observations_etape='',
            datedebut=date.today()
        )
        
        return Response({
            'message': 'Étape créée avec succès',
            'etape': {
                'id': etape.idetape,
                'libelle': libelle,
                'delai': delai,
                'ordre': etape.ordre_etape
            }
        })
        
    except Affairejudiciaire.DoesNotExist:
        return Response({'error': 'Affaire non trouvée'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': f'Erreur lors de la création: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
def supprimer_etape(request, affaire_id, etape_id):
    """Supprimer une étape et ses statuts associés"""
    try:
        # Vérifier que l'affaire existe
        affaire = Affairejudiciaire.objects.get(idaffaire=affaire_id)
        
        # Vérifier que l'étape existe
        etape = Etapejudiciaire.objects.get(idetape=etape_id, idaffaire=affaire)
        
        # Supprimer d'abord tous les statuts associés à cette étape
        StatutEtape.objects.filter(idetape=etape).delete()
        
        #  supprimer l'étape
        etape.delete()
        
        return Response({'message': 'Étape supprimée avec succès'}, status=status.HTTP_200_OK)
        
    except Affairejudiciaire.DoesNotExist:
        return Response({'error': 'Affaire non trouvée'}, status=status.HTTP_404_NOT_FOUND)
    except Etapejudiciaire.DoesNotExist:
        return Response({'error': 'Étape non trouvée'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': f'Erreur lors de la suppression: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def get_huissiers_disponibles(request):
    """Récupérer la liste des huissiers pour l'autocomplétion"""
    try:
        huissiers = Huissier.objects.all().values('idhuissier', 'nomhuissier', 'adressehuissier', 'telephonehuissier')
        return Response(huissiers, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_opposants_disponibles(request):
    """Récupérer la liste des opposants pour l'autocomplétion"""
    try:
        opposants = Opposant.objects.all().values('idopposant', 'nomopposant_fr', 'nomopposant_ar', 'adresse1_fr', 'adresse1_ar', 'adresse2_fr', 'adresse2_ar', 'numtel1', 'numtel2', 'email')
        return Response(opposants, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'POST'])
def update_notification_settings(request, affaire_id):
    """Gérer les paramètres de notification (huissier et opposant)"""
    try:
        affaire = Affairejudiciaire.objects.get(idaffaire=affaire_id)
        
        if request.method == 'GET':
            # Récupérer les paramètres actuels
            return Response({
                'huissier_id': affaire.huissier_notification_id,
                'opposant_id': affaire.opposant_notification_id
            }, status=status.HTTP_200_OK)
        
        elif request.method == 'POST':
            # Mettre à jour les champs de notification
            if 'huissier_id' in request.data:
                affaire.huissier_notification_id = request.data['huissier_id']
            if 'opposant_id' in request.data:
                affaire.opposant_notification_id = request.data['opposant_id']
            
            affaire.save()
            
            return Response({'message': 'Paramètres de notification mis à jour'}, status=status.HTTP_200_OK)
            
    except Affairejudiciaire.DoesNotExist:
        return Response({'error': 'Affaire non trouvée'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# =============================================================================
# VUES DE GESTION DES FICHIERS
# =============================================================================
# Vues d'API pour l'upload et la gestion des fichiers

@api_view(['POST'])
def upload_fichier_etape(request, affaire_id, etape_id=None):
    # API pour uploader un fichier associé à une étape
    try:
        affaire = Affairejudiciaire.objects.get(idaffaire=affaire_id)
        
        fichier = request.FILES.get('fichier')
        type_fichier = request.data.get('type_fichier', 'PIECE_PROCEDURE')
        description = request.data.get('description', '')
        
        if not fichier:
            return Response({'error': 'Aucun fichier fourni'}, status=400)
        
        # Créer un nom de fichier spécifique à l'étape si etape_id est fourni
        if etape_id:
            nom_fichier = f"etape_{etape_id}_{fichier.name}"
            description = f"Document pour étape {etape_id} - {description}"
        else:
            nom_fichier = fichier.name
        
        # Créer le fichier dans la base
        fichier_obj = Fichier.objects.create(
            affaire=affaire,
            nom_fichier=nom_fichier,
            fichier=fichier,
            type_fichier=type_fichier,
            description=description,
            upload_par=request.user if request.user.is_authenticated else None
        )
        
        return Response({
            'message': 'Fichier uploadé avec succès',
            'fichier_id': fichier_obj.id,
            'nom_fichier': fichier_obj.nom_fichier,
            'type_fichier': fichier_obj.type_fichier,
            'etape_id': etape_id
        })
        
    except Affairejudiciaire.DoesNotExist:
        return Response({'error': 'Affaire non trouvée'}, status=404)
    except Exception as e:
        return Response({'error': f'Erreur lors de l\'upload: {str(e)}'}, status=500)

@api_view(['GET'])
def get_fichiers_affaire(request, affaire_id):
    # API pour récupérer tous les fichiers d'une affaire
    try:
        affaire = Affairejudiciaire.objects.get(idaffaire=affaire_id)
        fichiers = Fichier.objects.filter(affaire=affaire)
        
        serializer = FichierSerializer(fichiers, many=True, context={'request': request})
        return Response(serializer.data)
        
    except Affairejudiciaire.DoesNotExist:
        return Response({'error': 'Affaire non trouvée'}, status=404)
    except Exception as e:
        return Response({'error': f'Erreur: {str(e)}'}, status=500)

@api_view(['GET'])
def get_tous_fichiers(request):
    # API simple: retourne tous les fichiers avec info d'affaire
    try:
        fichiers = Fichier.objects.select_related('affaire', 'upload_par').all().order_by('-date_upload')
        serializer = FichierSerializer(fichiers, many=True, context={'request': request})
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': f'Erreur: {str(e)}'}, status=500)

@api_view(['GET'])
def get_tous_documents(request):
    # Agrège contrats et fichiers d'affaire dans un même flux pour l'UI
    try:
        # Fichiers d'affaire
        fichiers = Fichier.objects.select_related('affaire', 'upload_par', 'affaire__idclient').all()
        fichiers_data = FichierSerializer(fichiers, many=True, context={'request': request}).data

        # Contrats
        contrats = Contrat.objects.select_related('idclient').all()
        contrats_data = ContratSerializer(contrats, many=True, context={'request': request}).data

        # Normalisation minimale des contrats pour s'aligner avec FichierSerializer
        normalized_contrats = []
        for c in contrats_data:
            # Trouver l'affaire correspondante pour ce contrat (via le client)
            affaire_info = None
            if c.get('client_id'):
                try:
                    affaire = Affairejudiciaire.objects.filter(
                        idclient_id=c.get('client_id')
                    ).order_by('-dateouverture').first()  # Prendre la plus récente
                    
                    if affaire:
                        affaire_info = {
                            'affaire_id': affaire.idaffaire,
                            'affaire_reference': f"{affaire.numero_dossier or '-'}/{affaire.code_dossier or '-'}/{affaire.annee_dossier or '-'}",
                            'affaire_numero_dossier': affaire.numero_dossier,
                            'affaire_code_dossier': affaire.code_dossier,
                            'affaire_annee_dossier': affaire.annee_dossier,
                        }
                except Exception as e:
                    print(f"Erreur lors de la recherche d'affaire pour contrat {c.get('idcontrat')}: {e}")
            
            normalized_contrats.append({
                'id': c.get('idcontrat'),
                'nom_fichier': c.get('nom_fichier'),
                'type_fichier': 'CONTRAT',
                'description': None,
                'date_upload': None,
                'version': None,
                'public': None,
                'upload_par_username': None,
                'affaire_id': affaire_info['affaire_id'] if affaire_info else None,
                'affaire_reference': affaire_info['affaire_reference'] if affaire_info else None,
                'affaire_numero_dossier': affaire_info['affaire_numero_dossier'] if affaire_info else None,
                'affaire_code_dossier': affaire_info['affaire_code_dossier'] if affaire_info else None,
                'affaire_annee_dossier': affaire_info['affaire_annee_dossier'] if affaire_info else None,
                'client_id': c.get('client_id'),
                'client_nom': c.get('client_nom'),
                'doc_type': 'CONTRAT',
                'url': c.get('url'),
            })

        normalized_fichiers = []
        for f in fichiers_data:
            normalized_fichiers.append({
                **f,
                'id': f.get('id'),
                'doc_type': 'FICHIER',
            })

        merged = sorted([*normalized_contrats, *normalized_fichiers], key=lambda d: d.get('date_upload') or '', reverse=True)
        return Response(merged)
    except Exception as e:
        return Response({'error': f'Erreur: {str(e)}'}, status=500)

@api_view(['GET'])
def get_fichiers_etape(request, affaire_id, etape_id):
    # API pour récupérer les fichiers d'une étape spécifique
    try:
        affaire = Affairejudiciaire.objects.get(idaffaire=affaire_id)
        
        # Filtrer les fichiers par le préfixe de l'étape
        fichiers = Fichier.objects.filter(
            affaire=affaire,
            nom_fichier__startswith=f"etape_{etape_id}_"
        )
        
        fichiers_data = []
        for fichier in fichiers:
            fichiers_data.append({
                'id': fichier.id,
                'nom_fichier': fichier.nom_fichier,
                'description': fichier.description,
                'type_fichier': fichier.type_fichier,
                'url': request.build_absolute_uri(fichier.fichier.url),
                'date_upload': fichier.date_upload,
                'upload_par': fichier.upload_par.username if fichier.upload_par else None
            })
        
        return Response(fichiers_data)
        
    except Affairejudiciaire.DoesNotExist:
        return Response({'error': 'Affaire non trouvée'}, status=404)
    except Exception as e:
        return Response({'error': f'Erreur: {str(e)}'}, status=500)

@api_view(['DELETE'])
def supprimer_audience(request, audience_id):
    # Supprimer une audience et ses statuts associés
    try:
        # Récupérer l'audience
        audience = Audience.objects.get(idaudience=audience_id)
        
        # Supprimer d'abord tous les statuts associés
        statuts_supprimes = StatutAudience.objects.filter(idaudience=audience).delete()
        print(f"✅ {statuts_supprimes[0]} statut(s) supprimé(s) pour l'audience {audience_id}")
        
        # Supprimer l'audience
        audience.delete()
        print(f"✅ Audience {audience_id} supprimée avec succès")
        
        return Response({
            'message': f'Audience {audience_id} supprimée avec succès',
            'statuts_supprimes': statuts_supprimes[0]
        })
        
    except Audience.DoesNotExist:
        return Response({
            'error': f'Audience {audience_id} non trouvée'
        }, status=status.HTTP_404_NOT_FOUND)
        
    except Exception as e:
        print(f"❌ Erreur lors de la suppression de l'audience {audience_id}: {str(e)}")
        return Response({
            'error': f'Erreur lors de la suppression: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =============================================================================
# VUES DE NOTIFICATIONS ET RAPPELS
# =============================================================================
# Vues d'API pour la gestion des notifications et rappels

@api_view(['POST'])
def trigger_rdv_reminders(request):
    # Déclenche l'envoi des rappels de rendez-vous (pour cron job)
    try:
        from .services import NotificationService
        result = NotificationService.check_and_send_rdv_reminders()
        
        if result:
            return Response({
                'success': True,
                'message': 'Rappels traités avec succès',
                'rappels_24h_envoyes': result.get('rappels_24h_envoyes', 0),
                'rappels_1h_envoyes': result.get('rappels_1h_envoyes', 0)
            })
        else:
            return Response({
                'success': False,
                'message': 'Erreur lors du traitement des rappels'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# device
# =============================================================================
# VIEWSETS DE NOTIFICATIONS ET SYSTÈME
# =============================================================================
# ViewSets pour la gestion des notifications et du système

class DeviceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = DeviceSerializer

    def get_queryset(self):
        return Device.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

# notification
class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        queryset = Notification.objects.filter(user=self.request.user)
        unread = self.request.query_params.get('unread')
        if unread in ('1', 'true', 'True'):
            queryset = queryset.filter(read_at__isnull=True)
        return queryset

    @action(detail=True, methods=['patch'])
    def read(self, request, pk=None):
        notif = self.get_object()
        if notif.read_at is None:
            notif.read_at = timezone.now()
            notif.save(update_fields=['read_at'])
        return Response({'status': 'ok'})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        Notification.objects.filter(user=request.user, read_at__isnull=True).update(read_at=timezone.now())
        return Response({'status': 'ok'})

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = Notification.objects.filter(user=request.user, read_at__isnull=True).count()
        return Response({'count': count})




# Endpoints pour permettre aux utilisateurs de réinitialiser leur mot de passe


from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.contrib.auth.password_validation import validate_password
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.core.exceptions import ValidationError

# Instance du générateur de tokens Django pour la réinitialisation de mot de passe

token_generator = PasswordResetTokenGenerator()

"""
    Fonctionnement:
    1. L'utilisateur saisit son nom d'utilisateur
    2. Le système vérifie si l'utilisateur existe et est actif
    3. Si oui, génère un lien sécurisé avec uid et token
    4. Retourne le lien à afficher 

    Payload attendu:
    {
        "username": "nom_utilisateur"
    }

    Réponse:
    - Succès: {"reset_link": "http://localhost:3000/reset-password/uid/token"}
    - Erreur: {"error": "Utilisateur non trouvé"}
    """
@api_view(["POST"])
@permission_classes([AllowAny])
def password_reset_request(request):

    try:
        # Récupérer le nom d'utilisateur depuis la requête
        username = request.data.get("username")
        
        # Vérifier que le nom d'utilisateur est fourni
        if not username:
            return Response({
                "error": "Le nom d'utilisateur est requis"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Chercher l'utilisateur dans la base de données + is_active=True

        user = User.objects.filter(username=username, is_active=True).first()
        
        # Si l'utilisateur n'existe pas ou n'est pas actif
        if not user:
            return Response({
                "error": "Utilisateur non trouvé"
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Générer un identifiant unique sécurisé pour l'utilisateur
        # urlsafe_base64_encode convertit l'ID utilisateur en une chaîne sécurisée
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        # Générer un token de réinitialisation sécurisé,expire automatiquement et est unique pour cet utilisateur

        token = token_generator.make_token(user)
        

        # Ce lien sera affiché à l'utilisateur pour qu'il puisse cliquer dessus
        reset_link = f"http://localhost:3000/reset-password/{uid}/{token}"
        
        # Retourner le lien de réinitialisation
        return Response({
            "reset_link": reset_link,
            "message": "Lien de réinitialisation généré avec succès"
        })
        
    except Exception as e:
        # En cas d'erreur inattendue, retourner une erreur générique
        print(f"❌ Erreur lors de la demande de réinitialisation: {str(e)}")
        return Response({
            "error": "Erreur lors de la génération du lien de réinitialisation"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


"""
   Fonctionnement:
   1. L'utilisateur clique sur le lien de réinitialisation
   2. Il saisit son nouveau mot de passe
   3. Le système valide le token et met à jour le mot de passe

   Payload attendu:
   {
       "uid": "uidb64_encodé",
       "token": "token_de_réinitialisation", 
       "new_password": "nouveau_mot_de_passe"
   }

   Réponse:
   - Succès: {"success": "Mot de passe changé avec succès"}
   - Erreur: {"error": "Description de l'erreur"}
   """

@api_view(["POST"])
@permission_classes([AllowAny])
def password_reset_confirm(request):

    try:
        # Récupérer les données de la requête
        uid = request.data.get("uid")
        token = request.data.get("token")
        new_password = request.data.get("new_password")
        
        # Vérifier que toutes les données requises sont présentes
        if not all([uid, token, new_password]):
            return Response({
                "error": "Tous les champs sont requis (uid, token, new_password)"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Décoder l'identifiant utilisateur depuis la chaîne sécurisée
        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id, is_active=True)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            # Si le décodage échoue ou l'utilisateur n'existe pas
            return Response({
                "error": "Lien de réinitialisation invalide"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Vérifier que le token de réinitialisation est valide

        if not token_generator.check_token(user, token):
            return Response({
                "error": "Token de réinitialisation invalide ou expiré"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Valider le nouveau mot de passe selon les règles Django: complexité, longueur...

        try:
            validate_password(new_password, user)
        except ValidationError as e:
            # Si le mot de passe ne respecte pas les règles de validation
            return Response({
                "error": e.messages
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Mettre à jour le mot de passe de l'utilisateur
        # set_password() hash automatiquement le mot de passe
        user.set_password(new_password)
        user.save()
        
        # Retourner un message de succès
        return Response({
            "success": "Mot de passe changé avec succès"
        })
        
    except Exception as e:
        # En cas d'erreur inattendue, retourner une erreur générique
        print(f"❌ Erreur lors de la confirmation de réinitialisation: {str(e)}")
        return Response({
            "error": "Erreur lors de la réinitialisation du mot de passe"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

