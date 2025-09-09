variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "dms"
}

variable "env" {
  description = "Environment"
  type        = string
  default     = "dev"
}

variable "log_level" {
  description = "Log level for Lambda functions"
  type        = string
  default     = "info"
}

variable "cognito_callback_urls" {
  description = "Cognito callback URLs"
  type        = list(string)
  default     = [
    "http://localhost:3000/auth/callback"
  ]
}

variable "cognito_logout_urls" {
  description = "Cognito logout URLs"
  type        = list(string)
  default     = [
    "http://localhost:3000/auth/logout"
  ]
}
