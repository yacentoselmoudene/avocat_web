

from django.db import models
from django.contrib.auth.models import User
import re
from django.core.exceptions import ValidationError

#categorie 1
class TypeAffairePrincipale(models.Model):
    code = models.CharField(max_length=10, unique=True)
    libelle_fr = models.CharField(db_column='libelle_fr', max_length=255, null=True, blank=True)
    libelle_ar = models.CharField(db_column='libelle_ar', max_length=255, null=True, blank=True)

    class Meta:
        db_table = 'type_affaire_principale'
        verbose_name = "Type d'affaire principale"
        verbose_name_plural = "Types d'affaires principales"

    def __str__(self):
        return f"{self.code} - {self.libelle_fr or self.libelle_ar or ''}"

#categorie 2
class SousTypeAffaire(models.Model):
    code = models.CharField(max_length=10, unique=True)
    libelle_fr = models.CharField(db_column='libelle_fr', max_length=255, null=True, blank=True)
    libelle_ar = models.CharField(db_column='libelle_ar', max_length=255, null=True, blank=True)
    type_principale = models.ForeignKey(TypeAffairePrincipale, on_delete=models.CASCADE)

    class Meta:
        db_table = 'sous_type_affaire'
        verbose_name = "Sous-type d'affaire"
        verbose_name_plural = "Sous-types d'affaires"

    def __str__(self):
        return f"{self.code} - {self.libelle_fr or self.libelle_ar or ''}"

# caategorie 3
class CategorieAffaire(models.Model):
    code = models.CharField(max_length=10, unique=True)
    libelle_fr = models.CharField(db_column='libelle_fr', max_length=255, null=True, blank=True)
    libelle_ar = models.CharField(db_column='libelle_ar', max_length=255, null=True, blank=True)
    sous_type = models.ForeignKey(SousTypeAffaire, on_delete=models.CASCADE)

    class Meta:
        db_table = 'categorie_affaire'
        verbose_name = "Catégorie d'affaire"
        verbose_name_plural = "Catégories d'affaires"

    def __str__(self):
        return f"{self.code} - {self.libelle_fr or self.libelle_ar or ''}"


class Affairejudiciaire(models.Model):
    idaffaire = models.AutoField(db_column='idAffaire', primary_key=True)
    dateouverture = models.DateField(db_column='dateOuverture')
    datecloture = models.DateField(db_column='dateCloture', blank=True, null=True)
    idclient = models.ForeignKey('Client', models.DO_NOTHING, db_column='idClient', blank=True, null=True)
    idfonctionclient = models.ForeignKey('FonctionClient', models.DO_NOTHING, db_column='idFonctionClient', blank=True, null=True)
    idtypeaffaire = models.ForeignKey('TypeAffaire', models.DO_NOTHING, db_column='idTypeAffaire', blank=True, null=True)

    numero_dossier = models.CharField(max_length=20, null=True, blank=True)
    code_dossier = models.CharField(max_length=10, null=True, blank=True)
    annee_dossier = models.CharField(max_length=4, null=True, blank=True)
    
    #  champs pour l'appel
    # affaire_originale = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='affaires_appel')
    # tribunal_appel = models.ForeignKey('Tribunal', on_delete=models.SET_NULL, null=True, blank=True, related_name='affaires_appel')
    # delai_appel = models.IntegerField(default=10, help_text="Délai d'appel en jours")
    
    #  champs pour la phase
    phase_processus = models.CharField(max_length=20, choices=[
        ('INITIALE', 'Phase Initiale'),
        ('PROCEDURE', 'Phase Procédure'),
        ('APPEL', 'Phase Appel'),
        ('EXECUTION', 'Phase Exécution'),
    ], default='INITIALE')
    
    #  champs pour le rôle client
    # role_client = models.CharField(max_length=20, choices=[
    #     ('demandeur', 'Demandeur'),
    #     ('opposant', 'Opposant'),
    # ], default='demandeur')
    
    # Champs pour la gestion des phases et délais
    affaire_parent = models.ForeignKey('self', on_delete=models.DO_NOTHING, 
                                     db_column='idAffaireParent', blank=True, null=True,
                                     help_text="القضية الأصلية في حالة الاستئناف")
    
    date_debut_phase = models.DateField(blank=True, null=True,
                                      help_text="تاريخ بداية المرحلة الحالية")
    
    delai_limite = models.DateField(blank=True, null=True,
                                  help_text="تاريخ انتهاء الصلاحية للقضية")
    
    etape_actuelle = models.ForeignKey('Etapejudiciaire', on_delete=models.CASCADE,
                                     db_column='idEtapeActuelle', blank=True, null=True,
                                     help_text="الخطوة الحالية في العملية")
    
    jours_retard = models.IntegerField(default=0,
                                     help_text="عدد أيام التأخير")
    
    observations_execution = models.TextField(blank=True, null=True,
                                           help_text="ملاحظات حول سير العملية")

    # Avocat du demandeur (saisie libre, accès permanent au niveau de l'affaire)
    avocat_demandeur_nom = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Nom de l'avocat du demandeur"
    )

    # Champs pour les notifications officielles
    huissier_notification = models.ForeignKey('Huissier', on_delete=models.SET_NULL, null=True, blank=True, related_name='affaires_notification')
    opposant_notification = models.ForeignKey('Opposant', on_delete=models.SET_NULL, null=True, blank=True, related_name='affaires_notification')

    @property
    def dossier_complet(self):
        return f"{self.numero_dossier}/{self.code_dossier}/{self.annee_dossier}"

    def clean(self):
        if not re.match(r'^\d{4}$', self.annee_dossier):
            raise ValidationError({'annee_dossier': 'L\'année doit être composée de 4 chiffres (ex : 2024).'})
#pour l'unicité
    class Meta:
        unique_together = ('numero_dossier', 'code_dossier', 'annee_dossier')
        managed = True
        db_table = 'affairejudiciaire'


