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
      App       = var.app_name
      Env       = var.env
      Owner     = "platform"
      ManagedBy = "Terraform"
    }
  }
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  common_tags = {
    App       = var.app_name
    Env       = var.env
    Owner     = "platform"
    ManagedBy = "Terraform"
    Region    = data.aws_region.current.name
    Account   = data.aws_caller_identity.current.account_id
  }

  name_prefix = "${var.app_name}-${var.env}"
  
  # Lambda functions configuration
  all_lambda_functions = {
    jwtAuthorizer = {
      s3_access     = false
      ddb_access    = false
      cognito_admin = false
    }
    createDocument = {
      s3_access     = false
      ddb_access    = true
      cognito_admin = false
    }
    getDocument = {
      s3_access     = false
      ddb_access    = true
      cognito_admin = false
    }
    listDocuments = {
      s3_access     = false
      ddb_access    = true
      cognito_admin = false
    }
    updateDocument = {
      s3_access     = false
      ddb_access    = true
      cognito_admin = false
    }
    deleteDocument = {
      s3_access     = false
      ddb_access    = true
      cognito_admin = false
    }
    restoreDocument = {
      s3_access     = false
      ddb_access    = true
      cognito_admin = false
    }
    listVersions = {
      s3_access     = true
      ddb_access    = true
      cognito_admin = false
    }
    presignUpload = {
      s3_access     = true
      ddb_access    = false
      cognito_admin = false
    }
    presignDownload = {
      s3_access     = true
      ddb_access    = false
      cognito_admin = false
    }
    whoAmI = {
      s3_access     = false
      ddb_access    = false
      cognito_admin = false
    }
    adminListUsers = {
      s3_access     = false
      ddb_access    = false
      cognito_admin = true
    }
    adminCreateUser = {
      s3_access     = false
      ddb_access    = false
      cognito_admin = true
    }
    adminUpdateRoles = {
      s3_access     = false
      ddb_access    = true
      cognito_admin = true
    }
    adminSignOut = {
      s3_access     = false
      ddb_access    = false
      cognito_admin = true
    }
    adminAudits = {
      s3_access     = false
      ddb_access    = true
      cognito_admin = false
    }
    getUserProfile = {
      s3_access     = false
      ddb_access    = false
      cognito_admin = false
    }
    updateUserProfile = {
      s3_access     = false
      ddb_access    = false
      cognito_admin = false
    }
    getUserDocuments = {
      s3_access     = false
      ddb_access    = true
      cognito_admin = false
    }
    getVendorDocuments = {
      s3_access     = false
      ddb_access    = true
      cognito_admin = false
    }
    getVendorUsers = {
      s3_access     = false
      ddb_access    = false
      cognito_admin = false
    }
    getVendorStats = {
      s3_access     = false
      ddb_access    = true
      cognito_admin = false
    }
  }

  # API routes configuration
  api_routes = {
    "GET /me"                      = { route_key = "GET /me", function_name = "whoAmI", scopes = [] }
    "GET /files"                   = { route_key = "GET /files", function_name = "listDocuments", scopes = [] }
    "POST /files"                  = { route_key = "POST /files", function_name = "createDocument", scopes = [] }
    "GET /files/{id}"              = { route_key = "GET /files/{id}", function_name = "getDocument", scopes = [] }
    "PATCH /files/{id}"            = { route_key = "PATCH /files/{id}", function_name = "updateDocument", scopes = [] }
    "DELETE /files/{id}"           = { route_key = "DELETE /files/{id}", function_name = "deleteDocument", scopes = [] }
    "POST /files/{id}/restore"     = { route_key = "POST /files/{id}/restore", function_name = "restoreDocument", scopes = [] }
    "GET /files/{id}/versions"     = { route_key = "GET /files/{id}/versions", function_name = "listVersions", scopes = [] }
    "POST /files/presign/upload"   = { route_key = "POST /files/presign/upload", function_name = "presignUpload", scopes = [] }
    "POST /files/presign/download" = { route_key = "POST /files/presign/download", function_name = "presignDownload", scopes = [] }
    "GET /admin/users"             = { route_key = "GET /admin/users", function_name = "adminListUsers", scopes = [] }
    "POST /admin/users"            = { route_key = "POST /admin/users", function_name = "adminCreateUser", scopes = [] }
    "POST /admin/users/{id}/roles" = { route_key = "POST /admin/users/{id}/roles", function_name = "adminUpdateRoles", scopes = [] }
    "POST /admin/users/{id}/signout" = { route_key = "POST /admin/users/{id}/signout", function_name = "adminSignOut", scopes = [] }
    "GET /admin/audits"            = { route_key = "GET /admin/audits", function_name = "adminAudits", scopes = [] }
    "GET /user/profile"            = { route_key = "GET /user/profile", function_name = "getUserProfile", scopes = [] }
    "PUT /user/profile"            = { route_key = "PUT /user/profile", function_name = "updateUserProfile", scopes = [] }
    "GET /user/documents"          = { route_key = "GET /user/documents", function_name = "getUserDocuments", scopes = [] }
    "GET /vendor/documents"        = { route_key = "GET /vendor/documents", function_name = "getVendorDocuments", scopes = [] }
    "GET /vendor/users"            = { route_key = "GET /vendor/users", function_name = "getVendorUsers", scopes = [] }
    "GET /vendor/stats"            = { route_key = "GET /vendor/stats", function_name = "getVendorStats", scopes = [] }
  }
}

