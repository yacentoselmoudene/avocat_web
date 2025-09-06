from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api import views
from api.views import (
    ClientViewSet,
    AvocatViewSet,
    AffairejudiciaireViewSet,
    EtapejudiciaireViewSet,
    AudienceViewSet,
    FactureViewSet,
    ContratViewSet,
    TribunalViewSet,
    ClientMeView,
    TypeClientViewSet,
    CreateClientView,
    TypeAffaireViewSet,
    StatutAffaireViewSet,
    StatutAudienceViewSet,
    MyTokenObtainPairView,
    FonctionClientViewSet,
    OpposantViewSet,
    CategorieAffaireViewSet,
    AffaireOpposantAvocatViewSet,
    ClassificationAffaireView,
    TribunalSuggestionView,
    AffairetribunalViewSet,
    TypeTribunalViewSet,
    TypeAvertissementViewSet,
    TypeDemandeViewSet,
    TemoinViewSet,
    ParticipationtemoinetapeViewSet,
    ParticipationexpertetapeViewSet,
    ParticipationhuissieretapeViewSet,
    ExpertViewSet,
    HuissierViewSet,
    TypeInterventionViewSet,
    enregistrer_pv_execution,
    NotificationViewSet,
    DeviceViewSet,
    password_reset_request,
    password_reset_confirm,
)

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)


router = DefaultRouter()
router.register(r'clients', ClientViewSet, basename='client')
router.register(r'avocats', AvocatViewSet)
router.register(r'etapejudiciaires', EtapejudiciaireViewSet)
router.register(r'audiences', AudienceViewSet)
router.register(r'factures', FactureViewSet)
router.register(r'contrats', ContratViewSet,basename='contrat')
router.register(r'tribunals', TribunalViewSet)
router.register(r'typeclients', TypeClientViewSet)
router.register(r'typeaffaires', TypeAffaireViewSet)
router.register(r'statutaffaires', StatutAffaireViewSet)
router.register(r'statutaudiences', StatutAudienceViewSet)
router.register(r'fonctionclients', FonctionClientViewSet)
router.register(r'opposants', OpposantViewSet)
router.register(r'categorieaffaires', CategorieAffaireViewSet)
router.register(r'affaireopposantavocats', AffaireOpposantAvocatViewSet)
router.register(r'affairetribunaux', AffairetribunalViewSet)
router.register(r'typetribunals', TypeTribunalViewSet)
router.register(r'typeavertissements', TypeAvertissementViewSet)
router.register(r'typedemandes', TypeDemandeViewSet)
router.register(r'temoins', TemoinViewSet)
router.register(r'participationtemoinetapes', ParticipationtemoinetapeViewSet)
router.register(r'participationexpertetapes', ParticipationexpertetapeViewSet)
router.register(r'participationhuissieretapes', ParticipationhuissieretapeViewSet)
router.register(r'experts', ExpertViewSet)
router.register(r'huissiers', HuissierViewSet)
router.register(r'typeinterventions', TypeInterventionViewSet)
router.register(r'affairejudiciaires', AffairejudiciaireViewSet, basename='affairejudiciaire')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'devices', DeviceViewSet, basename='device')


