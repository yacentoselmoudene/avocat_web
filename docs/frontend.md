# Frontend (React + Vite)

## Démarrage

```bash
cd frontend
npm install
npm run dev
```

Application disponible sur `http://localhost:5173`.

## Dépendances clés

- `react`, `react-router-dom`
- `i18next`, `react-i18next` (multi-langues FR/AR)
- `axios` pour l'API

## Structure

- `src/pages`: pages principales (`Dashboard`, `AgendaPage`, `AffairesSection`, etc.)
- `src/components`: composants UI
- `src/api`: clients API (axios)
- `src/i18n.js`: configuration i18n

## Build et preview

```bash
npm run build
npm run preview
```

## Configuration API

Modifier la base URL dans `src/api/axios.js` si besoin.





















