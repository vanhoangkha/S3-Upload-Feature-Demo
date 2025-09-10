# Local values for computed resources
locals {
  lambda_source_path = "${path.root}/../docs-api/dist"
}

# DynamoDB Tables
module "dynamodb" {
  source = "./modules/dynamodb"

  environment                   = var.environment
  enable_point_in_time_recovery = var.enable_dynamodb_point_in_time_recovery
}

# S3 Buckets
module "s3" {
  source = "./modules/s3"

  environment          = var.environment
  bucket_suffix        = var.s3_bucket_suffix
  enable_versioning    = var.enable_s3_versioning
  cors_allowed_origins = var.cors_allowed_origins
}

# Cognito User Pool and Identity Pool
module "cognito" {
  source = "./modules/cognito"

  project_name              = var.project_name
  environment               = var.environment
  password_policy           = var.cognito_password_policy
  callback_urls             = var.cors_allowed_origins
  logout_urls               = var.cors_allowed_origins
  document_store_bucket_arn = module.s3.document_store_bucket_arn
}

# IAM Roles and Policies
module "iam" {
  source = "./modules/iam"

  project_name              = var.project_name
  environment               = var.environment
  documents_table_arn       = module.dynamodb.documents_table_arn
  general_table_arn         = module.dynamodb.general_table_arn
  document_store_bucket_arn = module.s3.document_store_bucket_arn
  web_store_bucket_arn      = module.s3.web_store_bucket_arn
  user_pool_arn             = module.cognito.user_pool_arn
  identity_pool_arn         = module.cognito.identity_pool_arn
}

# API Gateway
module "api_gateway" {
  source = "./modules/api-gateway"

  project_name      = var.project_name
  environment       = var.environment
  lambda_invoke_arn = module.lambda.invoke_arn
  stage_name        = var.environment
}

# Lambda Function
module "lambda" {
  source = "./modules/lambda"

  project_name               = var.project_name
  environment                = var.environment
  source_code_path           = local.lambda_source_path
  lambda_execution_role_arn  = module.iam.lambda_execution_role_arn
  timeout                    = var.lambda_timeout
  memory_size                = var.lambda_memory_size
  aws_region                 = var.aws_region
  documents_table_name       = module.dynamodb.documents_table_name
  general_table_name         = module.dynamodb.general_table_name
  document_store_bucket_name = module.s3.document_store_bucket_name
  web_store_bucket_name      = module.s3.web_store_bucket_name
  cognito_user_pool_id       = module.cognito.user_pool_id
  cors_allowed_origins       = var.cors_allowed_origins
  api_gateway_execution_arn  = module.api_gateway.execution_arn
}