class Affairetribunal(models.Model):
    idaffaire = models.ForeignKey(Affairejudiciaire, models.DO_NOTHING, db_column='idAffaire')
    idtribunal = models.ForeignKey('Tribunal', models.DO_NOTHING, db_column='idTribunal')
    datesaisine = models.DateField(db_column='dateSaisine')  # Field name made lowercase.
    datejugement = models.DateField(db_column='dateJugement', blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'affairetribunal'
        unique_together = (('idaffaire', 'idtribunal'),)


class Audience(models.Model):
    idaudience = models.CharField(db_column='idAudience', primary_key=True, max_length=50)  # Field name made lowercase.
    idaffaire = models.ForeignKey(Affairejudiciaire, models.DO_NOTHING, db_column='idAffaire', blank=True, null=True)  # Field name made lowercase.
    idtribunal = models.ForeignKey('Tribunal', models.DO_NOTHING, db_column='idTribunal', blank=True, null=True)  # Field name made lowercase.
    dateaudience = models.DateField(db_column='dateAudience')  # Field name made lowercase.
    heureaudience = models.TimeField(db_column='heureAudience', blank=True, null=True)  # Field name made lowercase.
    titre = models.CharField(max_length=255, blank=True, null=True)
    type_rendez_vous = models.CharField(
        max_length=20,
        choices=[
            ('AUDIENCE', 'Audience'),
            ('CONSULTATION', 'Consultation'),
            ('REUNION', 'Réunion'),
            ('SIGNATURE', 'Signature'),
            ('AUTRE', 'Autre'),
        ],
        default='AUTRE'
    )
    statut = models.CharField(
        max_length=20,
        choices=[
            ('PLANIFIE', 'Planifié'),
            ('CONFIRME', 'Confirmé'),
            ('ANNULE', 'Annulé'),
            ('TERMINE', 'Terminé'),
            ('REPORTE', 'Reporté'),
        ],
        default='PLANIFIE'
    )
    lieu = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    remarques = models.TextField(db_collation='latin1_swedish_ci', blank=True, null=True)
    rappel_24h = models.BooleanField(default=True)
    rappel_1h = models.BooleanField(default=False)
    date_creation = models.DateTimeField(auto_now_add=True, null=True)
    date_modification = models.DateTimeField(auto_now=True, null=True)
    from django.conf import settings
    cree_par = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='audiences_crees', on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        managed = True
        db_table = 'audience'






class Avocat(models.Model):
    idavocat = models.CharField(db_column='idAvocat', primary_key=True, max_length=50, db_collation='latin1_swedish_ci')  # Field name made lowercase.
    nomavocat_fr = models.CharField(db_column='nomAvocat_fr', max_length=255, db_collation='latin1_swedish_ci', null=True, blank=True)
    nomavocat_ar = models.CharField(db_column='nomAvocat_ar', max_length=255, db_collation='latin1_swedish_ci', null=True, blank=True)
    specialisation = models.CharField(max_length=255, db_collation='latin1_swedish_ci', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'avocat'




class Client(models.Model):
    idclient = models.AutoField(db_column='idClient', primary_key=True)
    nomclient_fr = models.CharField(db_column='nomClient_fr', max_length=255, db_collation='latin1_swedish_ci', null=True, blank=True)
    nomclient_ar = models.CharField(db_column='nomClient_ar', max_length=255, db_collation='latin1_swedish_ci', null=True, blank=True)
    adresse1_fr = models.CharField(db_column='adresse1_fr', max_length=255, blank=True, null=True)
    adresse1_ar = models.CharField(db_column='adresse1_ar', max_length=255, blank=True, null=True)
    prenomclient = models.CharField(db_column='prenomClient', max_length=255, blank=True, null=True)
    adresse2_fr = models.CharField(db_column='adresse2_fr', max_length=255, blank=True, null=True)
    adresse2_ar = models.CharField(db_column='adresse2_ar', max_length=255, blank=True, null=True)
    numtel1 = models.CharField(db_column='numTel1', max_length=20, blank=True, null=True)
    numtel1_fr = models.CharField(db_column='numTel1_fr', max_length=20, blank=True, null=True)
    numtel1_ar = models.CharField(db_column='numTel1_ar', max_length=20, blank=True, null=True)
    numtel2 = models.CharField(db_column='numTel2', max_length=20, blank=True, null=True)
    numtel2_fr = models.CharField(db_column='numTel2_fr', max_length=20, blank=True, null=True)
    numtel2_ar = models.CharField(db_column='numTel2_ar', max_length=20, blank=True, null=True)
    email = models.EmailField(db_column='email', max_length=255, blank=True, null=True)
    idtypeclient = models.ForeignKey('TypeClient', models.DO_NOTHING, db_column='idTypeClient', blank=True, null=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True,db_column='user_id')  # pour lier au User

    class Meta:
        managed = True
        db_table = 'client'

    def __str__(self):
        return self.nomclient


class Contrat(models.Model):
    idcontrat = models.AutoField(db_column='idContrat', primary_key=True)  # Field name made lowercase.
    idclient = models.ForeignKey(Client, models.DO_NOTHING, db_column='idClient', blank=True, null=True)  # Field name made lowercase.
    idtypecontrat = models.ForeignKey('TypeContrat', models.DO_NOTHING, db_column='idTypeContrat', blank=True, null=True)  # Field name made lowercase.
    fichier = models.FileField(upload_to='contrats/', null=True, blank=True)  # Nouveau champ pour le fichier du contrat

    class Meta:
        managed = True
        db_table = 'contrat'








class Etapejudiciaire(models.Model):
    idetape = models.CharField(db_column='idEtape', primary_key=True, max_length=50)  # Field name made lowercase.
    datedebut = models.DateField(db_column='dateDebut')  # Field name made lowercase.
    datefin = models.DateField(db_column='dateFin', blank=True, null=True)  # Field name made lowercase.
    idaffaire = models.ForeignKey(Affairejudiciaire, models.DO_NOTHING, db_column='idAffaire', blank=True, null=True)  # Field name made lowercase.
    idtypeetape = models.ForeignKey('TypeEtape', models.DO_NOTHING, db_column='idTypeEtape', blank=True, null=True)  # Field name made lowercase.



    # Liens vers les types spécifiques
    idtypeavertissement = models.ForeignKey('TypeAvertissement', 
                                          models.DO_NOTHING, 
                                          db_column='idTypeAvertissement', 
                                          blank=True, null=True,
                                          help_text="نوع الإنذار")
    
    idtypedemande = models.ForeignKey('TypeDemande', 
                                    models.DO_NOTHING, 
                                    db_column='idTypeDemande', 
                                    blank=True, null=True,
                                    help_text="نوع الطلب")
    
    # Champs pour la gestion des délais
    delai_legal = models.IntegerField(default=0,
                                    help_text="المدة القانونية بالأيام")
    

    date_debut_effective = models.DateField(null=True, blank=True,
                                          help_text="تاريخ بداية التنفيذ الفعلي")
    
    date_fin_effective = models.DateField(null=True, blank=True,
                                        help_text="تاريخ انتهاء التنفيذ الفعلي")
    
    # Champs pour l'ordre et l'obligation
    ordre_etape = models.IntegerField(default=0,
                                    help_text="ترتيب الخطوة في العملية")
    
    etape_obligatoire = models.BooleanField(default=True,
                                           help_text="خطوة إلزامية")
    
    # Champs pour les détails de l'étape
    description_etape = models.TextField(blank=True, null=True,
                                       help_text="وصف تفصيلي للخطوة")
    
    documents_requis = models.TextField(blank=True, null=True,
                                      help_text="المستندات المطلوبة")
    
    observations_etape = models.TextField(blank=True, null=True,
                                        help_text="ملاحظات حول الخطوة")
    

    
    def __str__(self):
        if self.idtypeetape:
            return f"{self.idaffaire.numero_dossier or self.idaffaire.idaffaire} - {self.idtypeetape.libelletypeetape}"
        else:
            return f"{self.idaffaire.numero_dossier or self.idaffaire.idaffaire} - Étape {self.idetape}"
    
    class Meta:
        db_table = 'etapejudiciaire'
        verbose_name = "خطوة قضائية"
        verbose_name_plural = "الخطوات القضائية"


class Expert(models.Model):
    idexpert = models.CharField(db_column='idExpert', primary_key=True, max_length=50, db_collation='latin1_swedish_ci')  # Field name made lowercase.
    nomexpert_fr = models.CharField(db_column='nomExpert_fr', max_length=255, db_collation='latin1_swedish_ci', null=True, blank=True)
    nomexpert_ar = models.CharField(db_column='nomExpert_ar', max_length=255, db_collation='latin1_swedish_ci', null=True, blank=True)
    specialisationexpert = models.CharField(db_column='specialisationExpert', max_length=255, db_collation='latin1_swedish_ci')  # Field name made lowercase.
    telephoneexpert = models.CharField(db_column='telephoneExpert', max_length=20, db_collation='latin1_swedish_ci', blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'expert'


class Facture(models.Model):
    idfacture = models.CharField(db_column='idFacture', primary_key=True, max_length=50, db_collation='latin1_swedish_ci')  # Field name made lowercase.
    montantfacture = models.FloatField(db_column='montantFacture')  # Field name made lowercase.
    datefacture = models.DateField(db_column='dateFacture')  # Field name made lowercase.
    idclient = models.ForeignKey(Client, models.DO_NOTHING, db_column='idClient', blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'facture'


class Huissier(models.Model):
    idhuissier = models.CharField(db_column='idHuissier', primary_key=True, max_length=50, db_collation='latin1_swedish_ci')  # Field name made lowercase.
    nomhuissier_fr = models.CharField(db_column='nomHuissier_fr', max_length=255, db_collation='latin1_swedish_ci', null=True, blank=True)
    nomhuissier_ar = models.CharField(db_column='nomHuissier_ar', max_length=255, db_collation='latin1_swedish_ci', null=True, blank=True)
    adressehuissier_fr = models.TextField(db_column='adresseHuissier_fr', db_collation='latin1_swedish_ci', blank=True, null=True)
    adressehuissier_ar = models.TextField(db_column='adresseHuissier_ar', db_collation='latin1_swedish_ci', blank=True, null=True)
    telephonehuissier = models.CharField(db_column='telephoneHuissier', max_length=20, db_collation='latin1_swedish_ci', blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'huissier'


class Paiementhonoraires(models.Model):
    idpaiement = models.CharField(db_column='idPaiement', primary_key=True, max_length=50, db_collation='latin1_swedish_ci')  # Field name made lowercase.
    idcontrat = models.ForeignKey(Contrat, models.DO_NOTHING, db_column='idContrat', blank=True, null=True)  # Field name made lowercase.
    idetape = models.ForeignKey(Etapejudiciaire, models.CASCADE, db_column='idEtape', blank=True, null=True)  # Field name made lowercase.
    pourcentagepaiement = models.FloatField(db_column='pourcentagePaiement')  # Field name made lowercase.
    montantpaiement = models.FloatField(db_column='montantPaiement')  # Field name made lowercase.
    datepaiement = models.DateField(db_column='datePaiement')  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'paiementhonoraires'


class Participationexpertetape(models.Model):
    id = models.AutoField(primary_key=True)
    idetape = models.ForeignKey(Etapejudiciaire, models.CASCADE, db_column='idEtape')  # Field name made lowercase.
    idexpert = models.ForeignKey(Expert, models.DO_NOTHING, db_column='idExpert')  # Field name made lowercase.
    dateintervention = models.DateField(db_column='dateIntervention')  # Field name made lowercase.
    idtypeintervention = models.ForeignKey('TypeIntervention', models.DO_NOTHING, db_column='idTypeIntervention', blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'participationexpertetape'
        unique_together = (('idetape', 'idexpert'),)


class Participationhuissieretape(models.Model):
    id = models.AutoField(primary_key=True)
    idetape = models.ForeignKey(Etapejudiciaire, models.CASCADE, db_column='idEtape')  # Field name made lowercase.
    idhuissier = models.ForeignKey(Huissier, models.DO_NOTHING, db_column='idHuissier')  # Field name made lowercase.
    dateintervention = models.DateField(db_column='dateIntervention')  # Field name made lowercase.
    idtypeintervention = models.ForeignKey('TypeIntervention', models.DO_NOTHING, db_column='idTypeIntervention', blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'participationhuissieretape'
        unique_together = (('idetape', 'idhuissier'),)


class Participationtemoinetape(models.Model):
    id = models.AutoField(primary_key=True)
    idetape = models.ForeignKey(Etapejudiciaire, models.CASCADE, db_column='idEtape')  # Field name made lowercase.
    idtemoin = models.ForeignKey('Temoin', models.DO_NOTHING, db_column='idTemoin')  # Field name made lowercase.
    dateintervention = models.DateField(db_column='dateIntervention')  # Field name made lowercase.
    idtypeintervention = models.ForeignKey('TypeIntervention', models.DO_NOTHING, db_column='idTypeIntervention', blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'participationtemoinetape'
        unique_together = (('idetape', 'idtemoin'),)


class StatutAffaire(models.Model):
    idstatutaffaire = models.AutoField(db_column='idStatutAffaire', primary_key=True)  # Field name made lowercase.
    idaffaire = models.ForeignKey(Affairejudiciaire, models.DO_NOTHING, db_column='idAffaire')  # Field name made lowercase.
    libellestatutaffaire = models.CharField(db_column='libelleStatutAffaire', max_length=100, db_collation='latin1_swedish_ci')  # Field name made lowercase.
    datedebut = models.DateField(db_column='dateDebut')  # Field name made lowercase.
    datefin = models.DateField(db_column='dateFin', blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'statut_affaire'


class StatutAffairetribunal(models.Model):
    affairetribunal = models.ForeignKey(Affairetribunal, on_delete=models.CASCADE,related_name='statuts_affairetribunal')
    idstatutaffairetribunal = models.AutoField(db_column='idStatutAffaireTribunal', primary_key=True)  # Field name made lowercase.
    libellestatutaffairetribunal = models.CharField(db_column='libelleStatutAffaireTribunal', max_length=100, db_collation='latin1_swedish_ci')  # Field name made lowercase.
    datedebut = models.DateField(db_column='dateDebut')  # Field name made lowercase.
    datefin = models.DateField(db_column='dateFin', blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'statut_affairetribunal'


class StatutAudience(models.Model):
    idstatutaudience = models.AutoField(db_column='idStatutAudience', primary_key=True)  # Field name made lowercase.
    idaudience = models.ForeignKey(Audience, models.CASCADE, db_column='idAudience')  # Field name made lowercase.
    libellestatutaudience = models.CharField(db_column='libelleStatutAudience', max_length=100, db_collation='latin1_swedish_ci')  # Field name made lowercase.
    datedebut = models.DateField(db_column='dateDebut')  # Field name made lowercase.
    datefin = models.DateField(db_column='dateFin', blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'statut_audience'


class StatutEtape(models.Model):
    idstatutetape = models.AutoField(db_column='idStatutEtape', primary_key=True)  # Field name made lowercase.
    idetape = models.ForeignKey(Etapejudiciaire, models.CASCADE, db_column='idEtape')  # Field name made lowercase.
    libellestatutetape = models.CharField(db_column='libelleStatutEtape', max_length=100, db_collation='latin1_swedish_ci')  # Field name made lowercase.
    datedebut = models.DateField(db_column='dateDebut')  # Field name made lowercase.
    datefin = models.DateField(db_column='dateFin', blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'statut_etape'


class StatutFacture(models.Model):
    idstatutfacture = models.AutoField(db_column='idStatutFacture', primary_key=True)  # Field name made lowercase.
    idfacture = models.ForeignKey(Facture, models.DO_NOTHING, db_column='idFacture')  # Field name made lowercase.
    libellestatutfacture = models.CharField(db_column='libelleStatutFacture', max_length=100, db_collation='latin1_swedish_ci')  # Field name made lowercase.
    datedebut = models.DateField(db_column='dateDebut')  # Field name made lowercase.
    datefin = models.DateField(db_column='dateFin', blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'statut_facture'


class Temoin(models.Model):
    idtemoin = models.CharField(db_column='idTemoin', primary_key=True, max_length=50, db_collation='latin1_swedish_ci')  # Field name made lowercase.
    nomtemoin_fr = models.CharField(db_column='nomTemoin_fr', max_length=255, db_collation='latin1_swedish_ci', null=True, blank=True)
    nomtemoin_ar = models.CharField(db_column='nomTemoin_ar', max_length=255, db_collation='latin1_swedish_ci', null=True, blank=True)
    adressetemoin_fr = models.TextField(db_column='adresseTemoin_fr', db_collation='latin1_swedish_ci', blank=True, null=True)
    adressetemoin_ar = models.TextField(db_column='adresseTemoin_ar', db_collation='latin1_swedish_ci', blank=True, null=True)
    roletemoin = models.CharField(db_column='roleTemoin', max_length=100, db_collation='latin1_swedish_ci')  # Field name made lowercase.
    telephonetemoin = models.CharField(db_column='telephoneTemoin', max_length=20, db_collation='latin1_swedish_ci', blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'temoin'


class Tribunal(models.Model):
    idtribunal = models.CharField(primary_key=True, max_length=50)
    nomtribunal_fr = models.CharField(db_column='nomtribunal_fr', max_length=255, null=True, blank=True)
    nomtribunal_ar = models.CharField(db_column='nomtribunal_ar', max_length=255, null=True, blank=True)
    adressetribunal_fr = models.TextField(db_column='adressetribunal_fr', blank=True, null=True)
    adressetribunal_ar = models.TextField(db_column='adressetribunal_ar', blank=True, null=True)
    villetribunal_fr = models.CharField(db_column='villetribunal_fr', max_length=100, blank=True, null=True)
    villetribunal_ar = models.CharField(db_column='villetribunal_ar', max_length=100, blank=True, null=True)
    telephonetribunal = models.CharField(max_length=20, blank=True, null=True)
    idtypetribunal = models.ForeignKey('TypeTribunal', models.DO_NOTHING, db_column='idTypeTribunal', blank=True, null=True)
    
    #relation reflexive
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, db_column='idTribunalParent')

    # Relations avec les catégories d'affaires
    types_affaires = models.ManyToManyField(TypeAffairePrincipale, blank=True, related_name='tribunaux')
    sous_types_affaires = models.ManyToManyField(SousTypeAffaire, blank=True, related_name='tribunaux')
    categories_affaires = models.ManyToManyField(CategorieAffaire, blank=True, related_name='tribunaux')

    def __str__(self):
        return f"{self.nomtribunal_fr or self.nomtribunal_ar or ''} - {self.villetribunal_fr or self.villetribunal_ar or ''}"

    def get_niveau(self):
        # niveau du tribunal
        if self.idtypetribunal:
            return self.idtypetribunal.niveau
        return "Non défini"

    def get_type_competences(self):
        # types d'affaires que ce tribunal peut traiter
        competences = []
        if self.idtypetribunal:
            code_type = self.idtypetribunal.code_type
            if code_type == 'TPI':
                competences = ['Affaires civiles', 'Baux', 'Statut personnel']
            elif code_type == 'CA':
                competences = ['Recours en appel']
            elif code_type == 'CC':
                competences = ['Pourvois en cassation']
            elif code_type == 'TRIB_COM':
                competences = ['Affaires commerciales', 'Litiges commerciaux']
            elif code_type == 'TRIB_ADMIN':
                competences = ['Contentieux administratif', 'Recours administratifs']
            elif code_type == 'TRIB_PENAL':
                competences = ['Affaires pénales', 'Délits', 'Crimes']
        return competences

    class Meta:
        managed = True
        db_table = 'tribunal'
        verbose_name = "Tribunal"
        verbose_name_plural = "Tribunaux"


class TypeAffaire(models.Model):
    idtypeaffaire = models.AutoField(db_column='idTypeAffaire', primary_key=True)  # Field name made lowercase.
    libelletypeaffaire_fr = models.CharField(db_column='libelleTypeAffaire_fr', max_length=100, db_collation='latin1_swedish_ci', null=True, blank=True)
    libelletypeaffaire_ar = models.CharField(db_column='libelleTypeAffaire_ar', max_length=100, db_collation='latin1_swedish_ci', null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'type_affaire'


class TypeClient(models.Model):
    idtypeclient = models.AutoField(db_column='idTypeClient', primary_key=True)  # Field name made lowercase.
    libelletypeclient_fr = models.CharField(db_column='libelleTypeClient_fr', max_length=100, db_collation='latin1_swedish_ci', null=True, blank=True)
    libelletypeclient_ar = models.CharField(db_column='libelleTypeClient_ar', max_length=100, db_collation='latin1_swedish_ci', null=True, blank=True)

    def __str__(self):
        return self.libelletypeclient_fr or self.libelletypeclient_ar or ''

    class Meta:
        managed = False
        db_table = 'type_client'



class TypeContrat(models.Model):
    idtypecontrat = models.AutoField(db_column='idTypeContrat', primary_key=True)  # Field name made lowercase.
    libelletypecontrat_fr = models.CharField(db_column='libelleTypeContrat_fr', max_length=100, db_collation='latin1_swedish_ci', null=True, blank=True)
    libelletypecontrat_ar = models.CharField(db_column='libelleTypeContrat_ar', max_length=100, db_collation='latin1_swedish_ci', null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'type_contrat'


class TypeEtape(models.Model):
    idtypeetape = models.AutoField(db_column='idTypeEtape', primary_key=True)  # Field name made lowercase.
    libelletypeetape = models.CharField(db_column='libelleTypeEtape', max_length=100, db_collation='latin1_swedish_ci')  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'type_etape'


class TypeIntervention(models.Model):
    idtypeintervention = models.AutoField(db_column='idTypeIntervention', primary_key=True)  # Field name made lowercase.
    libelletypeintervention_fr = models.CharField(db_column='libelleTypeIntervention_fr', max_length=100, db_collation='latin1_swedish_ci', null=True, blank=True)
    libelletypeintervention_ar = models.CharField(db_column='libelleTypeIntervention_ar', max_length=100, db_collation='latin1_swedish_ci', null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'type_intervention'


class TypeTribunal(models.Model):
    idtypetribunal = models.AutoField(primary_key=True)
    libelletypetribunal_fr = models.CharField(db_column='libelletypetribunal_fr', max_length=100, null=True, blank=True)
    libelletypetribunal_ar = models.CharField(db_column='libelletypetribunal_ar', max_length=100, null=True, blank=True)
    code_type = models.CharField(max_length=10, unique=True, help_text="Code unique pour identifier le type")
    niveau = models.CharField(max_length=50, help_text="Niveau dans la hiérarchie judiciaire")
    description_fr = models.TextField(db_column='description_fr', blank=True, null=True)
    description_ar = models.TextField(db_column='description_ar', blank=True, null=True)

    def __str__(self):
        return f"{self.libelletypetribunal_fr or self.libelletypetribunal_ar or ''} ({self.niveau})"

    class Meta:
        managed = True
        db_table = 'type_tribunal'
        verbose_name = "Type de tribunal"
        verbose_name_plural = "Types de tribunaux"


class FonctionClient(models.Model):
    idfonction = models.AutoField(primary_key=True)
    libellefonction_fr = models.CharField(db_column='libellefonction_fr', max_length=100, unique=True, null=True, blank=True)
    libellefonction_ar = models.CharField(db_column='libellefonction_ar', max_length=100, unique=True, null=True, blank=True)

    class Meta:
        db_table = 'fonction_client'


class Opposant(models.Model):
    idopposant = models.AutoField(db_column='idOpposant', primary_key=True)
    nomopposant_fr = models.CharField(db_column='nomOpposant_fr', max_length=255, null=True, blank=True)
    nomopposant_ar = models.CharField(db_column='nomOpposant_ar', max_length=255, null=True, blank=True)
    adresse1_fr = models.CharField(db_column='adresse1_fr', max_length=255, blank=True, null=True)
    adresse1_ar = models.CharField(db_column='adresse1_ar', max_length=255, blank=True, null=True)
    adresse2_fr = models.CharField(db_column='adresse2_fr', max_length=255, blank=True, null=True)
    adresse2_ar = models.CharField(db_column='adresse2_ar', max_length=255, blank=True, null=True)
    numtel1 = models.CharField(db_column='numTel1', max_length=20, blank=True, null=True)
    numtel2 = models.CharField(db_column='numTel2', max_length=20, blank=True, null=True)
    email = models.EmailField(db_column='email', max_length=255, blank=True, null=True)
    class Meta:
        db_table = 'opposant'


class AffaireOpposantAvocat(models.Model):

    # Table de liaison pour gérer les relations entre affaires, opposants et avocats

    id = models.AutoField(primary_key=True)
    affaire = models.ForeignKey(Affairejudiciaire, on_delete=models.CASCADE, related_name='opposants_avocats')
    opposant = models.ForeignKey(Opposant, on_delete=models.CASCADE, related_name='affaires_avocats')
    avocat = models.ForeignKey(Avocat, on_delete=models.CASCADE, related_name='affaires_opposants')
    date_debut = models.DateField(auto_now_add=True, help_text="Date de début de la défense")
    date_fin = models.DateField(null=True, blank=True, help_text="Date de fin de la défense (si applicable)")
    role_avocat = models.CharField(max_length=100, blank=True, null=True, help_text="Rôle de l'avocat (ex: défenseur, conseil)")
    actif = models.BooleanField(default=True, help_text="Si l'avocat défend actuellement cet opposant")
    
    class Meta:
        db_table = 'affaire_opposant_avocat'
        unique_together = ('affaire', 'opposant', 'avocat')
        verbose_name = "Relation Affaire-Opposant-Avocat"
        verbose_name_plural = "Relations Affaire-Opposant-Avocat"

    def __str__(self):
        return f"{self.affaire} - {self.opposant} défendu par {self.avocat}"

# table juge
class Juge(models.Model):
    idjuge = models.AutoField(primary_key=True)
    nomjuge = models.CharField(max_length=255)
    prenomjuge = models.CharField(max_length=255)
    matricule = models.CharField(max_length=50, unique=True, help_text="Numéro matricule du juge")
    specialisation = models.CharField(max_length=100, blank=True, null=True, help_text="Spécialisation du juge")
    actif = models.BooleanField(default=True, help_text="Si le juge est actuellement en fonction")
    telephone = models.CharField(max_length=20, blank=True, null=True)

    
    class Meta:
        db_table = 'juge'
        verbose_name = "Juge"
        verbose_name_plural = "Juges"
    
    def __str__(self):
        return f"{self.nomjuge} {self.prenomjuge}"

# table de liansion entre juge et affaire
class AffaireJuge(models.Model):
    id = models.AutoField(primary_key=True)
    affaire = models.ForeignKey(Affairejudiciaire, on_delete=models.CASCADE, related_name='juges_affaire')
    juge = models.ForeignKey(Juge, on_delete=models.CASCADE, related_name='affaires_juge')
    role_juge = models.CharField(max_length=100, help_text="Rôle du juge (rapporteur, président, etc.)")
    date_debut = models.DateField(auto_now_add=True, help_text="Date de début d'intervention")
    date_fin = models.DateField(blank=True, null=True, help_text="Date de fin d'intervention")
    actif = models.BooleanField(default=True, help_text="Si le juge intervient actuellement")
    
    class Meta:
        db_table = 'affaire_juge'
        unique_together = ('affaire', 'juge', 'role_juge')
        verbose_name = "Relation Affaire-Juge"
        verbose_name_plural = "Relations Affaire-Juge"
    
    def __str__(self):
        return f"{self.affaire} - {self.juge} ({self.role_juge})"

# table de demandes
class DemandesFichier(models.Model):
    STATUT_CHOICES = [
        ('EN_ATTENTE', 'En attente'),
        ('APPROUVEE', 'Approuvée'),
        ('REJETEE', 'Rejetée'),
        ('EN_COURS', 'En cours de traitement'),
        ('TERMINEE', 'Terminée'),
    ]
    
    TYPE_DEMANDE_CHOICES = [
        ('COPIE_JUGEMENT', 'Copie de jugement'),
        ('PIECE_PROCEDURE', 'Pièce de procédure'),
        ('EXPERTISE', 'Rapport d\'expertise'),
        ('AUDIENCE', 'Compte-rendu d\'audience'),
        ('COERCITION', 'Demande de coercition'),
        ('AUTRE', 'Autre'),
    ]
    
    id = models.AutoField(primary_key=True)
    # affaire = models.ForeignKey(Affairejudiciaire, on_delete=models.CASCADE, related_name='demandes_fichiers')
    # demandeur = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='demandes_fichiers')
    type_demande = models.CharField(max_length=50, choices=TYPE_DEMANDE_CHOICES)
    description = models.TextField(help_text="Description détaillée de la demande")
    date_demande = models.DateTimeField(auto_now_add=True)
    date_limite = models.DateField(blank=True, null=True, help_text="Date limite pour la réponse")
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='EN_ATTENTE')
    priorite = models.CharField(max_length=20, choices=[
        ('BASSE', 'Basse'),
        ('NORMALE', 'Normale'),
        ('HAUTE', 'Haute'),
        ('URGENTE', 'Urgente'),
    ], default='NORMALE')
    commentaires = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'demande_fichier'
        verbose_name = "Demande de fichier"
        verbose_name_plural = "Demandes de fichiers"
    
    def __str__(self):
        return f"Demande {self.id} - {self.get_type_demande_display()}"

# table de fichiers des affaires
class Fichier(models.Model):
    TYPE_FICHIER_CHOICES = [
        ('JUGEMENT', 'Jugement'),
        ('PIECE_PROCEDURE', 'Pièce de procédure'),
        ('EXPERTISE', 'Rapport d\'expertise'),
        ('AUDIENCE', 'Compte-rendu d\'audience'),
        ('CONTRAT', 'Contrat'),
        ('FACTURE', 'Facture'),
        ('CORRESPONDANCE', 'Correspondance'),
        ('PV_EXECUTION', 'PV d\'exécution'),
        ('PV_INFORMATIF', 'PV Informatif'),
        ('AUTRE', 'Autre'),
    ]
    
    id = models.AutoField(primary_key=True)
    affaire = models.ForeignKey(Affairejudiciaire, on_delete=models.CASCADE, related_name='fichiers')
    demande_fichier = models.ForeignKey(DemandesFichier, on_delete=models.SET_NULL, blank=True, null=True, related_name='fichiers')
    nom_fichier = models.CharField(max_length=255, help_text="Nom original du fichier")
    fichier = models.FileField(upload_to='fichiers_affaires/%Y/%m/%d/', help_text="Fichier uploadé")
    type_fichier = models.CharField(max_length=50, choices=TYPE_FICHIER_CHOICES)
    description = models.TextField(blank=True, null=True)
    # taille_fichier = models.BigIntegerField(blank=True, null=True, help_text="Taille en bytes")
    date_upload = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    upload_par = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='fichiers_uploades')
    version = models.CharField(max_length=10, default='1.0', help_text="Version du fichier")
    public = models.BooleanField(default=False, help_text="Si le fichier est accessible publiquement")
    
    class Meta:
        db_table = 'fichier'
        verbose_name = "Fichier"
        verbose_name_plural = "Fichiers"
    
    def __str__(self):
        return f"{self.nom_fichier} - {self.affaire}"
    
   
class TypeAvertissement(models.Model):
    idtypeavertissement = models.AutoField(db_column='idTypeAvertissement', primary_key=True)
    
    # Champs de base
    libelle_fr = models.CharField(db_column='libelle_fr', max_length=100, null=True, blank=True, help_text="نوع الإنذار")
    libelle_ar = models.CharField(db_column='libelle_ar', max_length=100, null=True, blank=True, help_text="نوع الإنذار بالعربية")
    
    # Champs pour la gestion des délais
    delai_legal = models.IntegerField(default=0, help_text="المدة القانونية")

    # Champs pour la configuration
    obligatoire = models.BooleanField(default=True, help_text="إلزامي")
    actif = models.BooleanField(default=True, help_text="نشط")
    
    # Champs pour les détails
    description = models.TextField(blank=True, null=True, help_text="وصف النوع")

    
    # Champs pour la catégorisation
    categorie = models.CharField(max_length=50, 
                               choices=[
                                   ('CIVIL', 'مدني'),
                                   ('COMMERCIAL', 'تجاري'),
                                   ('TRAVAIL', 'عمل'),
                                   ('FAMILLE', 'أسرة'),
                                   ('PENAL', 'جنائي')
                               ],
                               default='CIVIL',
                               help_text="فئة الإنذار")
    


    
    # Champs pour les notifications
    notification_automatique = models.BooleanField(default=False, 
                                                 help_text="إشعار تلقائي")
    

    def __str__(self):
        return f"{self.libelle_fr or self.libelle_ar or ''} - {self.libelle_ar or self.libelle_fr or ''}"
    
    class Meta:
        db_table = 'type_avertissement'
        verbose_name = "نوع الإنذار"
        verbose_name_plural = "أنواع الإنذارات"

class TypeDemande(models.Model):
    idtypedemande = models.AutoField(db_column='idTypeDemande', primary_key=True)
    
    # Champs de base
    libelle_fr = models.CharField(db_column='libelle_fr', max_length=100, null=True, blank=True, help_text="نوع الطلب")
    libelle_ar = models.CharField(db_column='libelle_ar', max_length=100, null=True, blank=True, help_text="نوع الطلب بالعربية")
    
    # Champs pour la catégorisation
    categorie = models.CharField(max_length=50, 
                               choices=[
                                   ('CIVIL', 'مدني'),
                                   ('COMMERCIAL', 'تجاري'),
                                   ('TRAVAIL', 'عمل'),
                                   ('FAMILLE', 'أسرة'),
                                   ('PENAL', 'جنائي'),
                                   ('ADMINISTRATIF', 'إداري')
                               ],
                               default='CIVIL',
                               help_text="فئة الطلب")
    
    # Champs pour la gestion des délais
    delai_legal = models.IntegerField(default=0, help_text="المدة القانونية")

    
    # Champs pour la configuration
    actif = models.BooleanField(default=True, help_text="نشط")
    # necessite_avocat = models.BooleanField(default=True, help_text="يتطلب محامي")
    
    # Champs pour les détails
    description = models.TextField(blank=True, null=True, help_text="وصف النوع")
    documents_requis = models.TextField(blank=True, null=True, help_text="المستندات المطلوبة")
    # procedure_specifique = models.TextField(blank=True, null=True, help_text="الإجراءات الخاصة")
    

    
    # Champs pour les notifications
    notification_automatique = models.BooleanField(default=False, 
                                                 help_text="إشعار تلقائي")
    

    def __str__(self):
        return f"{self.libelle_fr or self.libelle_ar or ''} - {self.libelle_ar or self.libelle_fr or ''}"
    
    class Meta:
        db_table = 'type_demande'
        verbose_name = "نوع الطلب"
        verbose_name_plural = "أنواع الطلبات"


# MODÈLES POUR L'EXÉCUTION

class PVExecution(models.Model):
      # PV d'exécution تنفيذ الحكم
    
    TYPE_PV_CHOICES = [
        ('abstention', 'Abstention'),
        ('paiement', 'Paiement'),
        ('pv_informatif', 'PV Informatif'),
    ]
    
    id = models.AutoField(primary_key=True)
    etape = models.ForeignKey(Etapejudiciaire, on_delete=models.CASCADE, related_name='pv_execution', to_field='idetape')
    type_pv = models.CharField(max_length=20, choices=TYPE_PV_CHOICES)
    
    # Champs pour paiement
    montant_paye = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True,
                                     help_text="المبلغ المدفوع")
    mode_paiement = models.CharField(max_length=50, null=True, blank=True,
                                   help_text="طريقة الدفع")
    numero_recu = models.CharField(max_length=100, null=True, blank=True,
                                 help_text="رقم الإيصال")
    
    # Champs pour pv_informatif
    motif_absence = models.TextField(null=True, blank=True,
                                   help_text="سبب عدم العثور على المدين")
    
    # Champs communs
    date_pv = models.DateField(auto_now_add=True)
    commentaires = models.TextField(blank=True, null=True)
    
    # Lien vers demande de coercition (si pv_informatif)
    demande_coercition = models.ForeignKey('DemandesFichier', on_delete=models.SET_NULL, 
                                         null=True, blank=True,
                                         help_text="طلب الإكراه البدني")
    
    class Meta:
        db_table = 'pv_execution'
        verbose_name = "PV d'exécution"
        verbose_name_plural = "PV d'exécution"
    
    def __str__(self):
        return f"PV {self.type_pv} - {self.etape}"



# notifications
class Device(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='devices')
    token = models.CharField(max_length=512, unique=True)
    platform = models.CharField(max_length=10, choices=[('android','Android'),('ios','iOS'),('web','Web')])
    created_at = models.DateTimeField(auto_now_add=True)

class Notification(models.Model):
    TYPE_CHOICES = [('AUDIENCE','Audience'),('DOCUMENT','Document'),('FACTURE','Facture'),('ETAPE','Etape'),('RDV','Rendez-vous')]
    LEVEL_CHOICES = [('info','info'),('warning','warning'),('critical','critical')]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    payload = models.JSONField(default=dict, blank=True)
    deep_link = models.JSONField(default=dict, blank=True)  # {"route": "AffaireDetail", "params": {"id": 123}}
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='info')
    affaire = models.ForeignKey('api.Affairejudiciaire', null=True, blank=True, on_delete=models.SET_NULL)
    actor_user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='notifications_generated')
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [models.Index(fields=['user','read_at','-created_at'])]
        ordering = ['-created_at']

# Signals pour créer des notifications automatiques
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone


def _notify_client_for_affaire(affaire, type_code: str, title: str, message: str, *, payload=None, deep_link=None):
    try:
        if not affaire or not getattr(affaire, 'idclient', None):
            return
        client = affaire.idclient
        user = getattr(client, 'user', None)
        if not user:
            return
        # Import tardif pour éviter les import cycles
        from .services import NotificationService
        NotificationService.create(
            user=user,
            type_=type_code,
            title=title,
            message=message,
            affaire=affaire,
            payload=payload or {},
            deep_link=deep_link or {},
        )
    except Exception:
        # On ignore les erreurs de notif pour ne pas casser le flux métier
        pass


@receiver(post_save, sender=Audience)
def notify_new_audience(sender, instance: Audience, created: bool, **kwargs):
    if not created:
        return
    try:
        affaire = instance.idaffaire
        tribunal_name = (getattr(instance.idtribunal, 'nomtribunal_fr', None) or getattr(instance.idtribunal, 'nomtribunal_ar', None)) if instance.idtribunal else None
        date_str = instance.dateaudience.isoformat() if instance.dateaudience else ''
        heure_str = instance.heureaudience.isoformat() if instance.heureaudience else ''
        title = "Nouvelle audience"
        message = f"Le {date_str} {('à ' + heure_str) if heure_str else ''} - {tribunal_name or 'Tribunal'}"
        payload = {
            'idaffaire': getattr(affaire, 'idaffaire', ''),
            'idaudience': instance.idaudience,
            'tribunal': tribunal_name or '',
            'date': date_str,
            'heure': heure_str,
        }
        deep_link = {'route': 'audiences', 'params': {'idaffaire': str(getattr(affaire, 'idaffaire', ''))}}
        _notify_client_for_affaire(affaire, 'AUDIENCE', title, message, payload=payload, deep_link=deep_link)
    except Exception:
        pass


@receiver(post_save, sender=Fichier)
def notify_new_document(sender, instance: Fichier, created: bool, **kwargs):
    if not created:
        return
    try:
        affaire = instance.affaire
        title = "Nouveau document"
        message = instance.nom_fichier or 'Document ajouté'
        payload = {
            'idaffaire': getattr(affaire, 'idaffaire', ''),
            'fichier_id': instance.id,
            'nom_fichier': instance.nom_fichier,
            'type_fichier': instance.type_fichier,
        }
        deep_link = {'route': 'documents', 'params': {}}
        _notify_client_for_affaire(affaire, 'DOCUMENT', title, message, payload=payload, deep_link=deep_link)
    except Exception:
        pass


@receiver(post_save, sender=Etapejudiciaire)
def notify_new_etape(sender, instance: Etapejudiciaire, created: bool, **kwargs):
    # Notifie à la création uniquement
    if not created:
        return
    try:
        affaire = instance.idaffaire
        libelle = getattr(instance.idtypeetape, 'libelletypeetape', None) if instance.idtypeetape else None
        title = "Étape créée"
        message = libelle or f"Étape {instance.idetape}"
        payload = {
            'idaffaire': getattr(affaire, 'idaffaire', ''),
            'idetape': instance.idetape,
            'type_etape': libelle or '',
        }
        deep_link = {'route': 'etapes', 'params': {'idaffaire': str(getattr(affaire, 'idaffaire', ''))}}
        _notify_client_for_affaire(affaire, 'ETAPE', title, message, payload=payload, deep_link=deep_link)
    except Exception:
        pass