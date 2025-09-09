output "logs_bucket_name" {
  description = "Logs S3 bucket name"
  value       = aws_s3_bucket.logs.bucket
}

output "logs_bucket_arn" {
  description = "Logs S3 bucket ARN"
  value       = aws_s3_bucket.logs.arn
}

output "docs_bucket_name" {
  description = "Documents bucket name"
  value       = aws_s3_bucket.docs.bucket
}

output "docs_bucket_arn" {
  description = "Documents bucket ARN"
  value       = aws_s3_bucket.docs.arn
}

output "web_bucket_name" {
  description = "Web bucket name"
  value       = aws_s3_bucket.web.bucket
}

output "web_bucket_arn" {
  description = "Web bucket ARN"
  value       = aws_s3_bucket.web.arn
}
