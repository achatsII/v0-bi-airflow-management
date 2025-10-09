# Guide technique — court

## 1) Lancer en local
- Prérequis : Node 18+, pnpm, projet GCP BigQuery, fichier `ii-access.json`.
- Variables d’environnement (exemple local) :
  - `NEXT_PUBLIC_ENVIRONMENT=dev`
  - `NEXT_PUBLIC_APP_IDENTIFIER=airflow-management`
  - `NEXT_PUBLIC_BASE_URL=http://localhost:3000`
  - `NEXT_PUBLIC_REDIRECT_PATH=/callback` (optionnel, défaut: `/callback`)
  - `GOOGLE_CLOUD_PROJECT_ID=<votre-projet>`
  - `GOOGLE_APPLICATION_CREDENTIALS=./ii-access.json`
- Commandes :
  - `pnpm install`
  - `pnpm dev` → ouvre http://localhost:3000

## 2) Fichiers très importants (avec mini explication)

- `lib/config.ts` : centralise l’environnement (prod/qa/dev), construit les URLs (`API_BASE_URL`, `AUTH_PORTAL_URL`, `BASE_URL`). Sert de source unique pour le front et les routes API.

- `lib/bigquery.ts` : crée le client BigQuery. Accepte soit un JSON (Vercel) soit un chemin de fichier (local). Gère les clés privées mal formatées et trace l’email du service.

- `middleware.ts` : protège l’app. Laisse passer `/api`, `/login`, `/callback`. Redirige vers `/login` si le cookie `access_token` est absent.

- `app/page.tsx` : écran principal. Sélection du client, champs de config (version, cron, fuseau), toggles, JSON custom, bouton « Enregistrer ». Table des rapports (ajout/suppression). Bouton « Logout ».

- `app/login/page.tsx` et `app/callback/page.tsx` : flux OAuth PKCE côté client. Génère `code_verifier`/`code_challenge`, redirige vers l’Auth Portal, puis appelle `/api/auth/exchange` au retour.

- `app/api/auth/exchange/route.ts` : échange le code contre tokens via le Gateway, pose les cookies httpOnly (`access_token`, `refresh_token`, `access_exp`).

- `app/api/auth/refresh/route.ts` : renouvelle `access_token` à partir de `refresh_token`.

- `app/api/auth/logout/route.ts` : supprime les cookies et renvoie une URL de déconnexion de l’Auth Portal.

- `app/api/clients/route.ts` : GET liste des clients depuis BigQuery (`dw-intelligence-industrielle.Application_Airflow.k2_clients`). (note : la requête SQL utilise le nom de table pleinement qualifié, les variables locales `datasetId`/`tableId` ne sont pas utilisées)

- `app/api/clients/[id]/route.ts` : PUT mise à jour d’un client. Mappe les champs (version, cron, timezone, toggles). Valide le JSON custom et l’enregistre dans `toggle_custom`.

- `app/api/clients/[id]/reports/route.ts` : GET des rapports d’un client.

- `app/api/reports/route.ts` : POST ajout d’un rapport (INSERT BigQuery), DELETE suppression par `dataset_id` (DELETE BigQuery).

## 3) Blocs du projet (vue rapide)

- `app/` : pages UI et routes API (App Router Next.js).
- `lib/` : configuration, BigQuery, utilitaires PKCE et helpers.
- `components/` : composants UI (boutons, cartes, champs, sélecteurs, tableaux).
- `styles/` et `app/globals.css` : styles Tailwind.
- `vercel.json` : config déploiement (région, env par défaut).
- Docs utiles : `ENV_SETUP.md`, `DEPLOYMENT_CHANGES.md`, `VERCEL_SETUP_QUICK_GUIDE.md`.