urlpatterns = [
    path('clients/me/', ClientMeView.as_view(), name='client-me'),
    path('admin/', admin.site.urls),
    path('api/create-client/', CreateClientView.as_view(), name='create-client'),
    path('api/classification/', ClassificationAffaireView.as_view(), name='classification-affaire'),
    path('api/tribunaux-suggestion/', TribunalSuggestionView.as_view(), name='tribunaux-suggestion'),
    path('api/choix-penaux/', views.get_choix_penaux, name='choix-penaux'),
    path('api/update-etapes-types/', views.update_all_etapes_types, name='update-etapes-types'),
    

    path('api/affaires/<int:affaire_id>/etape-actuelle/', views.affaire_etape_actuelle, name='affaire_etape_actuelle'),
    path('api/affaires/<int:affaire_id>/avancer-etape/', views.avancer_etape_affaire, name='avancer_etape_affaire'),
    path('api/affaires/<int:affaire_id>/terminer-etape/', views.terminer_etape_affaire, name='terminer_etape_affaire'),
    path('api/affaires/<int:affaire_id>/progression/', views.progression_affaire, name='progression_affaire'),
    
    #  GESTIONNAIRE D'ÉTAPES
    path('api/affaires/<int:affaire_id>/etapes/', views.affaire_etapes, name='affaire_etapes'),
    path('api/affaires/<int:affaire_id>/etapes/reset/', views.affaire_etapes_reset, name='affaire_etapes_reset'),
    path('api/affaires/<int:affaire_id>/etapes/<str:etape_id>/completer/', views.completer_etape, name='completer_etape'),
    path('api/affaires/<int:affaire_id>/etapes/<str:etape_id>/supprimer/', views.supprimer_etape, name='supprimer_etape'),
    path('api/affaires/<int:affaire_id>/etapes/creer/', views.creer_etape_personnalisee, name='creer_etape_personnalisee'),
    path('api/audiences/<str:audience_id>/supprimer/', views.supprimer_audience, name='supprimer_audience'),
    path('api/tribunaux/appel/', views.tribunaux_appel, name='tribunaux_appel'),
    
    # GESTIONNAIRE D'APPEL
    path('api/affaires/appel/', views.creer_affaire_appel, name='creer_affaire_appel'),
    
    # GESTIONNAIRE D'EXÉCUTION
    path('api/affaires/<int:affaire_id>/execution/assigner-huissier/', views.assigner_huissier_execution, name='assigner_huissier_execution'),
    path('api/affaires/<int:affaire_id>/execution/contact/', views.enregistrer_contact_execution, name='enregistrer_contact_execution'),
    path('api/affaires/<int:affaire_id>/execution/pv/', enregistrer_pv_execution, name='enregistrer_pv_execution'),
    path('api/types-avertissement/', views.types_avertissement, name='types_avertissement'),
    path('api/types-demande/', views.types_demande, name='types_demande'),

    #  les notifications officielles
    path('api/huissiers-disponibles/', views.get_huissiers_disponibles, name='huissiers_disponibles'),
    path('api/opposants-disponibles/', views.get_opposants_disponibles, name='opposants_disponibles'),
    path('api/affaires/<int:affaire_id>/notification-settings/', views.update_notification_settings, name='update_notification_settings'),

    #  l'upload de fichiers
    path('api/affaires/<int:affaire_id>/upload-fichier/', views.upload_fichier_etape, name='upload_fichier_etape'),
    path('api/affaires/<int:affaire_id>/fichiers/', views.get_fichiers_affaire, name='get_fichiers_affaire'),
    path('api/affaires/<int:affaire_id>/etapes/<str:etape_id>/upload-fichier/', views.upload_fichier_etape, name='upload_fichier_etape_specifique'),
    path('api/affaires/<int:affaire_id>/etapes/<str:etape_id>/fichiers/', views.get_fichiers_etape, name='get_fichiers_etape'),
    # Listes globales de fichiers/documents
    path('api/fichiers/', views.get_tous_fichiers, name='get_tous_fichiers'),
    path('api/documents/', views.get_tous_documents, name='get_tous_documents'),
    
    # Endpoint pour déclencher les rappels de rendez-vous (cron job)
    path('api/rappels-rdv/', views.trigger_rdv_reminders, name='trigger_rdv_reminders'),

    # Endpoints de réinitialisation de mot de passe
    path('api/password-reset-request/', password_reset_request, name='password_reset_request'),
    path('api/password-reset-confirm/', password_reset_confirm, name='password_reset_confirm'),

    # Router pour les ViewSets
    path('api/', include(router.urls)),
]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

urlpatterns += [
    path('api/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]