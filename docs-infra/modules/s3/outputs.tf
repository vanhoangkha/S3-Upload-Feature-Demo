output "document_store_bucket_name" {
  description = "Name of the document store S3 bucket"
  value       = aws_s3_bucket.document_store.bucket
}

output "document_store_bucket_arn" {
  description = "ARN of the document store S3 bucket"
  value       = aws_s3_bucket.document_store.arn
}

output "web_store_bucket_name" {
  description = "Name of the web store S3 bucket"
  value       = aws_s3_bucket.web_store.bucket
}

output "web_store_bucket_arn" {
  description = "ARN of the web store S3 bucket"
  value       = aws_s3_bucket.web_store.arn
}

output "web_store_website_endpoint" {
  description = "Website endpoint for the web store S3 bucket"
  value       = aws_s3_bucket_website_configuration.web_store.website_endpoint
}

output "web_store_website_domain" {
  description = "Website domain for the web store S3 bucket"
  value       = aws_s3_bucket_website_configuration.web_store.website_domain
}
