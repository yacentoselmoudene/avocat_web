from django.db import migrations, models
from django.conf import settings
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0021_alter_affairejudiciaire_options_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='audience',
            name='type_rendez_vous',
            field=models.CharField(
                default='AUDIENCE',
                max_length=20,
                choices=[
                    ('AUDIENCE', 'Audience judiciaire'),
                    ('CONSULTATION', 'Consultation avocat-client'),
                    ('REUNION', 'Réunion de préparation'),
                    ('SIGNATURE', 'Signature de documents'),
                    ('AUTRE', 'Autre rendez-vous'),
                ],
            ),
        ),
        migrations.AddField(
            model_name='audience',
            name='titre',
            field=models.CharField(max_length=200, null=True, blank=True),
        ),
        migrations.AddField(
            model_name='audience',
            name='description',
            field=models.TextField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name='audience',
            name='lieu',
            field=models.CharField(max_length=200, null=True, blank=True),
        ),
        migrations.AddField(
            model_name='audience',
            name='statut',
            field=models.CharField(
                default='PLANIFIE',
                max_length=20,
                choices=[
                    ('PLANIFIE', 'Planifié'),
                    ('CONFIRME', 'Confirmé'),
                    ('ANNULE', 'Annulé'),
                    ('TERMINE', 'Terminé'),
                    ('REPORTE', 'Reporté'),
                ],
            ),
        ),
        migrations.AddField(
            model_name='audience',
            name='rappel_24h',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='audience',
            name='rappel_1h',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='audience',
            name='date_creation',
            field=models.DateTimeField(auto_now_add=True, null=True),
        ),
        migrations.AddField(
            model_name='audience',
            name='date_modification',
            field=models.DateTimeField(auto_now=True, null=True),
        ),
        migrations.AddField(
            model_name='audience',
            name='cree_par',
            field=models.ForeignKey(
                related_name='audiences_crees',
                on_delete=django.db.models.deletion.SET_NULL,
                to=settings.AUTH_USER_MODEL,
                null=True,
                blank=True,
            ),
        ),
    ]






