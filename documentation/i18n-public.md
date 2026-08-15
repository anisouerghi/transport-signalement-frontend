# Internationalisation (i18n) — interface publique Voyageur

## Langues disponibles

| Code | Langue | Direction | Rôle |
|------|--------|-----------|------|
| `fr` | Français | LTR | **Par défaut** |
| `ar` | العربية | RTL | Option |
| `en` | English | LTR | Option |

## Stack

- `@ngx-translate/core` + `@ngx-translate/http-loader`
- Fichiers JSON : `src/assets/i18n/{fr,ar,en}.json`
- Chargement : préfixe **absolu** `/assets/i18n/` + `useHttpBackend: true` (évite les 404 selon la route et le passage par les interceptors)
- Service : `src/app/core/services/language.service.ts`
- Sélecteur : en-tête `PublicHeaderComponent` (`FR | العربية | EN`)

## Persistance

Clé `localStorage` : `transtu_public_lang` (`fr` | `ar` | `en`).

- Aucune valeur → français au démarrage.
- Après un choix utilisateur → valeur mémorisée pour les visites suivantes.

## Sélecteur

Dans l’en-tête publique : **FR | العربية | EN**. Le basculement est immédiat (ngx-translate) sans rechargement de page, donc sans perte du formulaire ni de l’UUID dans l’URL.

## RTL (arabe)

Lorsque `ar` est actif :

- `document.documentElement.dir = 'rtl'`
- classe CSS `lang-rtl` sur `<html>`
- adaptations dans `styles.scss` (police Noto Sans Arabic, bordures, listes, select)

Français et anglais restent en `ltr`.

## Organisation des clés

```text
common.*          — libellés partagés
header.* / footer.*
home.*            — page d'accueil
welcome.*         — post-QR
support.*         — résumé support
report.*          — formulaire signalement
emailNudge.*
attachments.*
auth.*            — connexion / inscription
confirmation.*
followUp.*        — suivi
notFound.*
errors.*          — interceptor + erreurs métier UI
gps.*             — messages localisation (préparés)
```

## Données Backend

Les libellés métier issus de l’API (`reportType.label`, `statusLabel`, `support.label`, messages de réponses admin) sont affichés **tels quels**. Aucune traduction automatique côté frontend tant que le backend ne fournit pas de variantes multilingues.

Stratégie future (sans casser les API) : si l’API expose un objet multi-langue (ex. `labelFr` / `labelAr` / `labelEn` ou `labels: { fr, ar, en }`), mapper côté affichage via `LanguageService.currentLang()` ; sinon conserver le libellé unique actuel.

## Non modifié

- API backend
- parcours QR / UUID
- logique d’authentification et de suivi
- structure des services métier
