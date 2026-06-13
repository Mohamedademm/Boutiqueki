# =============================================
# BoutiqueKi Frontend — Dockerfile
# =============================================

# ---- Étape 1: Build ----
FROM node:20-alpine AS builder
WORKDIR /app

# Copier les manifestes de dépendances
COPY package.json package-lock.json ./
RUN npm ci

# Copier le code source et builder
COPY . .

# La variable VITE_API_URL est injectée au moment du build
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ---- Étape 2: Serveur Nginx ----
FROM nginx:1.27-alpine AS runner

# Copier le build Vite
COPY --from=builder /app/dist /usr/share/nginx/html

# Copier la config Nginx custom (gestion des routes React SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]
