# Production environment - copy of dev with different variables
terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }

  backend "s3" {
    bucket         = "dms-terraform-state-us-east-1"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "dms-terraform-locks"
    encrypt        = true
  }
}

# Use the same configuration as dev but with different variables
module "dms" {
  source = "../dev"

  # Override variables for production
  env       = "prod"
  log_level = "warn"

  cognito_callback_urls = [
    "https://app.example.com/auth/callback"
  ]

  cognito_logout_urls = [
    "https://app.example.com/auth/logout"
  ]
}
