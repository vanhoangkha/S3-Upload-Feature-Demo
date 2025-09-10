# Document Management System - Build & Deployment Automation
.PHONY: help setup clean build test deploy status logs

# Default environment
ENV ?= dev

# Colors for output
BLUE := \033[34m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)Document Management System - Available Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

# Setup & Installation
setup: ## Setup development environment
	@echo "$(BLUE)Setting up development environment...$(NC)"
	./scripts/setup-env.sh

install: ## Install all dependencies
	@echo "$(BLUE)Installing dependencies...$(NC)"
	npm install
	cd api && npm install
	cd web && npm install

# Build Commands
build: ## Build all components
	@echo "$(BLUE)Building all components...$(NC)"
	npm run build

build-api: ## Build API only
	@echo "$(BLUE)Building API...$(NC)"
	cd api && npm run build

build-web: ## Build web frontend only
	@echo "$(BLUE)Building web frontend...$(NC)"
	cd web && npm run build

# Test Commands
test: ## Run all tests
	@echo "$(BLUE)Running all tests...$(NC)"
	npm run test

test-api: ## Run API tests only
	@echo "$(BLUE)Running API tests...$(NC)"
	cd api && npm test

test-web: ## Run web tests only
	@echo "$(BLUE)Running web tests...$(NC)"
	cd web && npm test

# Development Commands
dev: ## Start development servers (parallel)
	@echo "$(BLUE)Starting development servers...$(NC)"
	npm run dev

dev-api: ## Start API development server
	@echo "$(BLUE)Starting API development server...$(NC)"
	cd api && npm run dev

dev-web: ## Start web development server
	@echo "$(BLUE)Starting web development server...$(NC)"
	cd web && npm run dev

# Infrastructure Commands
infra-init: ## Initialize Terraform
	@echo "$(BLUE)Initializing Terraform for $(ENV)...$(NC)"
	cd infra/envs/$(ENV) && terraform init

infra-plan: ## Plan infrastructure changes
	@echo "$(BLUE)Planning infrastructure changes for $(ENV)...$(NC)"
	cd infra/envs/$(ENV) && terraform plan

infra-apply: ## Apply infrastructure changes
	@echo "$(BLUE)Applying infrastructure changes for $(ENV)...$(NC)"
	cd infra/envs/$(ENV) && terraform apply

infra-destroy: ## Destroy infrastructure
	@echo "$(RED)Destroying infrastructure for $(ENV)...$(NC)"
	cd infra/envs/$(ENV) && terraform destroy

infra-output: ## Show infrastructure outputs
	@echo "$(BLUE)Infrastructure outputs for $(ENV):$(NC)"
	cd infra/envs/$(ENV) && terraform output

# Deployment Commands
deploy: ## Deploy everything to specified environment
	@echo "$(BLUE)Deploying to $(ENV)...$(NC)"
	./scripts/deploy.sh $(ENV)

deploy-infra: ## Deploy infrastructure only
	@echo "$(BLUE)Deploying infrastructure to $(ENV)...$(NC)"
	$(MAKE) infra-apply ENV=$(ENV)

deploy-api: ## Deploy API only
	@echo "$(BLUE)Deploying API to $(ENV)...$(NC)"
	cd api && npm run deploy:$(ENV)

deploy-web: ## Deploy web frontend only
	@echo "$(BLUE)Deploying web to $(ENV)...$(NC)"
	cd web && npm run deploy:$(ENV)

# Environment-specific shortcuts
deploy-dev: ## Deploy to development
	$(MAKE) deploy ENV=dev

deploy-stg: ## Deploy to staging
	$(MAKE) deploy ENV=stg

deploy-prod: ## Deploy to production
	$(MAKE) deploy ENV=prod

# Monitoring & Logs
logs-api: ## Tail API logs
	@echo "$(BLUE)Tailing API logs for $(ENV)...$(NC)"
	aws logs tail /aws/lambda/dms-$(ENV) --follow

status: ## Check deployment status
	@echo "$(BLUE)Checking deployment status for $(ENV)...$(NC)"
	cd infra/envs/$(ENV) && terraform output

# Cleanup Commands
clean: ## Clean build artifacts
	@echo "$(BLUE)Cleaning build artifacts...$(NC)"
	rm -rf api/dist web/build
	cd api && npm run clean || true
	cd web && npm run clean || true

clean-deps: ## Clean dependencies
	@echo "$(BLUE)Cleaning dependencies...$(NC)"
	rm -rf node_modules api/node_modules web/node_modules

# Security & Compliance
security-scan: ## Run security scans
	@echo "$(BLUE)Running security scans...$(NC)"
	cd api && npm audit
	cd web && npm audit

# Documentation
docs: ## Generate documentation
	@echo "$(BLUE)Generating documentation...$(NC)"
	@echo "Documentation available in docs/ directory"

# Utility Commands
create-env: ## Create new environment (usage: make create-env ENV=staging)
	@echo "$(BLUE)Creating new environment: $(ENV)$(NC)"
	mkdir -p infra/envs/$(ENV)
	cp infra/envs/dev/* infra/envs/$(ENV)/
	@echo "$(GREEN)Environment $(ENV) created. Update variables in infra/envs/$(ENV)/$(NC)"

# Docker Commands (for local development)
docker-build: ## Build Docker images
	@echo "$(BLUE)Building Docker images...$(NC)"
	cd api && docker build -t dms-api .

docker-up: ## Start Docker Compose services
	@echo "$(BLUE)Starting Docker Compose services...$(NC)"
	docker-compose up -d

docker-down: ## Stop Docker Compose services
	@echo "$(BLUE)Stopping Docker Compose services...$(NC)"
	docker-compose down

# Default target
.DEFAULT_GOAL := help
