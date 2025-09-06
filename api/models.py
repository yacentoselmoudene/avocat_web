
from django.db import models
from django.contrib.auth.models import User
import re
from django.core.exceptions import ValidationError

class Avocat(models.Model):
    idavocat = models.CharField(db_column='idAvocat', primary_key=True, max_length=50, db_collation='latin1_swedish_ci')
    nomavocat = models.CharField(db_column='nomAvocat', max_length=255, db_collation='latin1_swedish_ci')
    specialisation = models.CharField(max_length=255, db_collation='latin1_swedish_ci', blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'avocat'

class Huissier(models.Model):
    idhuissier = models.CharField(db_column='idHuissier', primary_key=True, max_length=50, db_collation='latin1_swedish_ci')
    nomhuissier = models.CharField(db_column='nomHuissier', max_length=255, db_collation='latin1_swedish_ci')
    adressehuissier = models.TextField(db_column='adresseHuissier', db_collation='latin1_swedish_ci', blank=True, null=True)
    telephonehuissier = models.CharField(db_column='telephoneHuissier', max_length=20, db_collation='latin1_swedish_ci', blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'huissier'

# classification des affaires judiciaires selon le code
#categorie 1
class TypeAffairePrincipale(models.Model):
    code = models.CharField(max_length=10, unique=True)
    libelle = models.CharField(max_length=255)

    class Meta:
        db_table = 'type_affaire_principale'
        verbose_name = "Type d'affaire principale"
        verbose_name_plural = "Types d'affaires principales"

    def __str__(self):
        return f"{self.code} - {self.libelle}"

#categorie 2
class SousTypeAffaire(models.Model):
    code = models.CharField(max_length=10, unique=True)
    libelle = models.CharField(max_length=255)
    type_principale = models.ForeignKey(TypeAffairePrincipale, on_delete=models.CASCADE)

    class Meta:
        db_table = 'sous_type_affaire'
        verbose_name = "Sous-type d'affaire"
        verbose_name_plural = "Sous-types d'affaires"

    def __str__(self):
        return f"{self.code} - {self.libelle}"

# categorie 3
class CategorieAffaire(models.Model):
    code = models.CharField(max_length=10, unique=True)
    libelle = models.CharField(max_length=255)
    sous_type = models.ForeignKey(SousTypeAffaire, on_delete=models.CASCADE)

    class Meta:
        db_table = 'categorie_affaire'
        verbose_name = "Catégorie d'affaire"
        verbose_name_plural = "Catégories d'affaires"

    def __str__(self):
        return f"{self.code} - {self.libelle}"


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
    
    # Nouveaux champs pour l'appel
    # tribunal_appel = models.ForeignKey('Tribunal', on_delete=models.SET_NULL, null=True, blank=True, related_name='affaires_appel')
    # delai_appel = models.IntegerField(default=10, help_text="Délai d'appel en jours")
    
    #  champs pour la phase
    phase_processus = models.CharField(max_length=20, choices=[
        ('INITIALE', 'Phase Initiale'),
        ('PROCEDURE', 'Phase Procédure'),
        ('APPEL', 'Phase Appel'),
        ('EXECUTION', 'Phase Exécution'),
    ], default='INITIALE')
    
    # Nouveaux champs pour le rôle client
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

    # Avocat du demandeur
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
    # transforme une méthode en propriété accessible comme un attribut
    # d.dossier_complet sans ()
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
    datesaisine = models.DateField(db_column='dateSaisine')
    datejugement = models.DateField(db_column='dateJugement', blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'affairetribunal'
        unique_together = (('idaffaire', 'idtribunal'),)


class Audience(models.Model):
    idaudience = models.CharField(db_column='idAudience', primary_key=True, max_length=50)
    idaffaire = models.ForeignKey(Affairejudiciaire, models.DO_NOTHING, db_column='idAffaire', blank=True, null=True)
    idtribunal = models.ForeignKey('Tribunal', models.DO_NOTHING, db_column='idTribunal', blank=True, null=True)
    dateaudience = models.DateField(db_column='dateAudience')
    heureaudience = models.TimeField(db_column='heureAudience', blank=True, null=True)
    remarques = models.TextField(db_collation='latin1_swedish_ci', blank=True, null=True)
    
    #  champs pour les rendez-vous
    type_rendez_vous = models.CharField(
        max_length=20,
        choices=[
            ('AUDIENCE', 'Audience judiciaire'),
            ('CONSULTATION', 'Consultation avocat-client'),
            ('REUNION', 'Réunion de préparation'),
            ('SIGNATURE', 'Signature de documents'),
            ('AUTRE', 'Autre rendez-vous'),
        ],
        default='AUDIENCE'
    )
    titre = models.CharField(max_length=200, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    lieu = models.CharField(max_length=200, null=True, blank=True)
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
    rappel_24h = models.BooleanField(default=True)
    rappel_1h = models.BooleanField(default=False)
    date_creation = models.DateTimeField(auto_now_add=True, null=True)
    date_modification = models.DateTimeField(auto_now=True, null=True)
    cree_par = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audiences_crees')

    class Meta:
        managed = True
        db_table = 'audience'


class Client(models.Model):
    idclient = models.AutoField(db_column='idClient', primary_key=True)
    nomclient = models.CharField(db_column='nomClient', max_length=255, db_collation='latin1_swedish_ci')
    prenomclient = models.CharField(db_column='prenomClient', max_length=255, blank=True, null=True)
    adresse1 = models.CharField(db_column='adresse1', max_length=255, blank=True, null=True)
    adresse2 = models.CharField(db_column='adresse2', max_length=255, blank=True, null=True)
    numtel1 = models.CharField(db_column='numTel1', max_length=20, blank=True, null=True)
    numtel2 = models.CharField(db_column='numTel2', max_length=20, blank=True, null=True)
    email = models.EmailField(db_column='email', max_length=255, blank=True, null=True)

    idtypeclient = models.ForeignKey('TypeClient', models.DO_NOTHING, db_column='idTypeClient', blank=True, null=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True,db_column='user_id')  # pour lier au User
    preferred_language = models.CharField(
        max_length=5,
        choices=[('fr', 'Français'), ('ar', 'العربية')],
        default='fr',
        null=True,
        blank=True,
        help_text="Langue préférée de l'interface utilisateur"
    )

    class Meta:
        managed = True
        db_table = 'client'

    def __str__(self):
        return self.nomclient


class Contrat(models.Model):
    idcontrat = models.AutoField(db_column='idContrat', primary_key=True)
    idclient = models.ForeignKey(Client, models.DO_NOTHING, db_column='idClient', blank=True, null=True)
    idtypecontrat = models.ForeignKey('TypeContrat', models.DO_NOTHING, db_column='idTypeContrat', blank=True, null=True)
    fichier = models.FileField(upload_to='contrats/', null=True, blank=True)  # Nouveau champ pour le fichier du contrat

    class Meta:
        managed = True
        db_table = 'contrat'








class Etapejudiciaire(models.Model):
    idetape = models.CharField(db_column='idEtape', primary_key=True, max_length=50)
    datedebut = models.DateField(db_column='dateDebut')
    datefin = models.DateField(db_column='dateFin', blank=True, null=True)
    idaffaire = models.ForeignKey(Affairejudiciaire, models.DO_NOTHING, db_column='idAffaire', blank=True, null=True)
    idtypeetape = models.ForeignKey('TypeEtape', models.DO_NOTHING, db_column='idTypeEtape', blank=True, null=True)


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
    
    #  gestion des délais
    delai_legal = models.IntegerField(default=0,
                                    help_text="المدة القانونية بالأيام")

    date_debut_effective = models.DateField(null=True, blank=True,
                                          help_text="تاريخ بداية التنفيذ الفعلي")
    
    date_fin_effective = models.DateField(null=True, blank=True,
                                        help_text="تاريخ انتهاء التنفيذ الفعلي")
    
    #   l'ordre et l'obligation
    ordre_etape = models.IntegerField(default=0,
                                    help_text="ترتيب الخطوة في العملية")
    
    etape_obligatoire = models.BooleanField(default=True,
                                           help_text="خطوة إلزامية")
    
    #  les détails de l'étape
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
    idexpert = models.CharField(db_column='idExpert', primary_key=True, max_length=50, db_collation='latin1_swedish_ci')
    nomexpert = models.CharField(db_column='nomExpert', max_length=255, db_collation='latin1_swedish_ci')
    specialisationexpert = models.CharField(db_column='specialisationExpert', max_length=255, db_collation='latin1_swedish_ci')
    telephoneexpert = models.CharField(db_column='telephoneExpert', max_length=20, db_collation='latin1_swedish_ci', blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'expert'


class Facture(models.Model):
    idfacture = models.CharField(db_column='idFacture', primary_key=True, max_length=50, db_collation='latin1_swedish_ci')
    montantfacture = models.FloatField(db_column='montantFacture')
    datefacture = models.DateField(db_column='dateFacture')
    idclient = models.ForeignKey(Client, models.DO_NOTHING, db_column='idClient', blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'facture'





class Paiementhonoraires(models.Model):
    idpaiement = models.CharField(db_column='idPaiement', primary_key=True, max_length=50, db_collation='latin1_swedish_ci')
    idcontrat = models.ForeignKey(Contrat, models.DO_NOTHING, db_column='idContrat', blank=True, null=True)
    idetape = models.ForeignKey(Etapejudiciaire, models.CASCADE, db_column='idEtape', blank=True, null=True)
    pourcentagepaiement = models.FloatField(db_column='pourcentagePaiement')
    montantpaiement = models.FloatField(db_column='montantPaiement')
    datepaiement = models.DateField(db_column='datePaiement')

    class Meta:
        managed = True
        db_table = 'paiementhonoraires'


class Participationexpertetape(models.Model):
    id = models.AutoField(primary_key=True)
    idetape = models.ForeignKey(Etapejudiciaire, models.CASCADE, db_column='idEtape')
    idexpert = models.ForeignKey(Expert, models.DO_NOTHING, db_column='idExpert')
    dateintervention = models.DateField(db_column='dateIntervention')
    idtypeintervention = models.ForeignKey('TypeIntervention', models.DO_NOTHING, db_column='idTypeIntervention', blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'participationexpertetape'
        unique_together = (('idetape', 'idexpert'),)


class Participationhuissieretape(models.Model):
    id = models.AutoField(primary_key=True)
    idetape = models.ForeignKey(Etapejudiciaire, models.CASCADE, db_column='idEtape')
    idhuissier = models.ForeignKey(Huissier, models.DO_NOTHING, db_column='idHuissier')
    dateintervention = models.DateField(db_column='dateIntervention')
    idtypeintervention = models.ForeignKey('TypeIntervention', models.DO_NOTHING, db_column='idTypeIntervention', blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'participationhuissieretape'
        unique_together = (('idetape', 'idhuissier'),)


class Participationtemoinetape(models.Model):
    id = models.AutoField(primary_key=True)
    idetape = models.ForeignKey(Etapejudiciaire, models.CASCADE, db_column='idEtape')
    idtemoin = models.ForeignKey('Temoin', models.DO_NOTHING, db_column='idTemoin')
    dateintervention = models.DateField(db_column='dateIntervention')
    idtypeintervention = models.ForeignKey('TypeIntervention', models.DO_NOTHING, db_column='idTypeIntervention', blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'participationtemoinetape'
        unique_together = (('idetape', 'idtemoin'),)


class StatutAffaire(models.Model):
    idstatutaffaire = models.AutoField(db_column='idStatutAffaire', primary_key=True)
    idaffaire = models.ForeignKey(Affairejudiciaire, models.DO_NOTHING, db_column='idAffaire')
    libellestatutaffaire = models.CharField(db_column='libelleStatutAffaire', max_length=100, db_collation='latin1_swedish_ci')
    datedebut = models.DateField(db_column='dateDebut')
    datefin = models.DateField(db_column='dateFin', blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'statut_affaire'


class StatutAffairetribunal(models.Model):
    affairetribunal = models.ForeignKey(Affairetribunal, on_delete=models.CASCADE,related_name='statuts_affairetribunal')
    idstatutaffairetribunal = models.AutoField(db_column='idStatutAffaireTribunal', primary_key=True)
    libellestatutaffairetribunal = models.CharField(db_column='libelleStatutAffaireTribunal', max_length=100, db_collation='latin1_swedish_ci')
    datedebut = models.DateField(db_column='dateDebut')
    datefin = models.DateField(db_column='dateFin', blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'statut_affairetribunal'


class StatutAudience(models.Model):
    idstatutaudience = models.AutoField(db_column='idStatutAudience', primary_key=True)
    idaudience = models.ForeignKey(Audience, models.CASCADE, db_column='idAudience')
    libellestatutaudience = models.CharField(db_column='libelleStatutAudience', max_length=100, db_collation='latin1_swedish_ci')
    datedebut = models.DateField(db_column='dateDebut')
    datefin = models.DateField(db_column='dateFin', blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'statut_audience'


class StatutEtape(models.Model):
    idstatutetape = models.AutoField(db_column='idStatutEtape', primary_key=True)
    idetape = models.ForeignKey(Etapejudiciaire, models.CASCADE, db_column='idEtape')
    libellestatutetape = models.CharField(db_column='libelleStatutEtape', max_length=100, db_collation='latin1_swedish_ci')
    datedebut = models.DateField(db_column='dateDebut')
    datefin = models.DateField(db_column='dateFin', blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'statut_etape'


class StatutFacture(models.Model):
    idstatutfacture = models.AutoField(db_column='idStatutFacture', primary_key=True)
    idfacture = models.ForeignKey(Facture, models.DO_NOTHING, db_column='idFacture')
    libellestatutfacture = models.CharField(db_column='libelleStatutFacture', max_length=100, db_collation='latin1_swedish_ci')
    datedebut = models.DateField(db_column='dateDebut')
    datefin = models.DateField(db_column='dateFin', blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'statut_facture'


class Temoin(models.Model):
    idtemoin = models.CharField(db_column='idTemoin', primary_key=True, max_length=50, db_collation='latin1_swedish_ci')
    nomtemoin = models.CharField(db_column='nomTemoin', max_length=255, db_collation='latin1_swedish_ci')
    adressetemoin = models.TextField(db_column='adresseTemoin', db_collation='latin1_swedish_ci', blank=True, null=True)
    roletemoin = models.CharField(db_column='roleTemoin', max_length=100, db_collation='latin1_swedish_ci')
    telephonetemoin = models.CharField(db_column='telephoneTemoin', max_length=20, db_collation='latin1_swedish_ci', blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'temoin'


class Tribunal(models.Model):
    idtribunal = models.CharField(primary_key=True, max_length=50)
    nomtribunal = models.CharField(max_length=255)
    adressetribunal = models.TextField(blank=True, null=True)
    villetribunal = models.CharField(max_length=100, blank=True, null=True)
    telephonetribunal = models.CharField(max_length=20, blank=True, null=True)
    idtypetribunal = models.ForeignKey('TypeTribunal', models.DO_NOTHING, db_column='idTypeTribunal', blank=True, null=True)
    
    #relation reflexive
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, db_column='idTribunalParent')

    # Relations avec les catégories d'affaires
    types_affaires = models.ManyToManyField(TypeAffairePrincipale, blank=True, related_name='tribunaux')
    sous_types_affaires = models.ManyToManyField(SousTypeAffaire, blank=True, related_name='tribunaux')
    categories_affaires = models.ManyToManyField(CategorieAffaire, blank=True, related_name='tribunaux')

    def __str__(self):
        return f"{self.nomtribunal} - {self.villetribunal}"

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
    idtypeaffaire = models.AutoField(db_column='idTypeAffaire', primary_key=True)
    libelletypeaffaire = models.CharField(db_column='libelleTypeAffaire', max_length=100, db_collation='latin1_swedish_ci')

    class Meta:
        managed = True
        db_table = 'type_affaire'


class TypeClient(models.Model):
    idtypeclient = models.AutoField(db_column='idTypeClient', primary_key=True)
    libelletypeclient = models.CharField(db_column='libelleTypeClient', max_length=100, db_collation='latin1_swedish_ci')

    def __str__(self):
        return self.libelletypeclient

    class Meta:
        managed = True
        db_table = 'type_client'



class TypeContrat(models.Model):
    idtypecontrat = models.AutoField(db_column='idTypeContrat', primary_key=True)
    libelletypecontrat = models.CharField(db_column='libelleTypeContrat', max_length=100, db_collation='latin1_swedish_ci')

    class Meta:
        managed = True
        db_table = 'type_contrat'


class TypeEtape(models.Model):
    idtypeetape = models.AutoField(db_column='idTypeEtape', primary_key=True)
    libelletypeetape = models.CharField(db_column='libelleTypeEtape', max_length=100, db_collation='latin1_swedish_ci')

    class Meta:
        managed = True
        db_table = 'type_etape'


class TypeIntervention(models.Model):
    idtypeintervention = models.AutoField(db_column='idTypeIntervention', primary_key=True)
    libelletypeintervention = models.CharField(db_column='libelleTypeIntervention', max_length=100, db_collation='latin1_swedish_ci')

    class Meta:
        managed = True
        db_table = 'type_intervention'


class TypeTribunal(models.Model):
    idtypetribunal = models.AutoField(primary_key=True)
    libelletypetribunal = models.CharField(max_length=100)
    code_type = models.CharField(max_length=10, unique=True, help_text="Code unique pour identifier le type")
    niveau = models.CharField(max_length=50, help_text="Niveau dans la hiérarchie judiciaire")
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.libelletypetribunal} ({self.niveau})"

    class Meta:
        db_table = 'type_tribunal'
        verbose_name = "Type de tribunal"
        verbose_name_plural = "Types de tribunaux"


class FonctionClient(models.Model):
    idfonction = models.AutoField(primary_key=True)
    libellefonction = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = 'fonction_client'


class Opposant(models.Model):
    idopposant = models.AutoField(db_column='idOpposant', primary_key=True)
    nomopposant = models.CharField(db_column='nomOpposant', max_length=255)
    adresse1 = models.CharField(db_column='adresse1', max_length=255, blank=True, null=True)
    adresse2 = models.CharField(db_column='adresse2', max_length=255, blank=True, null=True)
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

# table de liasion entre juge et affaire
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
    libelle = models.CharField(max_length=100, help_text="نوع الإنذار")
    libelle_ar = models.CharField(max_length=100, help_text="نوع الإنذار بالعربية")
    
    #délais
    delai_legal = models.IntegerField(default=0, help_text="المدة القانونية")

    #  configuration
    obligatoire = models.BooleanField(default=True, help_text="إلزامي")
    actif = models.BooleanField(default=True, help_text="نشط")
    
    # détails
    description = models.TextField(blank=True, null=True, help_text="وصف النوع")

    
    #  catégorisation
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
    


    
    # notifications
    notification_automatique = models.BooleanField(default=False, 
                                                 help_text="إشعار تلقائي")
    

    def __str__(self):
        return f"{self.libelle} - {self.libelle_ar}"
    
    class Meta:
        db_table = 'type_avertissement'
        verbose_name = "نوع الإنذار"
        verbose_name_plural = "أنواع الإنذارات"

class TypeDemande(models.Model):
    idtypedemande = models.AutoField(db_column='idTypeDemande', primary_key=True)
    libelle = models.CharField(max_length=100, help_text="نوع الطلب")
    libelle_ar = models.CharField(max_length=100, help_text="نوع الطلب بالعربية")
    
    #catégorisation
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
    
    #  délais
    delai_legal = models.IntegerField(default=0, help_text="المدة القانونية")

    
    # configuration
    actif = models.BooleanField(default=True, help_text="نشط")
    # necessite_avocat = models.BooleanField(default=True, help_text="يتطلب محامي")
    
    #  détails
    description = models.TextField(blank=True, null=True, help_text="وصف النوع")
    documents_requis = models.TextField(blank=True, null=True, help_text="المستندات المطلوبة")
    #  notifications
    notification_automatique = models.BooleanField(default=False, 
                                                 help_text="إشعار تلقائي")


    def __str__(self):
        return f"{self.libelle} - {self.libelle_ar}"
    
    class Meta:
        db_table = 'type_demande'
        verbose_name = "نوع الطلب"
        verbose_name_plural = "أنواع الطلبات"


#  L'EXÉCUTION

class PVExecution(models.Model):
    TYPE_PV_CHOICES = [
        ('abstention', 'Abstention'),
        ('paiement', 'Paiement'),
        ('pv_informatif', 'PV Informatif'),
    ]
    
    id = models.AutoField(primary_key=True)
    etape = models.ForeignKey(Etapejudiciaire, on_delete=models.CASCADE, related_name='pv_execution', to_field='idetape')
    type_pv = models.CharField(max_length=20, choices=TYPE_PV_CHOICES)
    
    #  paiement
    montant_paye = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True,
                                     help_text="المبلغ المدفوع")
    mode_paiement = models.CharField(max_length=50, null=True, blank=True,
                                   help_text="طريقة الدفع")
    numero_recu = models.CharField(max_length=100, null=True, blank=True,
                                 help_text="رقم الإيصال")
    
    #  pv_informatif
    motif_absence = models.TextField(null=True, blank=True,
                                   help_text="سبب عدم العثور على المدين")
    

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
        # verifie si l'affaire a un client avec un user associé
        if not affaire or not getattr(affaire, 'idclient', None):
            return
        client = affaire.idclient
        user = getattr(client, 'user', None)
        if not user:
            return
        # crée la notification
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
        pass


@receiver(post_save, sender=Audience)
def notify_new_audience(sender, instance: Audience, created: bool, **kwargs):
    if not created:
        return
    try:
        affaire = instance.idaffaire
        tribunal_name = getattr(instance.idtribunal, 'nomtribunal', None) if instance.idtribunal else None
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