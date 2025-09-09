variable "app_name" {
  description = "Application name"
  type        = string
}

variable "env" {
  description = "Environment"
  type        = string
}

variable "kms_key_id" {
  description = "KMS key ID for encryption"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
