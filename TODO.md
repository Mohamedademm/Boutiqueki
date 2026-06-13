# 🏗️ Plan de Travail — Mise à Jour BoutiqueKi vers CDC v2.0

> **Basé sur :** `Boutiki_CahierDesCharges_v2.docx` — Mai 2026  
> **Statut actuel :** MVP partiel, stack MongoDB → **Migration requise vers PostgreSQL**

---

## 📊 Analyse des Écarts — État Actuel vs CDC v2.0

### 🔴 Changements Majeurs (Breaking Changes)

| Domaine | État Actuel (v1) | CDC v2.0 (Cible) | Impact |
|---------|-----------------|------------------|--------|
| **Base de données** | MongoDB + Mongoose | PostgreSQL (Neon.tech) + raw SQL (`pg`) | 🔴 CRITIQUE — Refonte totale |
| **Backend architecture** | MVC classique (`controllers/routes/models`) | Architecture modulaire par domaine (`modules/auth`, `modules/products`…) | 🔴 CRITIQUE — Restructuration |
| **ORM/Driver** | Mongoose | `pg` (raw SQL, pas d'ORM) | 🔴 CRITIQUE |
| **Frontend framework** | React + Vite (SPA) | Next.js 14 (SSR/SSG) | 🔴 CRITIQUE — Reconception |
| **Auth** | JWT simple (sans refresh token) | JWT + Refresh Token (httpOnly cookie) | 🟠 Majeur |
| **Validation** | Non formalisée | Zod (schémas par module) | 🟠 Majeur |
| **Périmètre MVP** | Trop large (checkout, stripe, analytics…) | Recentré sur **Produits + Stock uniquement** | 🟡 Scope |

### 🟢 Ce qui est Compatible / Réutilisable

| Élément | Réutilisation |
|---------|--------------|
| Rate limiting (`express-rate-limit`) | ✅ Garder tel quel |
| Helmet.js | ✅ Garder tel quel |
| CORS, Cookie-Parser | ✅ Garder |
| Structure globale `backend/` et `frontend/` | ✅ Noms de dossiers déjà corrects |
| Logique métier produits/shop (à adapter) | 🔄 Adapter en SQL |
| JWT middleware | 🔄 Étendre avec refresh token |

---

## 🗓️ Plan de Travail — 8 Semaines

---

### ⚡ SEMAINE 1 — Setup & Infrastructure PostgreSQL

**Objectif :** Remplacer MongoDB par PostgreSQL, mettre en place `boutiki-utils`, migrations SQL.

#### Tâches Backend :
- [x] **S1.1** Créer le package `boutiki-utils/` à la racine du projet
  - `src/db.js` — Pool `pg` singleton (`getConnection()`)
  - `src/response.js` — `createSuccessResponse`, `createErrorResponse`
  - `src/config.js` — Lecture et validation des variables d'env
  - `package.json` avec `name: "@boutiki/utils"`
- [x] **S1.2** Installer les nouvelles dépendances backend
  - Ajouter : `pg`, `node-pg-migrate`, `zod`
  - Supprimer : `mongoose`, `express-mongo-sanitize`
  - Référencer `"@boutiki/utils": "file:../boutiki-utils"` dans `backend/package.json`
- [x] **S1.3** Créer le dossier `backend/migrations/` avec les fichiers SQL :
  - `001_create_users.sql`
  - `002_create_shops.sql`
  - `003_create_categories.sql`
  - `004_create_products.sql`
  - `005_create_stock_movements.sql`
- [x] **S1.4** Configurer `.env` avec `DATABASE_URL` (Neon.tech) au lieu de `MONGO_URI`
- [x] **S1.5** Exécuter les migrations — vérifier la création des tables sur Neon.tech
- [x] **S1.6** Restructurer `backend/src/` : supprimer `config/db.js` (Mongoose), remplacer par le pool `boutiki-utils`

**Livrables S1 :** Base PostgreSQL opérationnelle, migrations executées, `boutiki-utils` fonctionnel.

---

### ⚡ SEMAINE 2 — Module Auth (JWT + Refresh Token)

**Objectif :** Remplacer l'auth actuelle par JWT stateless avec refresh token httpOnly.

#### Tâches Backend :
- [x] **S2.1** Créer `backend/src/modules/auth/schema.js`
  - `RegisterSchema` (Zod) : `email`, `password`, `name`, `role`
  - `LoginSchema` (Zod) : `email`, `password`
- [x] **S2.2** Créer `backend/src/modules/auth/index.js` avec les routes :
  - `POST /api/auth/register` — Hash bcrypt (rounds=12), insert SQL users
  - `POST /api/auth/login` — Verify password, émettre access token (15min) + refresh token (7j, httpOnly cookie)
  - `POST /api/auth/refresh` — Valider refresh token, émettre nouvel access token
  - `POST /api/auth/logout` — Invalider le refresh token (clear cookie)
- [x] **S2.3** Mettre à jour `backend/src/middleware/auth.js`
  - Vérifier le JWT access token sur toutes les routes protégées
  - Attacher `req.user` avec `{ id, email, role }`
- [x] **S2.4** Créer `backend/src/middleware/validate.js`
  - Middleware générique Zod — parse `req.body` avec le schéma du module, retourne 400 si invalide
- [x] **S2.5** Refactoriser `backend/src/app.js` (Express setup propre, modules pluggables)

**Livrables S2 :** Auth complète testable via Postman/Thunder Client.

---

### ⚡ SEMAINE 3 — Modules Shops & Users

**Objectif :** CRUD boutique et profil propriétaire avec PostgreSQL.

#### Tâches Backend :
- [x] **S3.1** Créer `backend/src/modules/shops/schema.js`
  - `CreateShopSchema` : `name`, `slug`, `description`, `logo_url`, `banner_url`
  - `UpdateShopSchema` : tous les champs optionnels
- [x] **S3.2** Créer `backend/src/modules/shops/index.js` avec les routes :
  - `POST /api/shops` — Créer boutique (owner uniquement)
  - `GET /api/shops/me` — Ma boutique
  - `PUT /api/shops/:shopId` — Modifier boutique (ownership check)
  - `GET /api/shops/:shopId` — Détail boutique
- [x] **S3.3** Créer `backend/src/modules/users/schema.js` + `index.js`
  - `GET /api/users/me` — Profil utilisateur
  - `PUT /api/users/me` — Mettre à jour profil
- [x] **S3.4** Middleware RBAC : vérifier `req.user.role` (admin, owner, client)

**Livrables S3 :** Gestion boutique et profil fonctionnels.

---

### ⚡ SEMAINE 4 — Module Products (Core MVP)

**Objectif :** CRUD complet produits avec variantes, catégories, validation Zod.

#### Tâches Backend :
- [x] **S4.1** Créer `backend/src/modules/categories/schema.js` + `index.js`
  - `POST/GET/PUT/DELETE /api/shops/:shopId/categories`
  - Support sous-catégories (max 2 niveaux, `parent_id`)
- [x] **S4.2** Créer `backend/src/modules/products/schema.js`
  - `ProductSchema` : `name`, `description`, `price`, `compare_price`, `sku`, `status` (actif/brouillon/archivé), `category_id`, `images[]`, `variants[]`
  - `VariantSchema` : `name`, `sku`, `price`, `stock_qty`
- [x] **S4.3** Créer `backend/src/modules/products/index.js` avec les routes :
  - `GET /api/shops/:shopId/products` — Lister (filtres : catégorie, statut, search)
  - `GET /api/shops/:shopId/products/:id` — Détail + variantes
  - `POST /api/shops/:shopId/products` — Créer produit
  - `PUT /api/shops/:shopId/products/:id` — Modifier
  - `DELETE /api/shops/:shopId/products/:id` — Archiver (soft delete)
- [x] **S4.4** Ownership check : un owner ne peut accéder qu'à ses propres produits

**Livrables S4 :** API Produits complète, testée, documentée (collection Postman).

---

### ⚡ SEMAINE 5 — Module Stock (Core MVP)

**Objectif :** Suivi stock temps réel, alertes, historique des mouvements.

#### Tâches Backend :
- [x] **S5.1** Créer `backend/src/modules/stock/schema.js`
  - `StockMovementSchema` : `product_id`, `variant_id`, `type` (entrée/sortie/ajustement), `quantity`, `reason`
- [x] **S5.2** Créer `backend/src/modules/stock/index.js` avec les routes :
  - `GET /api/shops/:shopId/stock` — Vue stock tous produits (avec variantes)
  - `GET /api/shops/:shopId/stock/alerts` — Produits sous le seuil d'alerte
  - `POST /api/shops/:shopId/stock/movement` — Enregistrer mouvement (CHECK constraint: stock_qty >= 0)
  - `GET /api/shops/:shopId/stock/:productId/history` — Historique mouvements
- [x] **S5.3** Logique d'alerte stock bas (seuil configurable par produit)
- [x] **S5.4** Export CSV/PDF du stock (endpoint `GET /api/shops/:shopId/stock/export`)

**Livrables S5 :** Module stock complet, contraintes d'intégrité DB actives.

---

### ⚡ SEMAINE 6 — Migration Frontend vers Next.js 14

**Objectif :** Remplacer Vite/React SPA par Next.js 14 avec App Router.

> [!WARNING]
> L'actuel `frontend/` (Vite + React) sera **remplacé** par Next.js 14. Sauvegarder la logique des composants existants avant de commencer.

#### Tâches Frontend :
- [x] **S6.1** Sauvegarder/noter la logique des pages existantes (LoginPage, RegisterPage, ProductsPage, ProductFormPage, DashboardPage)
- [x] **S6.2** Initialiser Next.js 14 dans `frontend/` :
  - `npx create-next-app@14 ./ --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
  - Installer Shadcn/ui : `npx shadcn-ui@latest init`
  - Installer : `axios`, `@tanstack/react-query`, `zustand`, `zod`
- [x] **S6.3** Créer la structure `frontend/src/app/` :
  - `(auth)/login/page.tsx` — Page connexion (SSR disabled, `'use client'`)
  - `(auth)/register/page.tsx` — Page inscription
  - `(dashboard)/layout.tsx` — Layout dashboard owner
  - `(dashboard)/products/page.tsx` — Liste produits
  - `(dashboard)/products/new/page.tsx` — Formulaire nouveau produit
  - `(dashboard)/stock/page.tsx` — Vue stock
- [x] **S6.4** Configurer `lib/axios.ts` — instance axios avec baseURL de l'API
- [x] **S6.5** Configurer `store/authStore.ts` — Zustand pour l'état auth

**Livrables S6 :** Next.js opérationnel, auth pages fonctionnelles.

---

### ⚡ SEMAINE 7 — UI Produits & Stock (Frontend)

**Objectif :** Interfaces complètes pour la gestion des produits et du stock.

#### Tâches Frontend :
- [x] **S7.1** `features/products/` — Hooks TanStack Query :
  - `useProducts(shopId)` — GET liste produits
  - `useProduct(shopId, id)` — GET détail
  - `useCreateProduct()`, `useUpdateProduct()`, `useDeleteProduct()` — mutations
- [ ] **S7.2** Page liste produits (`products/page.tsx`) :
  - Table Shadcn avec filtres (catégorie, statut, recherche)
  - Badge statut (Actif / Brouillon / Archivé)
  - Actions (éditer, archiver, voir stock)
- [ ] **S7.3** Formulaire produit (`products/new/page.tsx` et `products/[id]/page.tsx`) :
  - Champs : nom, description, prix, prix barré, SKU, catégorie, statut
  - Upload images (drag & drop, jusqu'à 8 images) — intégration Cloudinary
  - Section variantes (taille, couleur, stock par variante)
  - Validation Zod côté client
- [ ] **S7.4** Page stock (`stock/page.tsx`) :
  - Vue tableau : produit, variante, stock actuel, seuil d'alerte, statut
  - Alertes stock bas (badge rouge, filtre rapide)
  - Modal "Enregistrer un mouvement" (entrée/sortie/ajustement + raison)
  - Timeline historique des mouvements par produit
- [ ] **S7.5** Composants partagés :
  - `Navbar`, `Sidebar` (liens : Dashboard, Produits, Stock, Boutique)
  - `AlertBadge` pour les notifications stock bas

**Livrables S7 :** Dashboard owner complet et fonctionnel.

---

### ⚡ SEMAINE 8 — Tests & Déploiement

**Objectif :** Valider et déployer.

#### Tâches Tests :
- [ ] **S8.1** Tests API Backend (Jest + Supertest) :
  - Auth : register, login, refresh, logout
  - Products : CRUD, ownership check, validation
  - Stock : mouvements, alertes, contrainte stock négatif
- [ ] **S8.2** Tests Frontend (optionnel pour MVP) : smoke tests composants critiques

#### Tâches Déploiement :
- [ ] **S8.3** Déploiement Backend sur **Railway** :
  - Variables d'env : `DATABASE_URL` (Neon.tech), `JWT_SECRET`, `JWT_REFRESH_SECRET`
  - Configurer le script de migration automatique au démarrage
- [ ] **S8.4** Déploiement Frontend sur **Vercel** :
  - Variable d'env : `NEXT_PUBLIC_API_URL` pointant vers Railway
  - Vérifier SSR/SSG fonctionnel en production
- [ ] **S8.5** Exécuter les migrations SQL sur Neon.tech (production)
- [ ] **S8.6** Tests de smoke production (register → login → créer produit → ajuster stock)

---

## 🏗️ Nouvelle Architecture Cible

```
boutiqueki/
├── boutiki-utils/          ← NOUVEAU — Package partagé
│   ├── package.json        (name: "@boutiki/utils")
│   └── src/
│       ├── index.js        (exports)
│       ├── db.js           (pg Pool singleton)
│       ├── response.js     (helpers réponses)
│       └── config.js       (validation env vars)
│
├── backend/                ← REFACTORISÉ (PostgreSQL + modules)
│   ├── .env                (DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET)
│   ├── migrations/         ← NOUVEAU
│   │   ├── 001_create_users.sql
│   │   ├── 002_create_shops.sql
│   │   ├── 003_create_categories.sql
│   │   ├── 004_create_products.sql
│   │   └── 005_create_stock_movements.sql
│   └── src/
│       ├── app.js          ← NOUVEAU (Express setup)
│       ├── index.js        (démarrage serveur)
│       ├── middleware/
│       │   ├── auth.js     (vérif JWT)
│       │   ├── validate.js ← NOUVEAU (middleware Zod)
│       │   └── error.js
│       └── modules/        ← NOUVEAU (architecture modulaire)
│           ├── auth/       (schema.js + index.js)
│           ├── users/      (schema.js + index.js)
│           ├── shops/      (schema.js + index.js)
│           ├── products/   (schema.js + index.js)
│           ├── categories/ (schema.js + index.js)
│           └── stock/      (schema.js + index.js)
│
├── frontend/               ← REMPLACÉ (Next.js 14)
│   ├── src/
│   │   ├── app/            (App Router Next.js)
│   │   ├── components/
│   │   │   ├── ui/         (Shadcn/ui)
│   │   │   └── shared/     (Navbar, Sidebar…)
│   │   ├── features/       (products/, stock/)
│   │   ├── hooks/
│   │   ├── lib/            (axios.ts, utils)
│   │   └── store/          (authStore.ts)
│   ├── .env.local
│   └── next.config.js
│
└── README.md
```

---

## 📦 Dépendances à Changer

### Backend — Supprimer
```bash
npm uninstall mongoose express-mongo-sanitize socket.io stripe
```

### Backend — Ajouter
```bash
npm install pg node-pg-migrate zod
npm install --save-dev jest supertest
```

### Frontend — Supprimer (tout Vite/React actuel)
Remplacer par Next.js 14 (voir S6.2)

### Frontend — Ajouter (Next.js)
```bash
npm install @tanstack/react-query axios zustand zod
npx shadcn-ui@latest init
```

---

## 🗄️ Schéma SQL — Tables à Créer

```sql
-- 001_create_users.sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'owner' CHECK (role IN ('admin', 'owner', 'client')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 002_create_shops.sql
CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'suspended')),
  plan VARCHAR(20) DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 003_create_categories.sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES categories(id),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 004_create_products.sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  compare_price DECIMAL(10,2),
  sku VARCHAR(100),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('active', 'draft', 'archived')),
  images JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  price DECIMAL(10,2),
  stock_qty INTEGER NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  alert_threshold INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 005_create_stock_movements.sql
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  type VARCHAR(20) NOT NULL CHECK (type IN ('in', 'out', 'adjustment')),
  quantity INTEGER NOT NULL,
  reason TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## ⚠️ Points Critiques & Décisions

