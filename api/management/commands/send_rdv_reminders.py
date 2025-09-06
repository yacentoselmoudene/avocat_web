from django.core.management.base import BaseCommand
from api.services import NotificationService


class Command(BaseCommand):
    help = 'Envoie les rappels de rendez-vous (24h et 1h avant)'

    def handle(self, *args, **options):
        self.stdout.write('🔔 Début de l\'envoi des rappels de rendez-vous...')
        
        try:
            result = NotificationService.check_and_send_rdv_reminders()
            
            if result:
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✅ Rappels envoyés avec succès:\n'
                        f'   - Rappels 24h: {result.get("rappels_24h_envoyes", 0)}\n'
                        f'   - Rappels 1h: {result.get("rappels_1h_envoyes", 0)}'
                    )
                )
            else:
                self.stdout.write(
                    self.style.ERROR('❌ Erreur lors de l\'envoi des rappels')
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Erreur: {str(e)}')
            )




