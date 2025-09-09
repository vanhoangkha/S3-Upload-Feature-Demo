output "firehose_stream_name" {
  description = "Kinesis Firehose delivery stream name"
  value       = aws_kinesis_firehose_delivery_stream.audit_stream.name
}

output "glue_database_name" {
  description = "Glue database name"
  value       = aws_glue_catalog_database.audit.name
}

output "glue_table_name" {
  description = "Glue table name"
  value       = aws_glue_catalog_table.audit.name
}
