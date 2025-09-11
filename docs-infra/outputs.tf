# ===========================================
# Infrastructure Outputs
# ===========================================

# AWS Region
output "aws_region" {
  description = "AWS region where resources are deployed"
  value       = var.aws_region
}

# ===========================================
# S3 Bucket Outputs
# ===========================================

output "document_store_bucket_name" {
  description = "Name of the document store S3 bucket"
  value       = module.s3.document_store_bucket_name
}

output "web_store_bucket_name" {
  description = "Name of the web store S3 bucket"
  value       = module.s3.web_store_bucket_name
}

# ===========================================
# DynamoDB Table Outputs
# ===========================================

output "documents_table_name" {
  description = "Name of the Documents DynamoDB table"
  value       = module.dynamodb.documents_table_name
}

output "general_table_name" {
  description = "Name of the General DynamoDB table"
  value       = module.dynamodb.general_table_name
}

# ===========================================
# Cognito Outputs
# ===========================================

output "cognito_user_pool_id" {
  description = "ID of the Cognito user pool"
  value       = module.cognito.user_pool_id
}

output "cognito_user_pool_client_id" {
  description = "ID of the Cognito user pool client"
  value       = module.cognito.user_pool_client_id
}

output "cognito_identity_pool_id" {
  description = "ID of the Cognito identity pool"
  value       = module.cognito.identity_pool_id
}

output "cognito_admin_group_name" {
  description = "Name of the Cognito admin group"
  value       = module.cognito.admin_group_name
}

# ===========================================
# API Gateway Outputs
# ===========================================

output "api_gateway_url" {
  description = "API Gateway invoke URL"
  value       = module.api_gateway.invoke_url
}

output "api_gateway_id" {
  description = "API Gateway REST API ID"
  value       = module.api_gateway.api_id
}

# ===========================================
# Lambda Outputs
# ===========================================

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = module.lambda.function_name
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = module.lambda.function_arn
}

# ===========================================
# Environment Configuration for docs-api
# ===========================================

output "api_env_config" {
  description = "Environment configuration for docs-api"
  value = {
    AWS_REGION                 = var.aws_region
    DOCUMENTS_TABLE_NAME       = module.dynamodb.documents_table_name
    GENERAL_TABLE_NAME         = module.dynamodb.general_table_name
    DOCUMENT_STORE_BUCKET_NAME = module.s3.document_store_bucket_name
    WEB_STORE_BUCKET_NAME      = module.s3.web_store_bucket_name
    COGNITO_USER_POOL_ID       = module.cognito.user_pool_id
    API_GATEWAY_URL            = module.api_gateway.invoke_url
    NODE_ENV                   = "production"
    PRESIGNED_URL_EXPIRY       = "3600"
    ALLOWED_ORIGINS            = join(",", var.cors_allowed_origins)
  }
  sensitive = false
}

# ===========================================
# Environment Configuration for docs-ui
# ===========================================

output "ui_env_config" {
  description = "Environment configuration for docs-ui"
  value = {
    REACT_APP_API_URL             = "${module.api_gateway.invoke_url}/api"
    REACT_APP_ENV                 = var.environment
    REACT_APP_DEFAULT_USER_ID     = "demo-user"
    REACT_APP_AWS_REGION          = var.aws_region
    REACT_APP_USER_POOL_ID        = module.cognito.user_pool_id
    REACT_APP_USER_POOL_CLIENT_ID = module.cognito.user_pool_client_id
    REACT_APP_IDENTITY_POOL_ID    = module.cognito.identity_pool_id
    REACT_APP_S3_BUCKET           = module.s3.web_store_bucket_name
  }
  sensitive = false
}

# ===========================================
# Summary Output
# ===========================================

output "deployment_summary" {
  description = "Summary of deployed resources"
  value = {
    environment              = var.environment
    project_name             = var.project_name
    aws_region               = var.aws_region
    api_url                  = module.api_gateway.invoke_url
    cognito_user_pool_id     = module.cognito.user_pool_id
    s3_document_bucket       = module.s3.document_store_bucket_name
    s3_web_bucket            = module.s3.web_store_bucket_name
    dynamodb_documents_table = module.dynamodb.documents_table_name
    lambda_function          = module.lambda.function_name
  }
}
