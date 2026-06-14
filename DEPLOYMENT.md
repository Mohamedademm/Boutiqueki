# Déploiement BoutiqueKi (Vercel)

Tout est déployé sur **Vercel** (2 projets) avec la base **Neon (Postgres)**.

| Élément | Projet Vercel | URL |
|---|---|---|
| Frontend (React/Vite) | `boutiqueki` / `frontend` | https://frontend-chi-ten-7b71qfhst5.vercel.app |
| Backend (Express, serverless) | `boutiqueki-backend` | https://boutiqueki-backend.vercel.app |

Le frontend appelle le backend via la variable **`VITE_API_URL`** = `https://boutiqueki-backend.vercel.app/api`.
Le backend autorise le frontend via **`CLIENT_URL`** (CORS).

---

## Variables d'environnement (déjà configurées sur Vercel)

**Backend** (`boutiqueki-backend` → Settings → Environment Variables) :
`DATABASE_URL`, `DATABASE_SSL=true`, `NODE_ENV=production`, `JWT_SECRET`, `JWT_REFRESH_SECRET`,
`CLIENT_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
(optionnels : `RESEND_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`)

**Frontend** : `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`

---

## ⚠️ Étape à faire par toi : Google OAuth

Le bouton « Se connecter avec Google » échoue tant que l'URL Vercel n'est pas autorisée.
Dans **Google Cloud Console → APIs & Services → Identifiants → ton OAuth Client** :
- **Origines JavaScript autorisées** → ajouter `https://frontend-chi-ten-7b71qfhst5.vercel.app`
- **URI de redirection autorisés** → ajouter la même URL
(La connexion classique email/mot de passe, elle, fonctionne déjà.)

## ⚠️ Uploads d'images
Vercel est serverless (système de fichiers non persistant) : les images uploadées ne sont pas
conservées. Pour la prod, brancher **Cloudinary/S3** dans `backend/src/modules/uploads`
(le contrat `{ url }` reste identique), ou héberger le backend sur **Render** (disque persistant).

---

## Re-déployer
- Frontend : `cd frontend && vercel --prod`
- Backend  : `cd backend && vercel --prod`
- Déploiement auto sur `git push` : connecter le repo dans chaque projet Vercel
  (Settings → Git) et définir **Root Directory** = `frontend` / `backend` respectivement.

## Migrations
Le schéma est déjà appliqué sur Neon. Pour de futures migrations : `cd backend && npm run migrate`.
