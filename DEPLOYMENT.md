# Déploiement BoutiqueKi

Architecture : **Frontend → Vercel** · **Backend → Railway/Render** · **DB → Neon (Postgres)**.
(Vercel est serverless : il convient au frontend React, pas au serveur Express persistant.)

---

## 1. Frontend (Vercel) — ✅ déjà déployé

- Projet : `mohamed-adems-projects/frontend`
- URL live : https://frontend-chi-ten-7b71qfhst5.vercel.app
- Re-déployer manuellement : depuis `frontend/` → `vercel --prod`

### Activer le déploiement automatique à chaque `git push`
Dashboard Vercel → projet **frontend** → **Settings** :
1. **Git** → *Connect Git Repository* → choisir `Mohamedademm/Boutiqueki`.
2. **Build & Development → Root Directory** → mettre **`frontend`** (le repo est un monorepo).
3. **Environment Variables** (Production) :
   - `VITE_GOOGLE_CLIENT_ID` = `105626979178-...apps.googleusercontent.com`
   - `VITE_API_URL` = `https://<ton-backend>.up.railway.app/api` (après l'étape 2)
→ Désormais chaque push sur `main` redéploie automatiquement.

### Rendre le site public (si 401)
Settings → **Deployment Protection** → désactiver *Vercel Authentication* pour la Production.

---

## 2. Backend (Railway — recommandé)

1. https://railway.app → *New Project* → *Deploy from GitHub repo* → `Mohamedademm/Boutiqueki`.
2. **Root Directory** = `backend`. Start command auto : `npm start`.
3. **Variables** (onglet Variables) :
   ```
   DATABASE_URL=<ta chaîne Neon>
   DATABASE_SSL=true
   NODE_ENV=production
   JWT_SECRET=<secret long>
   JWT_REFRESH_SECRET=<autre secret long>
   CLIENT_URL=https://frontend-chi-ten-7b71qfhst5.vercel.app
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   # optionnels : RESEND_API_KEY, STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET
   ```
4. Après le 1er déploiement, lancer les migrations une fois : Railway → *Shell* → `npm run migrate`.
5. Copier l'URL publique du backend → la mettre dans `VITE_API_URL` sur Vercel → redeploy frontend.

> **Uploads d'images** : le disque Railway est éphémère. Pour des images persistantes en prod,
> brancher Cloudinary/S3 dans `backend/src/modules/uploads` (le contrat `{ url }` reste identique).

---

## 3. Checklist post-déploiement
- [ ] `CLIENT_URL` (backend) = URL exacte du frontend (pour CORS + cookies cross-site).
- [ ] `VITE_API_URL` (frontend) = URL backend + `/api`.
- [ ] Migrations appliquées (`npm run migrate`).
- [ ] Origine autorisée dans Google Cloud Console (OAuth) = URL du frontend.
- [ ] (Stripe) webhook pointant vers `https://<backend>/api/payments/webhook`.
