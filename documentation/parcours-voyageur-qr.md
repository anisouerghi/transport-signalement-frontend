# Parcours voyageur après scan QR

Internationalisation FR / AR (RTL) / EN : voir [i18n-public.md](./i18n-public.md).

## Flux

```text
Scan QR → /report/{uuid}           Page Welcome
              ├─ Continuer anonymement → /report/{uuid}/signaler
              ├─ Se connecter        → /connexion?returnUrl=...
              ├─ Créer un compte     → /inscription?returnUrl=...
              └─ (déjà connecté)     → actions rapides
```

L'UUID du support est conservé dans l'URL pendant tout le parcours.

## Routes Angular

| Route | Composant | Rôle |
|-------|-----------|------|
| `/report/:uuid` | `ReportWelcomePage` | Accueil après QR |
| `/report/:uuid/signaler` | `ReportCreatePage` | Formulaire existant (inchangé) |
| `/connexion` | `PassengerLoginPage` | Connexion voyageur |
| `/inscription` | `PassengerRegisterPage` | Création de compte |

## Authentification

- `AuthService` : session JWT en `localStorage` (`transtu_passenger_session`)
- `authInterceptor` : ajoute `Authorization: Bearer …`
- `APP_INITIALIZER` : restauration via `GET /api/public/auth/me`
- Le mot de passe n'est **jamais** stocké côté client

## APIs utilisées (inchangées sauf auth)

- `GET /api/public/supports/{uuid}` — support détecté
- `POST /api/public/signalements` — création signalement
- `GET /api/public/suivi/{uuid}` — suivi
- `POST /api/public/auth/login` — connexion
- `POST /api/public/auth/register` — inscription
- `GET /api/public/auth/me` — profil session

## Fichiers clés

- `src/app/features/report/pages/report-welcome.page.*`
- `src/app/core/services/auth.service.ts`
- `src/app/core/interceptors/auth.interceptor.ts`
- `src/app/app.routes.ts`
