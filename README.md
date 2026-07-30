# Transport Signalement Frontend

Interface publique voyageur — TRANSTU (Société des Transports de Tunis).

## Prérequis

- Node.js 20+ / 22+
- Backend `transport-api` démarré sur `http://localhost:8080`
- **Espace disque libre recommandé : ~1 Go** pour `npm install`

## Démarrage

```bash
cd transport-signalement-frontend
npm install
npm start
```

Application : [http://localhost:4200](http://localhost:4200)

## Parcours QR Code

URL générée côté backend : `{app.qr.base-url}/report/{uuid}`

Exemple local : `http://localhost:4200/report/{uuid}`

## Endpoints utilisés

- `GET /api/public/supports/{uuid}`
- `GET /api/public/report-types`
- `POST /api/public/signalements`
- `GET /api/public/suivi/{reference}`
