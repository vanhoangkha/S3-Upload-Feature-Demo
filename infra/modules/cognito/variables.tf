variable "app_name" {
  description = "Application name"
  type        = string
}

variable "env" {
  description = "Environment"
  type        = string
}

variable "callback_urls" {
  description = "Callback URLs for Cognito"
  type        = list(string)
}

variable "logout_urls" {
  description = "Logout URLs for Cognito"
  type        = list(string)
}

variable "pre_token_generation_lambda_arn" {
  description = "ARN of pre token generation Lambda"
  type        = string
}

variable "pre_token_generation_lambda_name" {
  description = "Name of pre token generation Lambda"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
