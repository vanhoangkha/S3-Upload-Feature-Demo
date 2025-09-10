variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "documents_table_arn" {
  description = "ARN of the Documents DynamoDB table"
  type        = string
}

variable "general_table_arn" {
  description = "ARN of the General DynamoDB table"
  type        = string
}

variable "document_store_bucket_arn" {
  description = "ARN of the document store S3 bucket"
  type        = string
}

variable "web_store_bucket_arn" {
  description = "ARN of the web store S3 bucket"
  type        = string
}

variable "user_pool_arn" {
  description = "ARN of the Cognito user pool"
  type        = string
}

variable "identity_pool_arn" {
  description = "ARN of the Cognito identity pool"
  type        = string
  default     = ""
}
