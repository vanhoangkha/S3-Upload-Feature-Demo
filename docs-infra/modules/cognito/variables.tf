variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "password_policy" {
  description = "Cognito user pool password policy"
  type = object({
    minimum_length    = number
    require_lowercase = bool
    require_numbers   = bool
    require_symbols   = bool
    require_uppercase = bool
  })
  default = {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }
}

variable "callback_urls" {
  description = "Callback URLs for Cognito user pool client"
  type        = list(string)
  default     = ["http://localhost:3000"]
}

variable "logout_urls" {
  description = "Logout URLs for Cognito user pool client"
  type        = list(string)
  default     = ["http://localhost:3000"]
}

variable "document_store_bucket_arn" {
  description = "ARN of the document store S3 bucket"
  type        = string
}
