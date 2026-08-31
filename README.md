# Transport Signalement Frontend

Interface publique voyageur — TRANSTU (Société des Transports de Tunis).

## Prérequis

- Node.js 20+ / 22+
- Backend `transport-api` démarré sur `http://localhost:8080`
- Espace disque libre recommandé : ~1 Go pour `npm install`

## Démarrage

```bash
cd transport-signalement-frontend
npm install
npm start
```

Application : [http://localhost:4200](http://localhost:4200)

Script alternatif si le port 4200 est pris par l'admin : `npm run start:admin-alongside` (port **4300**).

## Parcours QR Code

URL générée côté backend : `{app.qr.base-url}report/{uuid}`

Exemple local : `http://localhost:4200/report/{uuid}`  
Exemple test : `http://192.168.1.55/sig/report/{uuid}`

Le routing Angular classique (Path Location) fonctionne avec le fallback Apache `.htaccess`.

## Fonctionnalités

- Identification du support via UUID (QR)
- Formulaire de signalement (Reactive Forms)
- **Pièces jointes optionnelles** : multi-fichiers, drag & drop, aperçu, contrôles client alignés backend
- Page de confirmation + copie de la référence
- Suivi par référence
- **Multilingue** FR (défaut) / AR (RTL) / EN — voir [documentation/i18n-public.md](./documentation/i18n-public.md)

## Endpoints utilisés

| Méthode | Endpoint | Contenu |
|---------|----------|---------|
| GET | `/api/public/supports/{uuid}` | Support |
| GET | `/api/public/report-types` | Types actifs |
| POST | `/api/public/signalements` | `multipart/form-data` (`report` + `files`) |
| GET | `/api/public/suivi/{reference}` | Suivi |

## Structure utile

```
src/app/features/report/
├── pages/                 # Accueil, création, confirmation, suivi
├── components/
│   ├── attachment-picker  # Zone PJ
│   ├── support-summary
│   └── email-nudge
├── services/
└── models/
```

## Limites pièces jointes (UI + API)

- 5 fichiers maximum
- 10 Mo par fichier / 25 Mo au total
- Formats : JPG, JPEG, PNG, WEBP, PDF

## Configuration runtime et déploiement

La configuration (URL API, etc.) est chargée au démarrage depuis `assets/config/config.json`.

| Environnement | Fichier source | `apiBaseUrl` typique |
|---------------|----------------|----------------------|
| DEV | `src/assets/config/development/config.json` | `""` (proxy → `:8081`) |
| PROD (build) | `src/assets/config/production/config.json` | URL absolue de l'API |

### Build production (sous-répertoire `/sig/`)

```bash
npm run build -- --base-href /sig/
```

Déployer le contenu de `dist/transport-signalement-frontend/browser/` dans le répertoire `/sig/` du serveur web.

Après déploiement, `assets/config/config.json` peut être édité sur le serveur sans rebuild.

**Routing :** Path Location (`/report/{uuid}`) — fallback Apache `.htaccess` requis sous `/sig/`.

Documentation complète (Admin inclus, Apache/nginx, tests) :
[transport-api/documentation/frontend-runtime-config-deployment.md](../transport-api/documentation/frontend-runtime-config-deployment.md)
