# CabinetAvocat

Application complète de gestion de cabinet d'avocat.

- Backend: Django REST Framework (MySQL)
- Frontend: React + Vite

## Démarrage rapide

1) Prérequis: Python 3.12+, Node 18+, MySQL 8+
2) Backend:

```bash
python -m venv .venv && .venv\\Scripts\\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

3) Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Documentation

La documentation complète est disponible dans le dossier `docs`:

- [Introduction et index](docs/index.md)
- [Backend (installation, configuration)](docs/backend.md)
- [API (endpoints)](docs/api.md)
- [Frontend (développement, i18n)](docs/frontend.md)
- [Déploiement (prod)](docs/deployment.md)
- [Contribuer et style de code](docs/contributing.md)
