terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }

  backend "s3" {
    bucket         = "dms-terraform-state-us-east-1"
    key            = "dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "dms-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.region
  
  default_tags {
    tags = {
      App        = var.app_name
      Env        = var.env
      Owner      = "platform"
      ManagedBy  = "Terraform"
    }
  }
}

locals {
  tags = {
    App        = var.app_name
    Env        = var.env
    Owner      = "platform"
    ManagedBy  = "Terraform"
  }

  # Lambda functions configuration
  lambda_functions = {
    # Auth functions (no authorization required)
    auth = {
      allow_s3_access    = false
      allow_ddb_access   = false
      allow_cognito_admin = false
    }
    createDocument = {
      allow_s3_access    = false
      allow_ddb_access   = true
      allow_cognito_admin = false
    }
    getDocument = {
      allow_s3_access    = false
      allow_ddb_access   = true
      allow_cognito_admin = false
    }
    listDocuments = {
      allow_s3_access    = false
      allow_ddb_access   = true
      allow_cognito_admin = false
    }
    updateDocument = {
      allow_s3_access    = false
      allow_ddb_access   = true
      allow_cognito_admin = false
    }
    deleteDocument = {
      allow_s3_access    = false
      allow_ddb_access   = true
      allow_cognito_admin = false
    }
    restoreDocument = {
      allow_s3_access    = false
      allow_ddb_access   = true
      allow_cognito_admin = false
    }
    listVersions = {
      allow_s3_access    = true
      allow_ddb_access   = true
      allow_cognito_admin = false
    }
    presignUpload = {
      allow_s3_access    = true
      allow_ddb_access   = false
      allow_cognito_admin = false
    }
    presignDownload = {
      allow_s3_access    = true
      allow_ddb_access   = false
      allow_cognito_admin = false
    }
    whoAmI = {
      allow_s3_access    = false
      allow_ddb_access   = false
      allow_cognito_admin = false
    }
    adminListUsers = {
      allow_s3_access    = false
      allow_ddb_access   = false
      allow_cognito_admin = true
    }
    adminCreateUser = {
      allow_s3_access    = false
      allow_ddb_access   = false
      allow_cognito_admin = true
    }
    adminUpdateRoles = {
      allow_s3_access    = false
      allow_ddb_access   = true
      allow_cognito_admin = true
    }
    adminSignOut = {
      allow_s3_access    = false
      allow_ddb_access   = false
      allow_cognito_admin = true
    }
    adminAudits = {
      allow_s3_access    = false
      allow_ddb_access   = true
      allow_cognito_admin = false
    }
    # User-specific functions
    getUserDocuments = {
      allow_s3_access    = false
      allow_ddb_access   = true
      allow_cognito_admin = false
    }
    getUserProfile = {
      allow_s3_access    = false
      allow_ddb_access   = true
      allow_cognito_admin = false
    }
    updateUserProfile = {
      allow_s3_access    = false
      allow_ddb_access   = true
      allow_cognito_admin = false
    }
    # Vendor-specific functions
    getVendorDocuments = {
      allow_s3_access    = false
      allow_ddb_access   = true
      allow_cognito_admin = false
    }
    getVendorUsers = {
      allow_s3_access    = false
      allow_ddb_access   = false
      allow_cognito_admin = true
    }
    getVendorStats = {
      allow_s3_access    = false
      allow_ddb_access   = true
      allow_cognito_admin = false
    }
  }

  # API routes configuration
  api_routes = {
    "GET /me" = {
      route_key     = "GET /me"
      function_name = "whoAmI"
      auth_required = true
    }
    "GET /files" = {
      route_key     = "GET /files"
      function_name = "listDocuments"
      auth_required = true
    }
    "POST /files" = {
      route_key     = "POST /files"
      function_name = "createDocument"
      auth_required = true
    }
    "GET /files/{id}" = {
      route_key     = "GET /files/{id}"
      function_name = "getDocument"
      auth_required = true
    }
    "PATCH /files/{id}" = {
      route_key     = "PATCH /files/{id}"
      function_name = "updateDocument"
      auth_required = true
    }
    "DELETE /files/{id}" = {
      route_key     = "DELETE /files/{id}"
      function_name = "deleteDocument"
      auth_required = true
    }
    "POST /files/{id}/restore" = {
      route_key     = "POST /files/{id}/restore"
      function_name = "restoreDocument"
      auth_required = true
    }
    "GET /files/{id}/versions" = {
      route_key     = "GET /files/{id}/versions"
      function_name = "listVersions"
      auth_required = true
    }
    "POST /files/presign/upload" = {
      route_key     = "POST /files/presign/upload"
      function_name = "presignUpload"
      auth_required = true
    }
    "POST /files/presign/download" = {
      route_key     = "POST /files/presign/download"
      function_name = "presignDownload"
      auth_required = true
    }
    # User endpoints
    "GET /user/documents" = {
      route_key     = "GET /user/documents"
      function_name = "getUserDocuments"
      auth_required = true
    }
    "GET /user/profile" = {
      route_key     = "GET /user/profile"
      function_name = "getUserProfile"
      auth_required = true
    }
    "PATCH /user/profile" = {
      route_key     = "PATCH /user/profile"
      function_name = "updateUserProfile"
      auth_required = true
    }
    # Vendor endpoints
    "GET /vendor/documents" = {
      route_key     = "GET /vendor/documents"
      function_name = "getVendorDocuments"
      auth_required = true
    }
    "GET /vendor/users" = {
      route_key     = "GET /vendor/users"
      function_name = "getVendorUsers"
      auth_required = true
    }
    "GET /vendor/stats" = {
      route_key     = "GET /vendor/stats"
      function_name = "getVendorStats"
      auth_required = true
    }
    # Admin endpoints
    "GET /admin/users" = {
      route_key     = "GET /admin/users"
      function_name = "adminListUsers"
      auth_required = true
    }
    "POST /admin/users" = {
      route_key     = "POST /admin/users"
      function_name = "adminCreateUser"
      auth_required = true
    }
    "POST /admin/users/{id}/roles" = {
      route_key     = "POST /admin/users/{id}/roles"
      function_name = "adminUpdateRoles"
      auth_required = true
    }
    "POST /admin/users/{id}/signout" = {
      route_key     = "POST /admin/users/{id}/signout"
      function_name = "adminSignOut"
      auth_required = true
    }
    "GET /admin/audits" = {
      route_key     = "GET /admin/audits"
      function_name = "adminAudits"
      auth_required = true
    }
  }
}

