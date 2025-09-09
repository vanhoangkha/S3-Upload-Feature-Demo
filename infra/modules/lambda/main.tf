resource "aws_lambda_function" "main" {
  function_name = "${var.app_name}-${var.env}-${var.function_name}"
  role          = aws_iam_role.lambda.arn

  package_type = "Image"
  image_uri    = var.image_uri

  timeout                        = var.timeout
  memory_size                    = var.memory_size
  reserved_concurrent_executions = var.reserved_concurrent_executions
  kms_key_arn                   = var.kms_key_arn

  environment {
    variables = var.environment_variables
  }

  dead_letter_config {
    target_arn = aws_sqs_queue.dlq.arn
  }

  tracing_config {
    mode = "Active"
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic,
    aws_cloudwatch_log_group.lambda,
  ]

  tags = var.tags
}

resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${var.app_name}-${var.env}-${var.function_name}"
  retention_in_days = 365
  tags              = var.tags
}

resource "aws_iam_role" "lambda" {
  name = "${var.app_name}-${var.env}-${var.function_name}-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda.name
}

# S3 permissions
resource "aws_iam_role_policy" "s3" {
  count = var.allow_s3_access ? 1 : 0
  name  = "${var.app_name}-${var.env}-${var.function_name}-s3"
  role  = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          var.s3_bucket_arn,
          "${var.s3_bucket_arn}/*"
        ]
      }
    ]
  })
}

# DynamoDB permissions
resource "aws_iam_role_policy" "dynamodb" {
  count = var.allow_ddb_access ? 1 : 0
  name  = "${var.app_name}-${var.env}-${var.function_name}-ddb"
  role  = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem",
          "dynamodb:TransactWriteItems"
        ]
        Resource = var.ddb_table_arns
      }
    ]
  })
}

# KMS permissions
resource "aws_iam_role_policy" "kms" {
  count = length(var.kms_key_arn) > 0 ? 1 : 0
  name  = "${var.app_name}-${var.env}-${var.function_name}-kms"
  role  = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = var.kms_key_arn
      }
    ]
  })
}

# Cognito admin permissions
resource "aws_iam_role_policy" "cognito" {
  count = var.allow_cognito_admin ? 1 : 0
  name  = "${var.app_name}-${var.env}-${var.function_name}-cognito"
  role  = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cognito-idp:ListUsers",
          "cognito-idp:AdminCreateUser",
          "cognito-idp:AdminAddUserToGroup",
          "cognito-idp:AdminRemoveUserFromGroup",
          "cognito-idp:AdminUpdateUserAttributes",
          "cognito-idp:AdminUserGlobalSignOut",
          "cognito-idp:AdminListGroupsForUser"
        ]
        Resource = var.user_pool_arn
      }
    ]
  })
}

# Dead Letter Queue
resource "aws_sqs_queue" "dlq" {
  name                      = "${var.app_name}-${var.env}-${var.function_name}-dlq"
  message_retention_seconds = 1209600 # 14 days
  kms_master_key_id        = var.kms_key_arn
  tags                     = var.tags
}

# X-Ray permissions
resource "aws_iam_role_policy_attachment" "xray" {
  policy_arn = "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
  role       = aws_iam_role.lambda.name
}

# SQS DLQ permissions
resource "aws_iam_role_policy" "sqs_dlq" {
  name = "${var.app_name}-${var.env}-${var.function_name}-sqs-dlq"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.dlq.arn
      }
    ]
  })
}
