resource "aws_cognito_user_pool" "main" {
  name = "${var.app_name}-${var.env}-users"

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }

  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true
  }

  schema {
    name                = "vendor_id"
    attribute_data_type = "String"
    required            = false
    mutable             = true
  }

  lambda_config {
    pre_token_generation = var.pre_token_generation_lambda_arn
  }

  tags = var.tags
}

resource "aws_cognito_user_pool_client" "main" {
  name         = "${var.app_name}-${var.env}-client"
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret = false
  
  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]

  supported_identity_providers = ["COGNITO"]

  callback_urls = var.callback_urls
  logout_urls   = var.logout_urls

  allowed_oauth_flows  = ["code"]
  allowed_oauth_scopes = ["email", "openid", "profile"]
  
  allowed_oauth_flows_user_pool_client = true

  id_token_validity      = 10  # 10 minutes
  access_token_validity  = 60  # 60 minutes  
  refresh_token_validity = 30  # 30 days

  token_validity_units {
    id_token      = "minutes"
    access_token  = "minutes"
    refresh_token = "days"
  }
}

resource "aws_cognito_user_pool_domain" "main" {
  domain       = "${var.app_name}-${var.env}-${random_string.domain_suffix.result}"
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
  function_name = var.pre_token_generation_lambda_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.main.arn
}

# UI Customization for Hosted UI
resource "aws_cognito_user_pool_ui_customization" "main" {
  client_id    = aws_cognito_user_pool_client.main.id
  user_pool_id = aws_cognito_user_pool.main.id

  # Custom CSS for better UI
  css = <<EOF
/* Modern DMS Login Styling */
.banner-customizable {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 0;
}

.logo-customizable {
  max-width: 200px;
  max-height: 80px;
}

.banner-customizable .banner-inner {
  background: transparent;
}

.submitButton-customizable {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.submitButton-customizable:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.textbox-customizable {
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 16px;
  transition: border-color 0.3s ease;
}

.textbox-customizable:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  outline: none;
}

.panel-default {
  border: none;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.panel-default .panel-body {
  padding: 40px;
  background: #ffffff;
}

.panel-default .panel-heading {
  background: #f8f9fa;
  border: none;
  padding: 20px 40px;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
}

.alert-error {
  background: #fee;
  border: 1px solid #fcc;
  color: #c33;
  border-radius: 8px;
  padding: 12px 16px;
}

.alert-info {
  background: #e3f2fd;
  border: 1px solid #bbdefb;
  color: #1976d2;
  border-radius: 8px;
  padding: 12px 16px;
}

.legalText-customizable {
  color: #6c757d;
  font-size: 14px;
  line-height: 1.5;
}

.background-customizable {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

/* Link styling */
.redirect-customizable {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.redirect-customizable:hover {
  color: #764ba2;
  text-decoration: underline;
}

/* Responsive design */
@media (max-width: 768px) {
  .panel-default .panel-body {
    padding: 20px;
  }
  
  .banner-customizable {
    padding: 20px 0;
  }
}
EOF

  # You can also add a custom logo
  # image_file = filebase64("${path.module}/logo.png")
}
