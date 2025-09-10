# Core Configuration
variable "app_name" {
  description = "Application name"
  type        = string
  default     = "dms"
  
  validation {
    condition = can(regex("^[a-z][a-z0-9-]*[a-z0-9]$", var.app_name)) && length(var.app_name) <= 20
    error_message = "App name must be lowercase, start with letter, contain only letters/numbers/hyphens, and be <= 20 chars."
  }
}

variable "env" {
  description = "Environment name"
  type        = string
  default     = "dev"
  
  validation {
    condition = contains(["dev", "stg", "prod"], var.env)
    error_message = "Environment must be one of: dev, stg, prod."
  }
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
  
  validation {
    condition = can(regex("^[a-z]{2}-[a-z]+-[0-9]$", var.region))
    error_message = "Region must be a valid AWS region format (e.g., us-east-1)."
  }
}

# Application Configuration
variable "log_level" {
  description = "Log level for Lambda functions"
  type        = string
  default     = "INFO"

  validation {
    condition     = contains(["DEBUG", "INFO", "WARN", "ERROR"], var.log_level)
    error_message = "Log level must be one of: DEBUG, INFO, WARN, ERROR."
  }
}

# Cognito Configuration
variable "cognito_callback_urls" {
  description = "Cognito callback URLs"
  type        = list(string)
  default     = ["http://localhost:3000/auth/callback"]
  
  validation {
    condition = alltrue([
      for url in var.cognito_callback_urls : can(regex("^https?://", url))
    ])
    error_message = "All callback URLs must start with http:// or https://."
  }
}

variable "cognito_logout_urls" {
  description = "Cognito logout URLs"
  type        = list(string)
  default     = ["http://localhost:3000/auth/logout"]
  
  validation {
    condition = alltrue([
      for url in var.cognito_logout_urls : can(regex("^https?://", url))
    ])
    error_message = "All logout URLs must start with http:// or https://."
  }
}
