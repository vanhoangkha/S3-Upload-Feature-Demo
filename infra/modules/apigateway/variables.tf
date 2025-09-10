variable "app_name" {
  description = "Application name"
  type        = string
}

variable "env" {
  description = "Environment"
  type        = string
}

variable "allowed_origins" {
  description = "Allowed CORS origins (must be explicitly specified)"
  type        = list(string)

  validation {
    condition     = length(var.allowed_origins) > 0
    error_message = "Must specify allowed origins explicitly for security."
  }
}

variable "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  type        = string
}

variable "cognito_user_pool_client_id" {
  description = "Cognito User Pool Client ID"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "lambda_functions" {
  description = "Lambda functions for integration"
  type = map(object({
    function_name = string
    invoke_arn    = string
  }))
}

variable "routes" {
  description = "API routes configuration"
  type = map(object({
    route_key     = string
    function_name = string
    scopes        = optional(list(string), [])
  }))
}

variable "kms_key_arn" {
  description = "KMS key ARN for encryption"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
