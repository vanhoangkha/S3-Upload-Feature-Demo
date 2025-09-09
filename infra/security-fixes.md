# DMS Security Remediation Plan

## Phase 1: Critical Fixes (Immediate)

### 1. CloudWatch Log Security
```hcl
# modules/lambda/main.tf
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${var.app_name}-${var.env}-${var.function_name}"
  retention_in_days = 365  # Changed from 14 to 365
  kms_key_id        = var.kms_key_arn  # Add KMS encryption
  tags              = var.tags
}

# modules/apigateway/main.tf  
resource "aws_cloudwatch_log_group" "api_gw" {
  name              = "/aws/apigateway/${var.app_name}-${var.env}-api"
  retention_in_days = 365  # Changed from 14 to 365
  kms_key_id        = var.kms_key_arn  # Add KMS encryption
  tags              = var.tags
}
```

### 2. Lambda Security Enhancements
```hcl
# modules/lambda/main.tf
resource "aws_lambda_function" "main" {
  function_name = "${var.app_name}-${var.env}-${var.function_name}"
  role          = aws_iam_role.lambda.arn
  
  package_type = "Image"
  image_uri    = var.image_uri
  
  timeout     = var.timeout
  memory_size = var.memory_size
  
  # Add concurrent execution limit
  reserved_concurrent_executions = var.concurrent_executions
  
  # Add X-Ray tracing
  tracing_config {
    mode = "Active"
  }
  
  # Add Dead Letter Queue
  dead_letter_config {
    target_arn = var.dlq_arn
  }
  
  # Encrypt environment variables
  kms_key_arn = var.kms_key_arn
  
  environment {
    variables = var.environment_variables
  }
  
  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic,
    aws_cloudwatch_log_group.lambda,
  ]
  
  tags = var.tags
}
```

### 3. ECR Security
```hcl
# modules/lambda/main.tf
resource "aws_ecr_repository" "api" {
  count = var.create_ecr_repo ? 1 : 0
  name  = "${var.app_name}-${var.env}-api"
  
  image_tag_mutability = "IMMUTABLE"  # Changed from MUTABLE
  
  # Add KMS encryption
  encryption_configuration {
    encryption_type = "KMS"
    kms_key        = var.kms_key_arn
  }
  
  image_scanning_configuration {
    scan_on_push = true
  }
  
  tags = var.tags
}
```

## Phase 2: CloudFront Security (Week 2)

### 1. Enable WAF
```hcl
# modules/cloudfront/main.tf
resource "aws_wafv2_web_acl" "cloudfront" {
  name  = "${var.app_name}-${var.env}-waf"
  scope = "CLOUDFRONT"
  
  default_action {
    allow {}
  }
  
  rule {
    name     = "RateLimitRule"
    priority = 1
    
    action {
      block {}
    }
    
    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }
  }
  
  tags = var.tags
}

resource "aws_cloudfront_distribution" "web" {
  web_acl_id = aws_wafv2_web_acl.cloudfront.arn
  
  # Add access logging
  logging_config {
    bucket          = var.logging_bucket
    include_cookies = false
    prefix          = "cloudfront-logs/"
  }
  
  # Update viewer certificate for TLS 1.2
  viewer_certificate {
    cloudfront_default_certificate = false
    acm_certificate_arn           = var.ssl_certificate_arn
    ssl_support_method            = "sni-only"
    minimum_protocol_version      = "TLSv1.2_2021"
  }
  
  # Add geo restrictions (customize as needed)
  restrictions {
    geo_restriction {
      restriction_type = "whitelist"
      locations        = ["US", "CA", "GB", "DE", "FR"]
    }
  }
  
  # Existing configuration...
}
```

### 2. S3 Security Enhancements
```hcl
# modules/s3/main.tf
resource "aws_s3_bucket_logging" "docs" {
  bucket = aws_s3_bucket.docs.id
  
  target_bucket = var.logging_bucket
  target_prefix = "s3-access-logs/"
}

resource "aws_s3_bucket_versioning" "web" {
  bucket = aws_s3_bucket.web.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "docs" {
  bucket = aws_s3_bucket.docs.id
  
  rule {
    id     = "transition_rule"
    status = "Enabled"
    
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
    
    transition {
      days          = 90
      storage_class = "GLACIER"
    }
  }
}
```

## Implementation Priority

1. **Immediate (This Week)**:
   - Fix CloudWatch log retention and encryption
   - Enable X-Ray tracing on Lambda functions
   - Make ECR repositories immutable and encrypted

2. **Week 2**:
   - Configure Lambda DLQ and concurrency limits
   - Enable CloudFront WAF and logging
   - Add S3 lifecycle policies and logging

3. **Week 3**:
   - Implement VPC configuration for Lambda (if needed)
   - Add cross-region replication for critical S3 buckets
   - Configure geo-restrictions based on business requirements

## Variables to Add

Add these to your module variables:
```hcl
variable "kms_key_arn" {
  description = "KMS key ARN for encryption"
  type        = string
}

variable "concurrent_executions" {
  description = "Reserved concurrent executions for Lambda"
  type        = number
  default     = 10
}

variable "dlq_arn" {
  description = "Dead Letter Queue ARN"
  type        = string
}

variable "logging_bucket" {
  description = "S3 bucket for access logs"
  type        = string
}

variable "ssl_certificate_arn" {
  description = "ACM certificate ARN for CloudFront"
  type        = string
}
```
