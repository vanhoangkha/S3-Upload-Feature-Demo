variable "app_name" {
  description = "Application name"
  type        = string
}

variable "env" {
  description = "Environment"
  type        = string
}

variable "function_name" {
  description = "Lambda function name"
  type        = string
}

variable "image_uri" {
  description = "ECR image URI"
  type        = string
}

variable "timeout" {
  description = "Lambda timeout in seconds"
  type        = number
  default     = 30
}

variable "memory_size" {
  description = "Lambda memory size in MB"
  type        = number
  default     = 256
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 14
}

variable "environment_variables" {
  description = "Environment variables for Lambda"
  type        = map(string)
  default     = {}
}

variable "create_ecr_repo" {
  description = "Whether to create ECR repository"
  type        = bool
  default     = false
}

variable "allow_s3_access" {
  description = "Allow S3 access"
  type        = bool
  default     = false
}

variable "allow_ddb_access" {
  description = "Allow DynamoDB access"
  type        = bool
  default     = false
}

variable "allow_cognito_admin" {
  description = "Allow Cognito admin access"
  type        = bool
  default     = false
}

variable "s3_bucket_arn" {
  description = "S3 bucket ARN"
  type        = string
  default     = ""
}

variable "ddb_table_arns" {
  description = "DynamoDB table ARNs"
  type        = list(string)
  default     = []
}

variable "kms_key_arn" {
  description = "KMS key ARN"
  type        = string
  default     = ""
}

variable "user_pool_arn" {
  description = "Cognito User Pool ARN"
  type        = string
  default     = ""
}

variable "reserved_concurrent_executions" {
  description = "Reserved concurrent executions for Lambda"
  type        = number
  default     = 10
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
