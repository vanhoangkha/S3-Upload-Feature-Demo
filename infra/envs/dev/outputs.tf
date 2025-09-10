# API Gateway Outputs
output "api_gateway_url" {
  description = "API Gateway base URL with stage"
  value       = module.apigateway.api_base_url
}

output "api_gateway_id" {
  description = "API Gateway ID"
  value       = module.apigateway.api_id
}

# Cognito Outputs
output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.cognito.user_pool_id
}

output "cognito_client_id" {
  description = "Cognito User Pool Client ID"
  value       = module.cognito.user_pool_client_id
}

output "cognito_domain" {
  description = "Cognito Hosted UI Domain"
  value       = module.cognito.cognito_domain
}

# CloudFront Outputs
output "cloudfront_domain" {
  description = "CloudFront distribution domain name"
  value       = module.cloudfront.domain_name
}

output "cloudfront_url" {
  description = "CloudFront distribution URL"
  value       = "https://${module.cloudfront.domain_name}"
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = module.cloudfront.distribution_id
}

# S3 Outputs
output "web_bucket_name" {
  description = "S3 bucket for web assets"
  value       = module.s3.web_bucket_name
}

output "docs_bucket_name" {
  description = "S3 bucket for documents"
  value       = module.s3.docs_bucket_name
}

output "logs_bucket_name" {
  description = "S3 bucket for logs"
  value       = module.s3.logs_bucket_name
}

output "s3_bucket_arns" {
  description = "ARNs of all S3 buckets"
  value = {
    docs = module.s3.docs_bucket_arn
    web  = module.s3.web_bucket_arn
    logs = module.s3.logs_bucket_arn
  }
}

# Lambda Outputs
output "lambda_function_arns" {
  description = "ARNs of Lambda functions"
  value = {
    for k, v in module.lambda_functions : k => v.lambda_arn
  }
}

# ECR Output
output "ecr_repository_url" {
  description = "ECR repository URL"
  value       = module.ecr.repository_url
}

# KMS Output
output "kms_key_arn" {
  description = "KMS Key ARN"
  value       = module.kms.key_arn
}
