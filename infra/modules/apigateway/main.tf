resource "aws_apigatewayv2_api" "main" {
  name          = "${var.app_name}-${var.env}-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_credentials = false
    allow_headers     = ["content-type", "authorization"]
    allow_methods     = ["*"]
    allow_origins     = var.allowed_origins
    expose_headers    = ["date", "keep-alive"]
    max_age          = 86400
  }

  tags = var.tags
}

resource "aws_apigatewayv2_authorizer" "cognito" {
  api_id           = aws_apigatewayv2_api.main.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "cognito-authorizer"

  jwt_configuration {
    audience = [var.cognito_user_pool_client_id]
    issuer   = var.cognito_issuer
  }
}

resource "aws_apigatewayv2_stage" "main" {
  api_id = aws_apigatewayv2_api.main.id

  name        = "v1"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gw.arn

    format = jsonencode({
      requestId      = "$context.requestId"
      sourceIp       = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      protocol       = "$context.protocol"
      httpMethod     = "$context.httpMethod"
      resourcePath   = "$context.resourcePath"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      responseLength = "$context.responseLength"
      integrationErrorMessage = "$context.integrationErrorMessage"
    })
  }

  tags = var.tags
}

resource "aws_cloudwatch_log_group" "api_gw" {
  name              = "/aws/apigateway/${var.app_name}-${var.env}-api"
  retention_in_days = 365
  kms_key_id        = var.kms_key_arn
  tags              = var.tags
}

# Routes and integrations
resource "aws_apigatewayv2_integration" "lambda" {
  for_each = var.lambda_functions

  api_id = aws_apigatewayv2_api.main.id

  integration_uri    = each.value.invoke_arn
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
}

resource "aws_apigatewayv2_route" "lambda" {
  for_each = var.routes

  api_id = aws_apigatewayv2_api.main.id

  route_key = each.value.route_key
  target    = "integrations/${aws_apigatewayv2_integration.lambda[each.value.function_name].id}"

  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# Lambda permissions
resource "aws_lambda_permission" "api_gw" {
  for_each = var.lambda_functions

  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = each.value.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# Public auth routes (no authorization required)
resource "aws_apigatewayv2_route" "auth_signin" {
  count = contains(keys(var.lambda_functions), "auth") ? 1 : 0
  
  api_id = aws_apigatewayv2_api.main.id

  route_key = "POST /auth/signin"
  target    = "integrations/${aws_apigatewayv2_integration.lambda["auth"].id}"

  authorization_type = "NONE"
}