# KMS
module "kms" {
  source = "../../modules/kms"
  
  app_name = var.app_name
  env      = var.env
  tags     = local.tags
}

# S3
module "s3" {
  source = "../../modules/s3"
  
  app_name   = var.app_name
  env        = var.env
  kms_key_id = module.kms.key_id
  tags       = local.tags
}

# DynamoDB
module "dynamodb" {
  source = "../../modules/dynamodb"
  
  app_name    = var.app_name
  env         = var.env
  kms_key_arn = module.kms.key_arn
  tags        = local.tags
}

# ECR Repository
module "ecr" {
  source = "../../modules/ecr"
  
  app_name    = var.app_name
  env         = var.env
  kms_key_arn = module.kms.key_arn
  
  tags = local.tags
}

# Pre Token Generation Lambda
module "pre_token_lambda" {
  source = "../../modules/lambda"
  
  app_name      = var.app_name
  env           = var.env
  function_name = "preTokenGeneration"
  image_uri     = "${module.ecr.ecr_repository_url}:latest"
  
  environment_variables = {
    LOG_LEVEL  = var.log_level
  }
  
  tags = local.tags
}

# Cognito
module "cognito" {
  source = "../../modules/cognito"
  
  app_name    = var.app_name
  env         = var.env
  
  callback_urls = var.cognito_callback_urls
  logout_urls   = var.cognito_logout_urls
  
