# Parcours voyageur (QR + accès direct)

Internationalisation FR / AR (RTL) / EN : voir [i18n-public.md](./i18n-public.md).

## Principe

Un seul formulaire de signalement (`ReportCreatePage`). Seule l’identification du support change :

```text
QR Code
   ↓
Support identifié automatiquement (/report/{uuid})
   ↓
Anonyme ou authentifié
   ↓
Formulaire /report/{uuid}/signaler

Accès direct (/signalement)
   ↓
Choix type + support (GET /api/public/supports)
   ↓
Récapitulatif support + choix anonyme / authentifié
   ↓
Même formulaire /report/{uuid}/signaler?source=direct
   ↓
Type · Description · Pièces jointes · Coordonnées (facultatif si anonyme, désactivées si connecté)
   ↓
Confirmation
```

L’UUID n’est **jamais** saisi par le voyageur. La priorité n’est **jamais** demandée.

Il n’existe pas d’authentification Google dans ce projet : connexion / inscription e-mail uniquement.

## Routes Angular

| Route | Composant | Rôle |
|-------|-----------|------|
| `/accueil` | `HomePage` | Accueil public |
| `/signalement` | `ReportEntryPage` | Choix du support (sans QR) |
| `/report/:uuid` | `ReportWelcomePage` | Support QR + choix identité |
| `/report/:uuid/signaler` | `ReportCreatePage` | Formulaire unique |
| `/mes-signalements` | `MyReportsPage` | Liste (auth) ou invitation compte (anonyme) |
| `/a-propos` | `AboutPage` | Page courte |
| `/connexion` | `PassengerLoginPage` | Connexion |
| `/inscription` | `PassengerRegisterPage` | Inscription |
| `/confirmation` | `ReportConfirmationPage` | Confirmation d’envoi |
| `/report-followup/:uuid` | `ReportTrackingPage` | Détail / réponses (lien e-mail ou liste) |

`/suivi` redirige vers `/mes-signalements`. `/suivi/:uuid` reste un alias du suivi UUID.

## Identité

- **Anonyme** : dépôt possible sans compte (passenger anonyme côté API).
- **Authentifié** : JWT voyageur (`AuthService`, `localStorage`). Le signalement est rattaché au compte.
- Après login/inscription, `returnUrl` ramène au formulaire du support déjà identifié.

## APIs

Inchangées :

- `GET /api/public/supports/{uuid}`
- `POST /api/public/signalements`
- `GET /api/public/signalements/{uuid}/follow-up`
- `POST /api/public/auth/login` / `register` / `GET .../me`
- `GET /api/public/report-types`

Ajouts minimaux (accès direct + Mes signalements) :

- `GET /api/public/supports` — supports **actifs** (catalogue public, sans chemins fichiers)
- `GET /api/public/signalements/mine` — 15 derniers signalements du voyageur **authentifié** (JWT uniquement, pas d’id voyageur en paramètre). Query optionnelle `reference` (filtre partiel, insensible à la casse). Pagination 5 / page côté frontend.
- `GET /api/public/reponses?page=&size=` — réponses **publiées à l’accueil** (`report.publish = true`). **15 plus récentes** maximum, **5 par page**, tri date décroissante. DTO sans données personnelles ni UUID / référence.

## Accueil — réponses publiques

La section « Réponses aux signalements » (sous le bloc principal) affiche des **aperçus** (texte tronqué, bouton Voir plus). Uniquement les signalements avec **Visible à l'accueil**. Si l’agent décoche l’option, elles disparaissent de l’accueil.

## UX

- Navigation : Accueil, Signalement, Mes signalements, À propos (barre basse mobile).
- Mobile first : gros boutons, peu de champs, pas de modal, pas de priorité, pas de saisie d’UUID.
- Voyageur anonyme sur « Mes signalements » : message d’invitation, pas de fausse liste personnelle.

## Fichiers clés

- `src/app/app.routes.ts`
- `src/app/shared/components/public-header.component.ts`
- `src/app/features/report/pages/home.page.ts`
- `src/app/features/report/pages/report-entry.page.ts`
- `src/app/features/report/pages/report-welcome.page.*`
- `src/app/features/report/pages/report-create.page.*`
- `src/app/features/report/pages/my-reports.page.*`
- `src/app/features/report/pages/about.page.ts`
- `src/app/features/report/components/identity-choice.component.ts`
