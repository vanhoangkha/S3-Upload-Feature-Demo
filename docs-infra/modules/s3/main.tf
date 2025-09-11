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

# Web Store Static Website Configuration
resource "aws_s3_bucket_website_configuration" "web_store" {
  bucket = aws_s3_bucket.web_store.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html" # For React Router to handle client-side routing
  }
}

# Web Store bucket public access configuration for static hosting
resource "aws_s3_bucket_public_access_block" "web_store" {
  bucket = aws_s3_bucket.web_store.id

  block_public_acls       = true
  block_public_policy     = false # Allow public bucket policy for static hosting
  ignore_public_acls      = true
  restrict_public_buckets = false # Allow public bucket for static hosting
}

# Web Store bucket policy for public read access (required for static hosting)
resource "aws_s3_bucket_policy" "web_store" {
  bucket = aws_s3_bucket.web_store.id

  # Ensure public access block is configured first
  depends_on = [aws_s3_bucket_public_access_block.web_store]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.web_store.arn}/*"
      }
    ]
  })
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
