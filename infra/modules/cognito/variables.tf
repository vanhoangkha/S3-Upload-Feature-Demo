variable "name_prefix" {
  description = "Prefix for resource names"
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

variable "pre_token_lambda_arn" {
  description = "ARN of pre token generation Lambda"
  type        = string
}

variable "external_providers" {
  description = "List of external identity providers"
  type        = list(string)
  default     = []
}

variable "saml_provider_enabled" {
  description = "Enable SAML identity provider"
  type        = bool
  default     = false
}

variable "saml_provider_name" {
  description = "Name of SAML provider"
  type        = string
  default     = "SAML"
}

variable "saml_metadata_url" {
  description = "SAML metadata URL"
  type        = string
  default     = ""
}

variable "oidc_provider_enabled" {
  description = "Enable OIDC identity provider"
  type        = bool
  default     = false
}

variable "oidc_provider_name" {
  description = "Name of OIDC provider"
  type        = string
  default     = "OIDC"
}

variable "oidc_client_id" {
  description = "OIDC client ID"
  type        = string
  default     = ""
}

variable "oidc_client_secret" {
  description = "OIDC client secret"
  type        = string
  default     = ""
  sensitive   = true
}

variable "oidc_issuer_url" {
  description = "OIDC issuer URL"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