> [!CAUTION]
> **Migration MongoDB → PostgreSQL** : Toutes les données existantes seront perdues. Si des données de test existent, les exporter avant de commencer la migration.

> [!IMPORTANT]
> **Scope MVP v2.0** : Le CDC v2 recentre le MVP sur **Produits + Stock uniquement**. Les fonctionnalités suivantes sont **hors MVP v2** (à remettre en Phase Post-MVP) :
> - Stripe / paiement
> - Vitrine publique (SSR Next.js)
> - Socket.io (temps réel)
> - Analytics avancées
> - Admin global dashboard

> [!WARNING]
> **Frontend Next.js** : L'actuel frontend Vite/React sera entièrement remplacé. Récupérer la logique métier (validations, appels API) mais pas les composants JSX.

> [!TIP]
> **Commencer par le backend** (S1-S5) avant de toucher au frontend. L'API stable en premier facilite le développement frontend.

---

## 📈 Priorités d'Exécution

| Priorité | Semaine | Module | Criticité |
|----------|---------|--------|-----------|
| 🔴 1 | S1 | Setup PostgreSQL + boutiki-utils + migrations | BLOQUANT |
| 🔴 2 | S2 | Module Auth (JWT + Refresh) | BLOQUANT |
| 🔴 3 | S3 | Module Shops & Users | BLOQUANT |
| 🔴 4 | S4 | Module Products (Core MVP) | CRITIQUE |
| 🟠 5 | S5 | Module Stock (Core MVP) | CRITIQUE |
| 🟠 6 | S6 | Migration Frontend → Next.js 14 | MAJEUR |
| 🟡 7 | S7 | UI Produits & Stock | IMPORTANT |
| 🟢 8 | S8 | Tests & Déploiement | FINAL |

---

*Document généré le 06/05/2026 — BoutiqueKi v2.0*