# Core Infrastructure
module "kms" {
  source = "../../modules/kms"
  
  name_prefix = local.name_prefix
  tags        = local.common_tags
}

module "s3" {
  source = "../../modules/s3"
  
  name_prefix = local.name_prefix
  kms_key_id  = module.kms.key_id
  tags        = local.common_tags
}

module "dynamodb" {
  source = "../../modules/dynamodb"
  
  name_prefix = local.name_prefix
  kms_key_arn = module.kms.key_arn
  tags        = local.common_tags
}

module "ecr" {
  source = "../../modules/ecr"
  
  name_prefix = local.name_prefix
  kms_key_arn = module.kms.key_arn
  tags        = local.common_tags
}

# Pre Token Generation Lambda
module "pre_token_lambda" {
  source = "../../modules/lambda"
  
  name_prefix   = local.name_prefix
  function_name = "preTokenGeneration"
  image_uri     = "${module.ecr.repository_url}:latest"
  
  environment_variables = {
    LOG_LEVEL = var.log_level
  }
  
  tags = local.common_tags
}

# Authentication
module "cognito" {
  source = "../../modules/cognito"
  
  name_prefix           = local.name_prefix
  callback_urls         = var.cognito_callback_urls
  logout_urls           = var.cognito_logout_urls
  pre_token_lambda_arn  = module.pre_token_lambda.lambda_arn
  
  tags = local.common_tags
}

# Lambda Functions
module "lambda_functions" {
  source = "../../modules/lambda"
  
  for_each = local.all_lambda_functions
  
  name_prefix   = local.name_prefix
  function_name = each.key
  image_uri     = "${module.ecr.repository_url}:latest"
  
  environment_variables = {
    DOC_BUCKET          = module.s3.docs_bucket_name
    TABLE_NAME          = module.dynamodb.documents_table_name
    AUDIT_TABLE         = module.dynamodb.audits_table_name
    KMS_KEY_ID          = module.kms.key_id
    USER_POOL_ID        = module.cognito.user_pool_id
    USER_POOL_CLIENT_ID = module.cognito.user_pool_client_id
    COGNITO_USER_POOL_ID = module.cognito.user_pool_id
    COGNITO_CLIENT_ID   = module.cognito.user_pool_client_id
    LOG_LEVEL           = var.log_level
  }
  
  # Permissions
  s3_access     = each.value.s3_access
  ddb_access    = each.value.ddb_access
  cognito_admin = each.value.cognito_admin
  
  # Resource ARNs
  s3_bucket_arn  = module.s3.docs_bucket_arn
  ddb_table_arns = [module.dynamodb.documents_table_arn, module.dynamodb.audits_table_arn]
  kms_key_arn    = module.kms.key_arn
  user_pool_arn  = module.cognito.user_pool_arn
  
  tags = local.common_tags
}

# API Gateway
module "apigateway" {
  source = "../../modules/apigateway"
  
  app_name    = var.app_name
  env         = var.env
  kms_key_arn = module.kms.key_arn
  
  cognito_user_pool_id        = module.cognito.user_pool_id
  cognito_user_pool_client_id = module.cognito.user_pool_client_id
  aws_region                  = data.aws_region.current.name
  
  allowed_origins = [
    "http://localhost:3000"
  ]
  
  lambda_functions = {
    for name in keys(local.all_lambda_functions) : name => {
      function_name = module.lambda_functions[name].function_name
      invoke_arn    = module.lambda_functions[name].invoke_arn
    }
  }
  
  routes = local.api_routes
  
  tags = local.common_tags
}

# Monitoring & Logging
module "cloudtrail" {
  source = "../../modules/cloudtrail"
  
  app_name       = var.app_name
  env            = var.env
  s3_bucket_name = module.s3.logs_bucket_name
  kms_key_arn    = module.kms.key_arn
  
  tags = local.common_tags
}

module "monitoring" {
  source = "../../modules/monitoring"
  
  app_name              = var.app_name
  env                   = var.env
  kms_key_arn          = module.kms.key_arn
  lambda_function_names = [for name in keys(local.all_lambda_functions) : "${local.name_prefix}-${name}"]
  api_gateway_name     = module.apigateway.api_name
  dynamodb_table_names = [module.dynamodb.documents_table_name, module.dynamodb.audits_table_name]
  
  tags = local.common_tags
}

module "audit_pipeline" {
  source = "../../modules/audit_pipeline"
  
  app_name           = var.app_name
  env                = var.env
  audit_table_arn    = module.dynamodb.audits_table_arn
  audit_stream_arn   = module.dynamodb.audits_stream_arn
  s3_bucket_name     = module.s3.logs_bucket_name
  kms_key_arn        = module.kms.key_arn
  
  tags = local.common_tags
}

# Frontend Distribution
module "cloudfront" {
  source = "../../modules/cloudfront"
  
  app_name              = var.app_name
  env                   = var.env
  s3_bucket_name        = module.s3.web_bucket_name
  s3_bucket_arn         = module.s3.web_bucket_arn
  s3_bucket_domain_name = module.s3.web_bucket_domain_name
  logs_bucket_name      = module.s3.logs_bucket_name
  
  tags = local.common_tags
}
