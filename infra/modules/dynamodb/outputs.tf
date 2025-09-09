output "audits_table_name" {
  description = "DynamoDB audits table name"
  value       = aws_dynamodb_table.audits.name
}

output "audits_table_arn" {
  description = "DynamoDB audits table ARN"
  value       = aws_dynamodb_table.audits.arn
}

output "audits_stream_arn" {
  description = "DynamoDB audits table stream ARN"
  value       = aws_dynamodb_table.audits.stream_arn
}

output "documents_table_name" {
  description = "Documents table name"
  value       = aws_dynamodb_table.documents.name
}

output "documents_table_arn" {
  description = "Documents table ARN"
  value       = aws_dynamodb_table.documents.arn
}

output "documents_stream_arn" {
  description = "Documents table stream ARN"
  value       = aws_dynamodb_table.documents.stream_arn
}

output "role_audits_table_name" {
  description = "Role audits table name"
  value       = aws_dynamodb_table.role_audits.name
}

output "role_audits_table_arn" {
  description = "Role audits table ARN"
  value       = aws_dynamodb_table.role_audits.arn
}
