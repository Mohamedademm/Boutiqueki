# 🛍️ BoutiqueKi

Marketplace SaaS multi-boutiques : des **vendeurs** créent leur boutique et leurs produits, des **clients** explorent, commandent et suivent leurs commandes, un **admin** supervise la plateforme.

[![CI](https://github.com/Mohamedademm/Boutiqueki/actions/workflows/ci.yml/badge.svg)](https://github.com/Mohamedademm/Boutiqueki/actions/workflows/ci.yml)

> 📒 La documentation de référence complète (architecture, conventions, feuille de route, journal) vit dans **[docs/PROJECT_FICHE.md](docs/PROJECT_FICHE.md)**.

---

## Stack

| | |
|---|---|
| **Backend** | Node.js · Express 4 · PostgreSQL (`pg`, SQL brut) · Zod · JWT + refresh · Stripe · Jest |
| **Frontend** | React 19 · Vite 8 · Tailwind CSS 3 · Zustand · TanStack Query · React Router 7 · Framer Motion |
| **Base de données** | PostgreSQL — Docker en local, Neon.tech en production |
| **Déploiement** | Vercel (frontend + backend serverless) — voir [DEPLOYMENT.md](DEPLOYMENT.md) |

## Structure

```
boutiqueki/
├── backend/          API Express modulaire (src/modules/<domaine>/)
│   ├── migrations/   Schéma SQL versionné
│   └── tests/        Jest + Supertest
├── frontend/         SPA React + Vite
│   └── src/
│       ├── pages/    Public · Client · Vendeur · Admin
│       ├── components/  store/  hooks/  context/
├── docs/             PROJECT_FICHE.md (référence vivante)
└── .github/workflows/ci.yml
```

## Prérequis

- Node.js 20+
- Docker Desktop (pour PostgreSQL en local) — ou un PostgreSQL accessible

## Démarrage local

```bash
# 1. Base de données (Docker)
docker run --name boutiqueki -e POSTGRES_USER=user -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=boutiki -p 5432:5432 -d postgres:15-alpine

# 2. Backend
cd backend
cp .env.example .env        # puis renseigner JWT_SECRET / JWT_REFRESH_SECRET
npm install
npm run migrate             # applique le schéma SQL
npm run dev                 # http://localhost:3000

# 3. Frontend (autre terminal)
cd frontend
cp .env.example .env        # VITE_API_URL peut rester vide en dev (proxy Vite)
npm install
npm run dev                 # http://localhost:5173
```

En dev, Vite proxifie `/api` et `/uploads` vers `http://localhost:3000` — pas besoin de configurer `VITE_API_URL`.

## Variables d'environnement

Voir `backend/.env.example` et `frontend/.env.example`. Requises côté backend : `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`. Optionnelles : Google OAuth, Resend (email), Stripe (paiement).

## Scripts

| Emplacement | Commande | Effet |
|---|---|---|
| `backend` | `npm run dev` | API en watch (nodemon) |
| `backend` | `npm test` | Tests Jest |
| `backend` | `npm run migrate` | Applique les migrations SQL |
| `frontend` | `npm run dev` | Serveur Vite |
| `frontend` | `npm run lint` | ESLint |
| `frontend` | `npm run build` | Build de production |

## Rôles

`admin` (superutilisateur), `owner` (vendeur), `client` (acheteur, rôle par défaut à l'inscription).

## CI

À chaque push / PR sur `main` : tests backend + lint & build frontend (`.github/workflows/ci.yml`).

## Déploiement

Voir **[DEPLOYMENT.md](DEPLOYMENT.md)** (Vercel + Neon).
