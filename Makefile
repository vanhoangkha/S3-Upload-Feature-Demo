.PHONY: help build test deploy clean setup
.DEFAULT_GOAL := help

ENV ?= dev
REGION := us-east-1
AWS_ACCOUNT_ID := $(shell aws sts get-caller-identity --query Account --output text)

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

setup: ## Setup Terraform backend
	@echo "Setting up Terraform backend..."
	aws s3 mb s3://dms-terraform-state-$(REGION) --region $(REGION) || true
	aws s3api put-bucket-versioning --bucket dms-terraform-state-$(REGION) --versioning-configuration Status=Enabled
	aws dynamodb create-table \
		--table-name dms-terraform-locks \
		--attribute-definitions AttributeName=LockID,AttributeType=S \
		--key-schema AttributeName=LockID,KeyType=HASH \
		--provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
		--region $(REGION) || true

# Infrastructure
infra-init: ## Initialize Terraform backend
	cd infra/envs/$(ENV) && terraform init

infra-plan: ## Plan Terraform changes
	cd infra/envs/$(ENV) && terraform plan -var="env=$(ENV)"

infra-apply: ## Apply Terraform changes
	cd infra/envs/$(ENV) && terraform apply -var="env=$(ENV)" -auto-approve

infra-destroy: ## Destroy Terraform resources
	cd infra/envs/$(ENV) && terraform destroy -var="env=$(ENV)" -auto-approve

infra-output: ## Show Terraform outputs
	cd infra/envs/$(ENV) && terraform output

# API
api-install: ## Install API dependencies
	cd api && npm install

api-build: ## Build API Docker image
	cd api && npm run build
	cd api && docker build -t dms-api:$(ENV) .

api-test: ## Run API tests
	cd api && npm test

api-push: ## Push API image to ECR
	aws ecr get-login-password --region $(REGION) | docker login --username AWS --password-stdin $(AWS_ACCOUNT_ID).dkr.ecr.$(REGION).amazonaws.com
	docker tag dms-api:$(ENV) $(AWS_ACCOUNT_ID).dkr.ecr.$(REGION).amazonaws.com/dms-$(ENV)-api:latest
	docker push $(AWS_ACCOUNT_ID).dkr.ecr.$(REGION).amazonaws.com/dms-$(ENV)-api:latest

api-deploy: api-build api-push ## Deploy API to Lambda
	@echo "Updating Lambda functions..."
	@for func in createDocument getDocument listDocuments updateDocument deleteDocument restoreDocument listVersions presignUpload presignDownload whoAmI adminListUsers adminCreateUser adminUpdateRoles adminSignOut adminAudits getUserDocuments getUserProfile updateUserProfile getVendorDocuments getVendorUsers getVendorStats preTokenGeneration; do \
		aws lambda update-function-code \
			--function-name dms-$(ENV)-$$func \
			--image-uri $(AWS_ACCOUNT_ID).dkr.ecr.$(REGION).amazonaws.com/dms-$(ENV)-api:latest \
			--region $(REGION) || true; \
	done

# Web
web-install: ## Install web dependencies
	cd web && npm install

web-build: ## Build web application
	cd web && npm run build

web-test: ## Run web tests
	cd web && npm test

web-deploy: web-build ## Deploy web to S3 and invalidate CloudFront
	@echo "Getting S3 bucket and CloudFront distribution..."
	$(eval S3_BUCKET := $(shell cd infra/envs/$(ENV) && terraform output -raw web_bucket_name))
	$(eval CF_DIST := $(shell cd infra/envs/$(ENV) && terraform output -raw cloudfront_distribution_id))
	
	@echo "Deploying to S3 bucket: $(S3_BUCKET)"
	aws s3 sync web/dist/ s3://$(S3_BUCKET)/ --delete --region $(REGION)
	
	@echo "Invalidating CloudFront distribution: $(CF_DIST)"
	aws cloudfront create-invalidation --distribution-id $(CF_DIST) --paths "/*" --region $(REGION)

# Full deployment
build: api-build web-build ## Build all components

test: api-test web-test ## Run all tests

deploy: infra-apply api-deploy web-deploy ## Deploy everything

# Development
dev-api: ## Start API in development mode
	cd api && npm run dev

dev-web: ## Start web in development mode
	cd web && npm run dev

dev: ## Start both API and web in development mode
	@echo "Starting development servers..."
	@echo "API will be available at http://localhost:3001"
	@echo "Web will be available at http://localhost:3000"
	@make -j2 dev-api dev-web

# Utilities
clean: ## Clean build artifacts
	cd api && rm -rf node_modules dist
	cd web && rm -rf node_modules dist build

logs-api: ## Tail API Lambda logs
	@echo "Tailing logs for Lambda functions..."
	aws logs tail /aws/lambda/dms-$(ENV)-createDocument --follow --region $(REGION)

logs-web: ## Show CloudFront access logs
	@echo "CloudFront logs are available in S3 bucket (if enabled)"

status: ## Show deployment status
	@echo "=== Infrastructure Status ==="
	cd infra/envs/$(ENV) && terraform output
	@echo ""
	@echo "=== API Status ==="
	aws lambda list-functions --query 'Functions[?starts_with(FunctionName, `dms-$(ENV)-`)].{Name:FunctionName,Runtime:Runtime,LastModified:LastModified}' --output table --region $(REGION)
	@echo ""
	@echo "=== Web Status ==="
	$(eval CF_DOMAIN := $(shell cd infra/envs/$(ENV) && terraform output -raw cloudfront_domain))
	@echo "Web application: https://$(CF_DOMAIN)"

# Environment management
create-env: ## Create new environment (usage: make create-env ENV=staging)
	@if [ ! -d "infra/envs/$(ENV)" ]; then \
		cp -r infra/envs/dev infra/envs/$(ENV); \
		sed -i 's/dev/$(ENV)/g' infra/envs/$(ENV)/terraform.tfvars.example; \
		echo "Created environment: $(ENV)"; \
		echo "Please update infra/envs/$(ENV)/terraform.tfvars with appropriate values"; \
	else \
		echo "Environment $(ENV) already exists"; \
	fi

# 🐳 Local Development with Docker Compose
.PHONY: dev-up dev-down dev-logs dev-setup dev-clean dev-restart

dev-up: ## Start local development environment
	@echo "🚀 Starting local development environment..."
	docker-compose up -d
	@echo "⏳ Waiting for services to be ready..."
	@sleep 10
	@./scripts/setup-local.sh

dev-down: ## Stop local development environment
	@echo "🛑 Stopping local development environment..."
	docker-compose down

dev-logs: ## View logs from all services
	docker-compose logs -f

dev-setup: ## Setup local AWS resources
	@./scripts/setup-local.sh

dev-clean: ## Clean up local development environment
	@echo "🧹 Cleaning up local development environment..."
	docker-compose down -v
	docker system prune -f

dev-restart: dev-down dev-up ## Restart local development environment

# 🚀 Local Development Shortcuts
.PHONY: local local-api local-web

local: dev-up ## Start full local development (alias for dev-up)

local-api: ## Start only API and dependencies
	docker-compose up -d dynamodb-local localstack api-dev

local-web: ## Start only Web development server  
	docker-compose up -d web-dev
