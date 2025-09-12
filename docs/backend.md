# Backend (Django REST Framework)

## Aperçu

- Framework: Django 5 + DRF
- Authentification: JWT (`rest_framework_simplejwt`)
- Base de données: MySQL
- CORS: `django-cors-headers`

## Installation

```bash
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # si utilisé
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

## Configuration

- `DATABASES` (MySQL) configurable via `avocat/settings.py`
- `MEDIA_URL` `/media/`, fichiers stockés sous `media/`
- `REST_FRAMEWORK` utilise JWT et permissions `IsAuthenticated` par défaut
- CORS activé pour `http://localhost:5173`

## Apps principales

- `api` (modèles, vues, sérialiseurs)
- `avocat` (settings, urls)

## Commandes utiles

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
python manage.py send_rdv_reminders
```

## Données et médias

- Uploads: `media/` (contrats, fichiers affaires, etc.)
- Tables principales: `Affairejudiciaire`, `Etapejudiciaire`, `Audience`, `Client`, `Tribunal`, etc.

## Sécurité

- Ne commitez jamais une vraie `SECRET_KEY` en production
- Configurez `DEBUG=False` et `ALLOWED_HOSTS`








