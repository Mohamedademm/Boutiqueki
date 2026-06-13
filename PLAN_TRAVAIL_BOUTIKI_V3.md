# Plan de travail Boutiki v3

## 1. Synthèse du cahier des charges

Boutiki v3 cible une plateforme SaaS multi-boutiques pour commerçants, avec un MVP centré sur deux modules critiques :

- Gestion produits : CRUD complet, catégories, images, variantes, statuts, recherche et filtres.
- Gestion stock : quantités par variante, seuils d'alerte, mouvements, historique, export inventaire.

La cible technique du cahier des charges est :

- Backend : Node.js, Express, PostgreSQL, `pg`, Zod, JWT + refresh token.
- Frontend cible : Next.js 14, Tailwind CSS, Shadcn/ui, TanStack Query, Zustand.
- Déploiement : Vercel pour le frontend, Railway pour l'API, Neon.tech pour PostgreSQL.

## 2. État réel du projet

### Backend

Le backend est déjà proche de la cible MVP :

- Architecture modulaire présente : `auth`, `users`, `shops`, `categories`, `products`, `stock`.
- Package partagé `@boutiki/utils` présent pour DB, config et réponses.
- Migrations PostgreSQL présentes pour users, shops, categories, products, variants et stock movements.
- Auth JWT + refresh token implémentée.
- Produits, catégories et stock ont déjà des routes principales.

Écarts ou risques à traiter :

- Les réponses auth sont enveloppées dans `data`, alors que le frontend lit encore `res.data.token`.
- Certains messages et commentaires sont encodés incorrectement dans plusieurs fichiers.
- Les rôles du CDC v3 (`superadmin`, `owner`, `customer`) ne sont pas encore alignés avec le code (`admin`, `owner`, `client`).
- Les exports stock CSV/PDF et l'endpoint de seuil d'alerte ne sont pas encore complets.
- Pas encore de tests API Jest/Supertest.
- Pas encore de documentation OpenAPI.

### Frontend

Le frontend actuel est une SPA Vite/React, pas encore Next.js 14.

Points positifs :

- React Router, Tailwind, Zustand et TanStack Query sont déjà installés.
- Hooks propres existants : `useShop`, `useProducts`, `useStock`.
- Pages owner présentes : onboarding, dashboard, produits, formulaire, builder.

Écarts bloquants :

- Anciennes routes appelées dans plusieurs pages : `/shops/my-shop`, `/products/:id`.
- Anciens champs MongoDB utilisés : `_id`, `comparePrice`, `stock`, `category`.
- Le formulaire d'inscription envoie `passwordHash` au lieu de `password`.
- Le frontend ne lit pas correctement la réponse auth actuelle.
- Le dashboard appelle des endpoints analytics/orders qui sont hors MVP ou absents.
- Aucune page stock dashboard n'est branchée dans la navigation.

## 3. Priorité produit

### MVP fonctionnel à terminer en premier

1. Inscription, connexion, refresh token, logout.
2. Onboarding owner avec création de boutique.
3. Liste produits avec recherche, statut, stock calculé depuis les variantes.
4. Création et modification produit avec prix, SKU, statut, catégorie, images URL, variantes et seuils stock.
5. Page stock avec alertes, mouvement entrée/sortie/ajustement et historique.
6. Dashboard simple basé sur les données MVP disponibles, sans dépendre d'analytics post-MVP.

### Post-MVP à garder hors du premier chantier

- Paiement en ligne, Stripe/PayPal.
- Tunnel commande complet.
- Analytics avancées.
- Marketplace multi-boutiques.
- Application mobile.
- Plans SaaS et facturation.

## 4. Plan d'exécution recommandé

### Phase 1 - Stabilisation MVP actuel

- Corriger le store auth et l'intercepteur axios.
- Corriger RegisterPage pour envoyer `password`.
- Corriger OnboardingPage pour envoyer un `slug` valide et utiliser `/shops`.
- Corriger ProductsPage pour utiliser `useShop` et `useProducts`.
- Corriger ProductFormPage pour utiliser `/shops/:shopId/products`.
- Ajouter la route `/dashboard/stock` et une page stock MVP.
- Remplacer les dépendances à `_id` par `id` dans les pages MVP.

### Phase 2 - Qualité backend

- Ajouter pagination aux produits.
- Ajouter export stock CSV.
- Ajouter endpoint de mise à jour `alert_threshold`.
- Ajouter logs d'audit minimum pour auth, produit et stock.
- Ajouter tests API auth, shops, products, stock.
- Ajouter seed de développement pour tester rapidement.

### Phase 3 - UX professionnelle

- Revoir le dashboard owner pour afficher seulement les KPIs disponibles.
- Ajouter filtres produits : recherche, statut, catégorie.
- Ajouter états vides, états erreur, loaders et confirmations.
- Améliorer responsive mobile/tablette.
- Harmoniser les libellés en français.

### Phase 4 - Migration Next.js 14

- Décider si la migration Next.js est faite avant ou après validation MVP.
- Créer `frontend-next` ou migrer `frontend` avec sauvegarde de la SPA actuelle.
- Recréer App Router : auth, dashboard, products, stock, public shop.
- Réutiliser les hooks, stores et composants métier corrigés.
- Ajouter SSR/ISR pour vitrine publique et pages produit.

### Phase 5 - Déploiement et production

- Ajouter `.env.example` backend/frontend.
- Configurer Railway API avec healthcheck.
- Configurer Vercel frontend.
- Configurer Neon production et migrations.
- Ajouter GitHub Actions : lint, tests backend, build frontend.
- Smoke test production : register, login, create shop, create product, stock movement.

## 5. Travail commencé dans cette session

Objectif immédiat : rendre le MVP owner utilisable sur la stack actuelle avant les gros chantiers.

- Corriger les contrats auth frontend.
- Corriger l'inscription.
- Corriger onboarding boutique.
- Corriger liste et formulaire produits.
- Brancher le module stock dans le dashboard.
- Vérifier avec `npm run build` côté frontend et au minimum chargement syntaxique backend.

