variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "function_name" {
  description = "Name of the Lambda function"
  type        = string
}

variable "image_uri" {
  description = "URI of the container image"
  type        = string
}

variable "timeout" {
  description = "Function timeout in seconds"
  type        = number
  default     = 30
  
  validation {
    condition = var.timeout >= 1 && var.timeout <= 900
    error_message = "Timeout must be between 1 and 900 seconds."
  }
}

variable "memory_size" {
  description = "Memory size in MB"
  type        = number
  default     = 512
  
  validation {
    condition = var.memory_size >= 128 && var.memory_size <= 10240
    error_message = "Memory size must be between 128 and 10240 MB."
  }
}

variable "reserved_concurrent_executions" {
  description = "Reserved concurrent executions"
  type        = number
  default     = -1
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 365
}

variable "environment_variables" {
  description = "Environment variables for the function"
  type        = map(string)
  default     = {}
}

# Permission flags
variable "s3_access" {
  description = "Grant S3 access permissions"
  type        = bool
  default     = false
}

variable "ddb_access" {
  description = "Grant DynamoDB access permissions"
  type        = bool
  default     = false
}

variable "cognito_admin" {
  description = "Grant Cognito admin permissions"
  type        = bool
  default     = false
}

# Feature flags
variable "enable_dlq" {
  description = "Enable Dead Letter Queue"
  type        = bool
  default     = true
}

variable "enable_xray" {
  description = "Enable X-Ray tracing"
  type        = bool
  default     = true
}

# Resource ARNs
variable "s3_bucket_arn" {
  description = "S3 bucket ARN for permissions"
  type        = string
  default     = ""
}

variable "ddb_table_arns" {
  description = "DynamoDB table ARNs for permissions"
  type        = list(string)
  default     = []
}

variable "kms_key_arn" {
  description = "KMS key ARN for encryption"
  type        = string
  default     = ""
}

variable "user_pool_arn" {
  description = "Cognito User Pool ARN for admin permissions"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}
