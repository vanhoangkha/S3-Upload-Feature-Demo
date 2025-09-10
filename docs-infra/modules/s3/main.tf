# Document Store Bucket - for actual document storage
resource "aws_s3_bucket" "document_store" {
  bucket = "vibdmsstore${var.bucket_suffix}"

  tags = {
    Name        = "Document Store"
    Environment = var.environment
    Purpose     = "Document file storage"
  }
}

resource "aws_s3_bucket_versioning" "document_store" {
  bucket = aws_s3_bucket.document_store.id
  versioning_configuration {
    status = var.enable_versioning ? "Enabled" : "Disabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "document_store" {
  bucket = aws_s3_bucket.document_store.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "document_store" {
  bucket = aws_s3_bucket.document_store.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Document Store CORS Configuration
resource "aws_s3_bucket_cors_configuration" "document_store" {
  bucket = aws_s3_bucket.document_store.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = var.cors_allowed_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# Web Store Bucket - for hosting React app
resource "aws_s3_bucket" "web_store" {
  bucket = "vibdmswebstore${var.bucket_suffix}"

  tags = {
    Name        = "Web Store"
    Environment = var.environment
    Purpose     = "Web application hosting"
  }
}

resource "aws_s3_bucket_versioning" "web_store" {
  bucket = aws_s3_bucket.web_store.id
  versioning_configuration {
    status = var.enable_versioning ? "Enabled" : "Disabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "web_store" {
  bucket = aws_s3_bucket.web_store.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Web Store bucket for public access (if needed)
resource "aws_s3_bucket_public_access_block" "web_store" {
  bucket = aws_s3_bucket.web_store.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Web Store CORS Configuration
resource "aws_s3_bucket_cors_configuration" "web_store" {
  bucket = aws_s3_bucket.web_store.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = var.cors_allowed_origins
    max_age_seconds = 3000
  }
}
