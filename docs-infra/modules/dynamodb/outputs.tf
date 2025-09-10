output "documents_table_name" {
  description = "Name of the Documents DynamoDB table"
  value       = aws_dynamodb_table.documents.name
}

output "documents_table_arn" {
  description = "ARN of the Documents DynamoDB table"
  value       = aws_dynamodb_table.documents.arn
}

output "general_table_name" {
  description = "Name of the General DynamoDB table"
  value       = aws_dynamodb_table.general.name
}

output "general_table_arn" {
  description = "ARN of the General DynamoDB table"
  value       = aws_dynamodb_table.general.arn
}
