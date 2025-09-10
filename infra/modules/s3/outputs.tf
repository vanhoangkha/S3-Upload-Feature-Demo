output "docs_bucket_name" {
  description = "Name of the documents bucket"
  value       = aws_s3_bucket.docs.bucket
}

output "docs_bucket_arn" {
  description = "ARN of the documents bucket"
  value       = aws_s3_bucket.docs.arn
}

output "web_bucket_name" {
  description = "Name of the web bucket"
  value       = aws_s3_bucket.web.bucket
}

output "web_bucket_arn" {
  description = "ARN of the web bucket"
  value       = aws_s3_bucket.web.arn
}

output "web_bucket_domain_name" {
  description = "Domain name of the web bucket"
  value       = aws_s3_bucket.web.bucket_domain_name
}

output "logs_bucket_name" {
  description = "Name of the logs bucket"
  value       = aws_s3_bucket.logs.bucket
}

output "logs_bucket_arn" {
  description = "ARN of the logs bucket"
  value       = aws_s3_bucket.logs.arn
}
