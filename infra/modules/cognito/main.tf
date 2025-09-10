resource "aws_cognito_user_pool" "main" {
  name = "${var.name_prefix}-users"

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }

  # Schema blocks commented out to avoid modification errors on existing user pool
  # schema {
  #   name                = "email"
  #   attribute_data_type = "String"
  #   required            = true
  #   mutable             = true
  # }

  # schema {
  #   name                = "vendor_id"
  #   attribute_data_type = "String"
  #   required            = false
  #   mutable             = true
  # }

  lambda_config {
    pre_token_generation = var.pre_token_lambda_arn
  }

  tags = var.tags
}

resource "aws_cognito_user_pool_client" "main" {
  name         = "${var.name_prefix}-client"
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]

  supported_identity_providers = concat(["COGNITO"], var.external_providers)

  callback_urls = var.callback_urls
  logout_urls   = var.logout_urls

  allowed_oauth_flows  = ["code"]
  allowed_oauth_scopes = ["email", "openid", "profile"]

  allowed_oauth_flows_user_pool_client = true

  id_token_validity      = 10 # 10 minutes
  access_token_validity  = 60 # 60 minutes  
  refresh_token_validity = 30 # 30 days

  token_validity_units {
    id_token      = "minutes"
    access_token  = "minutes"
    refresh_token = "days"
  }
}

resource "aws_cognito_user_pool_domain" "main" {
  domain       = "${var.name_prefix}-${random_string.domain_suffix.result}"
  user_pool_id = aws_cognito_user_pool.main.id
}

resource "random_string" "domain_suffix" {
  length  = 8
  special = false
  upper   = false
}

# Groups
resource "aws_cognito_user_group" "admin" {
  name         = "Admin"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "System administrators"
}

resource "aws_cognito_user_group" "vendor" {
  name         = "Vendor"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Vendor users"
}

resource "aws_cognito_user_group" "user" {
  name         = "User"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "End users"
}

# Lambda permission for Cognito trigger
resource "aws_lambda_permission" "cognito_trigger" {
  statement_id  = "AllowExecutionFromCognito"
  action        = "lambda:InvokeFunction"
  function_name = var.pre_token_lambda_arn
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.main.arn
}

# External Identity Providers
resource "aws_cognito_identity_provider" "saml" {
  count         = var.saml_provider_enabled ? 1 : 0
  user_pool_id  = aws_cognito_user_pool.main.id
  provider_name = var.saml_provider_name
  provider_type = "SAML"

  provider_details = {
    MetadataURL = var.saml_metadata_url
  }

  attribute_mapping = {
    email = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
    "custom:role" = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
  }
}

resource "aws_cognito_identity_provider" "oidc" {
  count         = var.oidc_provider_enabled ? 1 : 0
  user_pool_id  = aws_cognito_user_pool.main.id
  provider_name = var.oidc_provider_name
  provider_type = "OIDC"

  provider_details = {
    client_id     = var.oidc_client_id
    client_secret = var.oidc_client_secret
    attributes_request_method = "GET"
    oidc_issuer = var.oidc_issuer_url
    authorize_scopes = "openid email profile"
  }

  attribute_mapping = {
    email = "email"
    "custom:role" = "role"
  }
}
resource "aws_cognito_user_pool_ui_customization" "main" {
  client_id    = aws_cognito_user_pool_client.main.id
  user_pool_id = aws_cognito_user_pool.main.id

  # Custom CSS for better UI
  css = <<EOF
.banner-customizable {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 0;
}

.logo-customizable {
  max-width: 200px;
  max-height: 80px;
}

.submitButton-customizable {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 600;
}
EOF

  # You can also add a custom logo
  # image_file = filebase64("${path.module}/logo.png")
}
