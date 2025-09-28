# Déploiement

## Préparation production

- `DEBUG=False`
- Régler `ALLOWED_HOSTS`
- Base MySQL managée (créer DB, utilisateur, charset `utf8mb4`)
- Secret: définir `SECRET_KEY` via variable d'environnement

## Static et média

- `MEDIA_ROOT`: dossier persistant
- Servir les médias via Nginx/Apache

## Exécution

- WSGI: `avocat.wsgi:application`
- Process manager: gunicorn/uvicorn + systemd
- Reverse proxy: Nginx

## MIGRATIONS

```bash
python manage.py migrate
python manage.py collectstatic --noinput
```

## Tâches planifiées

- Commande `send_rdv_reminders` pour rappels RDV (cron/systemd timer)





















