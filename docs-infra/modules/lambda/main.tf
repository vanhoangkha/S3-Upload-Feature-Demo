# Data source to create deployment package
data "archive_file" "lambda_package" {
  type        = "zip"
  source_dir  = var.source_code_path
  output_path = "${path.module}/lambda-deployment.zip"
}

# Lambda function
resource "aws_lambda_function" "api" {
  filename      = data.archive_file.lambda_package.output_path
  function_name = "${var.project_name}-${var.environment}-api"
  role          = var.lambda_execution_role_arn
  handler       = "lambda.handler"
  runtime       = "nodejs18.x"
  timeout       = var.timeout
  memory_size   = var.memory_size

  source_code_hash = data.archive_file.lambda_package.output_base64sha256

  environment {
    variables = {
      DOCUMENTS_TABLE_NAME       = var.documents_table_name
      DOCUMENT_STORE_BUCKET_NAME = var.document_store_bucket_name
      WEB_STORE_BUCKET_NAME      = var.web_store_bucket_name
      COGNITO_USER_POOL_ID       = var.cognito_user_pool_id
      NODE_ENV                   = "production"
      PRESIGNED_URL_EXPIRY       = "3600"
      ALLOWED_ORIGINS            = join(",", var.cors_allowed_origins)
    }
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-api"
    Environment = var.environment
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.api.function_name}"
  retention_in_days = var.log_retention_days

  tags = {
    Name        = "${var.project_name}-${var.environment}-lambda-logs"
    Environment = var.environment
  }
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${var.api_gateway_execution_arn}/*/*"
}
