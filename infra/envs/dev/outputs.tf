output "logs_bucket_name" {
  description = "Logs S3 bucket name"
  value       = module.s3.logs_bucket_name
}

output "firehose_stream_name" {
  description = "Kinesis Firehose delivery stream name"
  value       = module.audit_pipeline.firehose_stream_name
}

output "glue_database_name" {
  description = "Glue database name for audit analytics"
  value       = module.audit_pipeline.glue_database_name
}

output "sns_alerts_topic" {
  description = "SNS topic ARN for alerts"
  value       = module.monitoring.sns_topic_arn
}

output "user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.cognito.user_pool_id
}

output "user_pool_client_id" {
  description = "Cognito User Pool Client ID"
  value       = module.cognito.user_pool_client_id
}

output "cognito_issuer" {
  description = "Cognito issuer URL"
  value       = module.cognito.cognito_issuer
}

output "cognito_domain" {
  description = "Cognito domain URL"
  value       = module.cognito.cognito_domain
}

output "api_base_url" {
  description = "API Gateway base URL"
  value       = module.apigateway.api_base_url
}

output "docs_bucket_name" {
  description = "Documents S3 bucket name"
  value       = module.s3.docs_bucket_name
}

output "web_bucket_name" {
  description = "Web S3 bucket name"
  value       = module.s3.web_bucket_name
}

output "cloudfront_domain" {
  description = "CloudFront distribution domain"
  value       = module.cloudfront.domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = module.cloudfront.distribution_id
}

output "documents_table_name" {
  description = "DynamoDB documents table name"
  value       = module.dynamodb.documents_table_name
}

output "audits_table_name" {
  description = "DynamoDB audits table name"
  value       = module.dynamodb.audits_table_name
}

output "kms_key_id" {
  description = "KMS key ID"
  value       = module.kms.key_id
}

output "ecr_repository_url" {
  description = "ECR repository URL"
  value       = module.ecr.ecr_repository_url
}
