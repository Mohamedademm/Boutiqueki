# 📒 Fiche Projet BoutiqueKi — Document de Référence Vivant

> **But de ce document** : c'est la mémoire centrale du projet. Il contient l'architecture, les concepts globaux, l'état réel, les points faibles identifiés, la feuille de route, et un journal des modifications. **À lire en priorité au début de chaque session** et **à mettre à jour à la fin de chaque session.**
>
> Dernière mise à jour : **2026-06-17** (Phase A en cours)

---

## 1. Vue d'ensemble

**BoutiqueKi** est une marketplace SaaS multi-boutiques : des vendeurs (`owner`) créent leur boutique et leurs produits ; des acheteurs (`client`) explorent, ajoutent au panier, commandent et suivent leurs commandes/réclamations ; un `admin` supervise toute la plateforme.

| | |
|---|---|
| **Type** | Marketplace e-commerce multi-vendeurs |
| **Langue UI** | Français |
| **Rôles** | `admin` (superutilisateur), `owner` (vendeur), `client` (acheteur) |
| **Repo Git** | https://github.com/Mohamedademm/Boutiqueki |
| **Branche principale** | `main` |

---

## 2. Stack technique

### Backend (`backend/`)
- **Node.js + Express 4** — architecture **modulaire par domaine** (`src/modules/<domaine>/`).
- **PostgreSQL** via le driver `pg` (SQL brut, pas d'ORM). Migrations SQL versionnées dans `backend/migrations/`.
- **Auth** : JWT access token (15 min) + refresh token (7 j, cookie httpOnly `boutiki_refresh`), bcrypt (`bcryptjs`, 12 rounds), Google OAuth (`google-auth-library`).
- **Validation** : Zod (un `schema.js` par module).
- **Sécurité** : `helmet`, `cors` (origines configurables via `CLIENT_URL`), `express-rate-limit` (global 1000/15min + limiteur auth strict 20/15min), audit logs.
- **Paiement** : Stripe (webhook en raw body), config-gated.
- **Email** : `utils/email.js` (réinitialisation mot de passe, confirmation commande).
- **Tests** : Jest + Supertest — `backend/tests/` (auth, coupon, api). **13 tests passants.**

### Frontend (`frontend/`)
- **React 19 + Vite 8 + Tailwind CSS 3**.
- **State** : Zustand (`useAuthStore`, `useCartStore`, `useWishlistStore`), TanStack Query (hooks data), React Hook Form + Zod.
- **Routing** : React Router 7, routes lazy-loaded avec Suspense.
- **UI** : Framer Motion (animations), lucide-react (icônes ⚠️ **Facebook/Instagram/Twitter n'existent PAS dans lucide-react**), recharts (graphiques analytics).
- **HTTP** : axios avec intercepteur (`utils/axios.js`) — `VITE_API_URL` configurable.

### Dark mode
- **Clair par défaut** + bouton (soleil/lune) dans le header consumer, choix mémorisé (`localStorage.theme`).
- Tailwind `darkMode: 'class'` (classe `.dark` sur `<html>`). Toutes les pages client ont des variantes `dark:` (palette : page `slate-950`, surfaces `slate-900`, inputs `slate-800`, texte clair).
- ⚠️ Après ajout massif de classes via script externe, **redémarrer le serveur Vite** pour que Tailwind régénère le CSS (sinon les nouvelles classes `dark:` ne s'appliquent pas en dev).

### Données de démo (seed)
- `cd backend && npm run seed` → catalogue riche : 5 boutiques thématiques + enrichit les boutiques existantes (~60 produits actifs, images Unsplash, variantes, stock). Idempotent. Vendeurs démo : mot de passe `password123`.

### Base de données — IMPORTANT
- **Local** : PostgreSQL via **Docker Desktop** (conteneur `boutiqueki`, image `postgres:15-alpine`, port `5432`, DB `boutiki`). C'est ce que le `.env` actif utilise : `DATABASE_URL=postgresql://user:password@localhost:5432/boutiki`.
- **Production** : **Neon.tech** (PostgreSQL serverless, région AWS Europe Central 1 / Frankfurt). La `DATABASE_URL` Neon est **commentée** dans le `.env` local et configurée dans les variables d'env Vercel.

### Déploiement
- **Frontend** → Vercel. **Backend** → Vercel serverless-ready (voir `DEPLOYMENT.md`). **DB** → Neon.

---

## 3. Architecture des modules backend

Routes montées dans `backend/src/app.js` :

| Préfixe | Module | Rôle |
|---|---|---|
| `/api/auth` | `auth` | register, login, google, refresh, logout, forgot/reset password, me |
| `/api/users` | `users` | profil utilisateur |
| `/api/shops` | `shops`, `categories`, `products`, `stock`, `orders`, `coupons` | gestion boutique (owner) |
| `/api/admin` | `admin` | supervision plateforme |
| `/api/public` | `public` | vitrine (boutiques, produits, settings publics) — **sans auth** |
| `/api/checkout` | `checkout` | création de commande (totaux recalculés serveur, stock décrémenté en transaction) |
| `/api/uploads` | `uploads` | upload d'images (multer) |
| `/api/payments` | `payments` | Stripe (config-gated) |
| `/api/claims` | `claims` | réclamations client |
| `/api/orders` | `client` | `/api/orders/my` — commandes du client |
| `/api/wishlist` | `wishlist` | favoris client |

**RBAC** : `middleware/requireRole.js` — `admin` a accès à tout ; sinon vérifie l'appartenance au rôle. Ownership check sur les ressources boutique.

**Garde maintenance** : middleware global qui bloque tout (sauf auth/admin/health/settings publics) si `flags.maintenance` est activé dans les settings.

---

## 4. Pages frontend

### Public / Client (layout `ConsumerLayout` : header + footer)
`LandingPage`, `ExplorePage` (`/explore`), `BoutiquesDirectoryPage` (`/boutiques`), `ProductsExplorePage` (`/explore/products`), `PublicShopPage` (`/s/:slug`), `PublicProductPage` (`/s/:slug/p/:id`), `CheckoutPage`.

### Espace client (`ClientLayout` : navigation par onglets animés, imbriqué dans ConsumerLayout)
`/client` (dashboard), `/client/orders`, `/client/claims`, `/client/wishlist`, `/client/profile`.

### Espace vendeur (`DashboardLayout` : sidebar)
`DashboardPage`, `ProductsPage`, `ProductFormPage`, `StockPage`, `OrdersPage`, `AnalyticsPage`, `ShopBuilderPage`, `SettingsPage`, `OnboardingPage`.

### Admin
`AdminDashboardPage`, `AdminShopsPage`, `AdminUsersPage`, `AdminClaimsPage`, `AdminSettingsPage`.

### Auth
`LoginPage`, `RegisterPage`, `ForgotPasswordPage`, `ResetPasswordPage`.

---

## 5. Conventions & pièges connus

- **Rôle par défaut = `client`** (inscription + Google OAuth). Les vendeurs choisissent explicitement `owner`.
- **lucide-react** : pas d'icônes de marques (Facebook/Instagram/Twitter). Utiliser des SVG inline si besoin.
- **Réponses API** enveloppées : `{ success, message, data }`. Le token de login est dans `res.data.data.token`.
- **IDs = UUID** (pas d'entiers séquentiels). Les URLs produit utilisent l'UUID.
- **ESLint** doit ignorer `dist`, `.vercel`, `node_modules`, `build` (sinon il lint les bundles minifiés → centaines de fausses erreurs).
- **Encodage** : préférer ASCII dans le code (certains anciens fichiers avaient des caractères accentués mal encodés).
- **Preview** : `preview_snapshot` (arbre d'accessibilité) est fiable ; `preview_screenshot` time out souvent.

---

## 6. Points faibles identifiés (audit 2026-06-17)

Classés par priorité. ✅ = corrigé, ⬜ = à faire.

### 🔴 Sécurité & robustesse
- ✅ **Brute-force auth** : limiteur strict (20/15min) ajouté sur login/register/forgot/reset.
- ✅ **Rôle par défaut incohérent** : Google OAuth créait des `owner` ; inscription défaut `owner`. Corrigé → `client`.
- ⬜ **Pas de rotation/blocklist de refresh token** au-delà du remplacement simple (acceptable pour MVP).
- ✅ **Validation upload** : multer limite déjà à 5 MB + filtre MIME images. **SVG retiré** (vecteur XSS stocké via `/uploads`).
- ⬜ **Pas de CSRF token** sur les routes cookie (refresh). Bearer pour le reste — risque faible mais à documenter.

### 🟠 Qualité du code
- ✅ **ESLint scannait `.vercel/output`** → 382 erreurs fantômes. Ignore corrigé → 49 vraies issues.
- ✅ **Nettoyage lint** : 33 unused-vars supprimés (imports/vars morts dans ~20 fichiers). **382 → 16** problèmes.
- ⬜ **16 issues lint restantes** (structurelles, faible priorité) : 11 `set-state-in-effect`, 2 `react-refresh/only-export-components`, 2 `static-components`, 1 `exhaustive-deps`. Refactor risqué — à traiter au cas par cas.
- ✅ **Tests frontend** : Vitest + Testing Library en place — 11 tests (utilitaire SEO + composant ProductCard). Branchés dans la CI.
- ✅ **Couverture backend étendue** : ajout de tests schéma checkout / products (+ régression prix variant) / stock. **13 → 47 tests** passants. Reste : claims, wishlist.
- ✅ **Error Boundary** global (fallback convivial, prêt pour Sentry via `window.Sentry` + `VITE_SENTRY_DSN`).

### 🟡 Performance & UX
- ⬜ **Bundle recharts** (`AreaChart` ~364 kB) — chargé en lazy sur Analytics uniquement (acceptable, mais surveiller).
- ⬜ **Images non optimisées** (pas de lazy/responsive systématique, pas de CDN/transform).
- 🟡 **Accessibilité** : aria-labels sur les boutons icône (header, footer social, wishlist, steppers de quantité). Reste : audit complet focus/contraste/aria sur les formulaires & le dashboard.
- ✅ **SEO** : sitemap.xml + `robots.txt` + Open Graph (défauts statiques dans `index.html` + dynamiques par page) + **JSON-LD** (`Product`/`Store`). `index.html` corrigé : `lang="fr"`, meta description, theme-color.

### 🟢 Outillage & process
- ⬜ **Pas de CI** (GitHub Actions : lint + tests backend + build frontend).
- ⬜ **Pas de monitoring d'erreurs** (Sentry ou équivalent).
- ⬜ **Pas de `.env.example`** à jour côté backend/frontend (à vérifier).
- ⬜ **README racine absent** (seul le template Vite par défaut existe dans `frontend/`).

---

## 7. Feuille de route recommandée

### Phase A — Durcissement (sécurité + qualité) ✅ quasi terminée
1. ✅ Limiteur brute-force auth.
2. ✅ Cohérence rôle par défaut.
3. ✅ Fix config ESLint.
4. ✅ Nettoyage des unused-vars (382 → 16 issues ; reste 16 structurelles, faible priorité).
5. ✅ Validation uploads (SVG retiré ; MIME + 5 MB déjà en place).
6. ✅ Tests backend : checkout, products (+ régression prix variant), stock (13 → 47 tests).

### Phase B — Fiabilité ✅ terminée
7. ✅ CI GitHub Actions (backend tests + frontend lint, tests & build).
8. 🟡 Error Boundary global prêt pour Sentry. Reste : créer un projet Sentry + brancher le DSN (`VITE_SENTRY_DSN`).
9. ✅ `.env.example` (backend PORT corrigé, frontend VITE_API_URL ajouté) + README racine complet.
10. ✅ Smoke tests frontend (Vitest + Testing Library, 11 tests).

### Phase Perf — Performance ✅ première passe faite
- ✅ **Code-splitting Vite** (`manualChunks`) : `react-vendor` / `motion` / `charts` séparés → **chunk app 436 kB → 89 kB**, vendors cachés entre déploiements.
- ✅ **React Query** `staleTime: 60s` + `gcTime: 5min` → moins de refetch à la navigation.
- ✅ **Lazy loading** images déjà en place sur les grilles produits (ProductCard, PublicShopPage).
- ⬜ Images responsive / CDN (Cloudinary transform) — gros gain restant.
- ⬜ Précharge des routes critiques, compression Brotli côté hébergeur.

### Phase C — Expérience & croissance
11. 🟡 Optimisation images : **lazy loading généralisé** + code-split faits. Reste : responsive `srcset` / CDN (Cloudinary — nécessite un compte).
12. 🟡 Accessibilité : 1ère passe (header). Reste : audit complet.
13. ✅ SEO produit (Open Graph + JSON-LD `Product`/`Store`).
14. ✅ Suivi commande : **timeline de statut** côté client + **emails transactionnels** de changement de statut (préparation/expédiée/livrée/annulée) + **validation** du statut côté API (enum).
15. ⬜ Recherche globale multi-boutiques + filtres avancés.
16. ✅ **Page 404** + route catch-all (`*`) — les URLs inconnues affichent une page dédiée au lieu d'un écran blanc.

---

## 8. Journal des modifications (changelog)

> Une ligne par session/itération. Le plus récent en haut.

- **2026-06-18** *(dark mode + seed)* — `npm run seed` (catalogue riche : 5 boutiques + enrichissement → 60 produits, images réelles). **Dark mode** sur toutes les pages client (clair par défaut + toggle header) : 525 variantes `dark:` via codemod, palette cohérente. Vérifié en preview (light + dark OK, screenshot). Build ✓, lint 0 erreur.
- **2026-06-18** *(SEO HTML)* — `index.html` : `lang="en"→"fr"`, meta description + Open Graph par défaut + theme-color ; ajout `public/robots.txt` (réf. sitemap). Vérifié (lang=fr, robots 200, build ✓).
- **2026-06-18** *(emails statut + a11y)* — Emails de changement de statut commande + validation enum du statut côté API (route `PUT /orders/:id/status`). 2e passe accessibilité (aria-labels footer social, wishlist, steppers quantité + aria-pressed/aria-live). Vérifié en preview. Tout vert.
- **2026-06-18** *(404 + suivi commande + tests)* — Page 404 dédiée + route catch-all, timeline de statut de commande sur l'espace client, +7 tests backend (protection des routes wishlist/claims/orders + régression rôle par défaut `client`). Backend **47 → 54 tests**. Lint clean, build ✓, 404 vérifiée en preview.
- **2026-06-18** *(SEO + Tests + UX)* — JSON-LD (`Product`/`Store`) + Open Graph dynamiques, **Error Boundary** global (Sentry-ready), **Vitest + Testing Library** (11 tests) branchés en CI, lazy loading généralisé sur toutes les images, aria-labels sur le header. Vérifié en preview (JSON-LD injecté, 0 erreur console). Tout vert : backend 47, front 11, lint 0 erreur, build ✓.
- **2026-06-18** *(Phase B + Perf)* — Code-splitting Vite (chunk app 436→89 kB), React Query staleTime/gcTime, `.env.example` complétés (backend PORT, frontend VITE_API_URL), README racine créé, CI enrichie (lint), 16 erreurs lint structurelles passées en warnings (0 erreur). Build ✓.
- **2026-06-17** *(Phase A)* — Durcissement : nettoyage lint (382→16, tous les unused-vars supprimés dans ~20 fichiers), retrait SVG des uploads (anti-XSS), +34 tests backend (checkout/products/stock, dont régression prix variant) → **47 tests passants**. Build ✓, pages client vérifiées (preview, 0 erreur console).
- **2026-06-17** — Audit complet + tests (backend 13/13 ✓, build ✓). Corrigé : config ESLint (382→49 issues), rôle défaut `client` (inscription + Google), limiteur brute-force auth (20/15min). Création de cette fiche.
- **2026-06-17** *(plus tôt)* — Refonte UI client : `ClientLayout` (onglets), refonte `ExplorePage`/`PublicShopPage`/`PublicProductPage`/`ClientOrdersPage`/`ClientClaimsPage`, amélioration `CheckoutPage`, footer enrichi. Commit `014176b` poussé.
- **Antérieur** — Marketplace client-facing complète (explore, boutiques, produits, wishlist, commandes, réclamations), backend browse/wishlist/claims/settings, déploiement Vercel + Neon.

---

## 9. Comment travailler sur ce projet (rappel process)

1. **Lire cette fiche** + `git log` récent.
2. Pour vérifier l'UI : serveur preview + `preview_snapshot` (pas screenshot).
3. Backend local sur Docker Postgres ; ne pas pointer vers Neon en dev sans raison.
4. Après changement : `npm test` (backend), `npm run lint` + `npm run build` (frontend).
5. **Mettre à jour la section 6 (points faibles), 7 (roadmap) et 8 (changelog) avant de finir.**
6. Commit/push uniquement si l'utilisateur le demande.
