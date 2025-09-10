# Terraform Management Makefile
.PHONY: help init plan apply destroy validate format check clean

# Default environment
ENV ?= dev
TERRAFORM_DIR = envs/$(ENV)

# Colors for output
RED = \033[0;31m
GREEN = \033[0;32m
YELLOW = \033[1;33m
NC = \033[0m # No Color

help: ## Show this help message
	@echo "Terraform Management Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "Usage: make <command> ENV=<environment>"
	@echo "Available environments: dev, stg, prod"

init: ## Initialize Terraform
	@echo "$(YELLOW)Initializing Terraform for $(ENV) environment...$(NC)"
	cd $(TERRAFORM_DIR) && terraform init -upgrade

validate: ## Validate Terraform configuration
	@echo "$(YELLOW)Validating Terraform configuration...$(NC)"
	cd $(TERRAFORM_DIR) && terraform validate

format: ## Format Terraform files
	@echo "$(YELLOW)Formatting Terraform files...$(NC)"
	terraform fmt -recursive .

plan: validate ## Create Terraform execution plan
	@echo "$(YELLOW)Creating Terraform plan for $(ENV) environment...$(NC)"
	cd $(TERRAFORM_DIR) && terraform plan -out=tfplan

apply: ## Apply Terraform changes
	@echo "$(YELLOW)Applying Terraform changes for $(ENV) environment...$(NC)"
	cd $(TERRAFORM_DIR) && terraform apply tfplan
	@echo "$(GREEN)Terraform apply completed!$(NC)"

apply-auto: plan ## Apply changes automatically without confirmation
	@echo "$(YELLOW)Auto-applying Terraform changes for $(ENV) environment...$(NC)"
	cd $(TERRAFORM_DIR) && terraform apply -auto-approve
	@echo "$(GREEN)Terraform apply completed!$(NC)"

destroy: ## Destroy Terraform-managed infrastructure
	@echo "$(RED)WARNING: This will destroy all infrastructure in $(ENV) environment!$(NC)"
	@read -p "Are you sure? Type 'yes' to continue: " confirm && [ "$$confirm" = "yes" ]
	cd $(TERRAFORM_DIR) && terraform destroy

output: ## Show Terraform outputs
	@echo "$(YELLOW)Terraform outputs for $(ENV) environment:$(NC)"
	cd $(TERRAFORM_DIR) && terraform output

refresh: ## Refresh Terraform state
	@echo "$(YELLOW)Refreshing Terraform state for $(ENV) environment...$(NC)"
	cd $(TERRAFORM_DIR) && terraform refresh

check: validate format ## Run all checks (validate + format)
	@echo "$(GREEN)All checks passed!$(NC)"

clean: ## Clean up temporary files
	@echo "$(YELLOW)Cleaning up temporary files...$(NC)"
	find . -name "tfplan" -delete
	find . -name "*.tfstate.backup" -delete
	@echo "$(GREEN)Cleanup completed!$(NC)"

# Environment-specific shortcuts
dev: ENV=dev
dev: plan apply ## Deploy to dev environment

stg: ENV=stg  
stg: plan apply ## Deploy to staging environment

prod: ENV=prod
prod: plan apply ## Deploy to production environment
