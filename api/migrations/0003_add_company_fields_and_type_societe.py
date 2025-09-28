# Generated manually for company fields and TypeSociete model

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_remove_client_prenomclient_client_prenomclient_ar_and_more'),
    ]

    operations = [
        #  type_societe
        migrations.CreateModel(
            name='TypeSociete',
            fields=[
                ('idtypesociete', models.AutoField(db_column='idTypeSociete', primary_key=True, serialize=False)),
                ('libelletypesociete_fr', models.CharField(blank=True, db_column='libelleTypeSociete_fr', max_length=100, null=True)),
                ('libelletypesociete_ar', models.CharField(blank=True, db_column='libelleTypeSociete_ar', max_length=100, null=True)),
            ],
            options={
                'db_table': 'type_societe',
                'managed': True,
            },
        ),
        
        # nouveaux champs de table client
        migrations.AddField(
            model_name='client',
            name='reference_client',
            field=models.CharField(blank=True, db_column='reference_client', max_length=50, null=True, unique=True),
        ),
        migrations.AddField(
            model_name='client',
            name='raison_sociale_fr',
            field=models.CharField(blank=True, db_column='raisonSociale_fr', max_length=255, null=True, help_text='Raison sociale en français'),
        ),
        migrations.AddField(
            model_name='client',
            name='raison_sociale_ar',
            field=models.CharField(blank=True, db_column='raisonSociale_ar', max_length=255, null=True, help_text='الاسم التجاري'),
        ),
        migrations.AddField(
            model_name='client',
            name='idtypesociete',
            field=models.ForeignKey(blank=True, db_column='idTypeSociete', null=True, on_delete=django.db.models.deletion.SET_NULL, to='api.typesociete'),
        ),
    ]