  pre_token_generation_lambda_arn  = module.pre_token_lambda.lambda_arn
  pre_token_generation_lambda_name = module.pre_token_lambda.lambda_name
  
  tags = local.tags
}

# Lambda Functions
module "lambda_functions" {
  source = "../../modules/lambda"
  
  for_each = local.lambda_functions
  
  app_name      = var.app_name
  env           = var.env
  function_name = each.key
  image_uri     = "${module.ecr.ecr_repository_url}:latest"
  
  environment_variables = {
    DOC_BUCKET         = module.s3.docs_bucket_name
    TABLE_NAME         = module.dynamodb.documents_table_name
    AUDIT_TABLE        = module.dynamodb.audits_table_name
    KMS_KEY_ID         = module.kms.key_id
    USER_POOL_ID       = module.cognito.user_pool_id
    USER_POOL_CLIENT_ID = module.cognito.user_pool_client_id
    LOG_LEVEL          = var.log_level
  }
  
  allow_s3_access     = each.value.allow_s3_access
  allow_ddb_access    = each.value.allow_ddb_access
  allow_cognito_admin = each.value.allow_cognito_admin
  
  s3_bucket_arn = module.s3.docs_bucket_arn
  ddb_table_arns = [
    module.dynamodb.documents_table_arn,
    module.dynamodb.audits_table_arn
  ]
  kms_key_arn   = module.kms.key_arn
  user_pool_arn = module.cognito.user_pool_arn
  
  tags = local.tags
}

# API Gateway
module "apigateway" {
  source = "../../modules/apigateway"
  
  app_name    = var.app_name
  env         = var.env
  kms_key_arn = module.kms.key_arn
  
  cognito_user_pool_client_id = module.cognito.user_pool_client_id
  cognito_issuer              = module.cognito.cognito_issuer
  
  allowed_origins = [
    "https://${module.cloudfront.domain_name}",
    "http://localhost:3000"
  ]
  
  lambda_functions = {
    for name, config in local.lambda_functions : name => {
      function_name = module.lambda_functions[name].lambda_name
      invoke_arn    = module.lambda_functions[name].lambda_arn
    }
  }
  
  routes = local.api_routes
  
  tags = local.tags
}

# CloudTrail
module "cloudtrail" {
  source = "../../modules/cloudtrail"
  
  app_name = var.app_name
  env      = var.env
  
  s3_bucket_name = module.s3.logs_bucket_name
  kms_key_arn    = module.kms.key_arn
  
  tags = local.tags
}

# CloudWatch Alarms
module "monitoring" {
  source = "../../modules/monitoring"
  
  app_name    = var.app_name
  env         = var.env
  kms_key_arn = module.kms.key_arn
  
  lambda_function_names = [for name, config in local.lambda_functions : "${var.app_name}-${var.env}-${name}"]
  api_gateway_name      = module.apigateway.api_name
  dynamodb_table_names  = [
    module.dynamodb.documents_table_name,
    module.dynamodb.audits_table_name
  ]
  
  tags = local.tags
}

# DynamoDB Streams to Firehose
module "audit_pipeline" {
  source = "../../modules/audit_pipeline"
  
  app_name = var.app_name
  env      = var.env
  
  audit_table_arn    = module.dynamodb.audits_table_arn
  audit_stream_arn   = module.dynamodb.audits_stream_arn
  s3_bucket_name     = module.s3.logs_bucket_name
  kms_key_arn        = module.kms.key_arn
  
  tags = local.tags
}

# CloudFront
module "cloudfront" {
  source = "../../modules/cloudfront"
  
  app_name = var.app_name
  env      = var.env
  
  s3_bucket_name        = module.s3.web_bucket_name
  s3_bucket_arn         = module.s3.web_bucket_arn
  s3_bucket_domain_name = "${module.s3.web_bucket_name}.s3.amazonaws.com"
  logs_bucket_name      = module.s3.logs_bucket_name
  
  tags = local.tags
}
