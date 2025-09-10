from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Client

@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    class ClientAdmin(admin.ModelAdmin):
        list_display = ('idclient', 'nomclient', 'user', 'idtypeclient')
        fields = ('nomclient', 'adresseclient', 'idtypeclient', 'user')

from .models import TypeAffairePrincipale, SousTypeAffaire, CategorieAffaire
admin.site.register(TypeAffairePrincipale)
admin.site.register(SousTypeAffaire)
admin.site.register(CategorieAffaire)


