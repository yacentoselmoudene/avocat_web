# Référence API

Préfixe commun: `/api/`

## Auth

- POST `/api/token/` — obtenir JWT
- POST `/api/token/refresh/` — rafraîchir JWT

## Ressources (ViewSets)

- `clients/` (Client)
- `avocats/`
- `etapejudiciaires/`
- `audiences/`
- `factures/`
- `contrats/`
- `tribunals/`
- `typeclients/`
- `typeaffaires/`
- `statutaffaires/`
- `statutaudiences/`
- `fonctionclients/`
- `opposants/`
- `categorieaffaires/`
- `affaireopposantavocats/`
- `affairetribunaux/`
- `typetribunals/`
- `typeavertissements/`
- `typedemandes/`
- `temoins/`
- `participationtemoinetapes/`
- `participationexpertetapes/`
- `participationhuissieretapes/`
- `experts/`
- `huissiers/`
- `typeinterventions/`
- `affairejudiciaires/`
- `notifications/`
- `devices/`

CRUD standard: `GET /`, `POST /`, `GET /:id`, `PUT /:id`, `PATCH /:id`, `DELETE /:id`.

## Endpoints spécifiques

- GET `/clients/me/`
- POST `/api/create-client/`
- POST `/api/classification/`
- GET `/api/tribunaux-suggestion/`
- GET `/api/choix-penaux/`
- POST `/api/update-etapes-types/`

### Gestion des affaires

- GET `/api/affaires/:affaire_id/etape-actuelle/`
- POST `/api/affaires/:affaire_id/avancer-etape/`
- POST `/api/affaires/:affaire_id/terminer-etape/`
- GET `/api/affaires/:affaire_id/progression/`
- GET `/api/affaires/:affaire_id/etapes/`
- POST `/api/affaires/:affaire_id/etapes/reset/`
- POST `/api/affaires/:affaire_id/etapes/:etape_id/completer/`
- DELETE `/api/affaires/:affaire_id/etapes/:etape_id/supprimer/`
- POST `/api/affaires/:affaire_id/etapes/creer/`
- DELETE `/api/audiences/:audience_id/supprimer/`
- GET `/api/tribunaux/appel/`
- POST `/api/affaires/appel/`

### Exécution

- POST `/api/affaires/:affaire_id/execution/assigner-huissier/`
- POST `/api/affaires/:affaire_id/execution/contact/`
- POST `/api/affaires/:affaire_id/execution/pv/`
- GET `/api/types-avertissement/`
- GET `/api/types-demande/`

### Notifications

- GET `/api/huissiers-disponibles/`
- GET `/api/opposants-disponibles/`
- POST `/api/affaires/:affaire_id/notification-settings/`

### Fichiers et documents

- POST `/api/affaires/:affaire_id/upload-fichier/`
- GET `/api/affaires/:affaire_id/fichiers/`
- POST `/api/affaires/:affaire_id/etapes/:etape_id/upload-fichier/`
- GET `/api/affaires/:affaire_id/etapes/:etape_id/fichiers/`
- GET `/api/fichiers/`
- GET `/api/documents/`

### Rappels RDV

- POST `/api/rappels-rdv/`

### Mot de passe

- POST `/api/password-reset-request/`
- POST `/api/password-reset-confirm/`





















