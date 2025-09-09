variable "app_name" {
  description = "Application name"
  type        = string
}

variable "env" {
  description = "Environment"
  type        = string
}

variable "audit_table_arn" {
  description = "DynamoDB audit table ARN"
  type        = string
}

variable "audit_stream_arn" {
  description = "DynamoDB audit table stream ARN"
  type        = string
}

variable "s3_bucket_name" {
  description = "S3 bucket name for audit logs"
  type        = string
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
