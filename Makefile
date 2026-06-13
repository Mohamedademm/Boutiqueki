# =============================================
# BoutiqueKi — Makefile
# Commandes simplifiées pour Docker
# =============================================

.PHONY: help dev prod build down logs clean ps

# Couleurs
GREEN  := \033[0;32m
YELLOW := \033[0;33m
CYAN   := \033[0;36m
RESET  := \033[0m

help: ## Afficher l'aide
	@echo ""
	@echo "$(CYAN)🛍️  BoutiqueKi — Commandes Docker$(RESET)"
	@echo "======================================"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)  %-12s$(RESET) %s\n", $$1, $$2}'
	@echo ""

dev: ## Démarrer en mode développement (hot-reload)
	@echo "$(CYAN)🚀 Démarrage en mode développement...$(RESET)"
	docker compose -f docker-compose.dev.yml up --build

dev-d: ## Démarrer en mode développement (background)
	@echo "$(CYAN)🚀 Démarrage en mode développement (background)...$(RESET)"
	docker compose -f docker-compose.dev.yml up --build -d

prod: ## Démarrer en mode production
	@echo "$(CYAN)🚀 Démarrage en mode production...$(RESET)"
	docker compose up --build -d

build: ## Reconstruire les images Docker
	@echo "$(YELLOW)🔨 Construction des images...$(RESET)"
	docker compose build --no-cache

down: ## Arrêter et supprimer les containers
	@echo "$(YELLOW)🛑 Arrêt des containers...$(RESET)"
	docker compose down
	docker compose -f docker-compose.dev.yml down

logs: ## Voir les logs en temps réel
	docker compose logs -f

logs-backend: ## Voir les logs du backend uniquement
	docker compose logs -f backend

logs-frontend: ## Voir les logs du frontend uniquement
	docker compose logs -f frontend

ps: ## Voir l'état des containers
	docker compose ps

clean: ## Nettoyer containers, images et volumes
	@echo "$(YELLOW)🧹 Nettoyage complet...$(RESET)"
	docker compose down --rmi all --volumes --remove-orphans
	docker compose -f docker-compose.dev.yml down --rmi all --volumes --remove-orphans

shell-backend: ## Ouvrir un shell dans le container backend
	docker exec -it boutiqueki-backend sh

shell-frontend: ## Ouvrir un shell dans le container frontend
	docker exec -it boutiqueki-frontend sh
