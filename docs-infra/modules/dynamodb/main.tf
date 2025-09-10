resource "aws_dynamodb_table" "documents" {
  name         = "Documents"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "user_id"
  range_key    = "file"

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "file"
    type = "S"
  }

  # Global Secondary Index for querying by document ID
  global_secondary_index {
    name            = "DocumentIdIndex"
    hash_key        = "id"
    projection_type = "ALL"
  }

  attribute {
    name = "id"
    type = "S"
  }

  # Global Secondary Index for querying by creation date
  global_secondary_index {
    name            = "CreatedAtIndex"
    hash_key        = "user_id"
    range_key       = "createdAt"
    projection_type = "ALL"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  tags = {
    Name        = "Documents"
    Environment = var.environment
    Purpose     = "Document metadata storage"
  }
}

resource "aws_dynamodb_table" "general" {
  name         = "General"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"
  range_key    = "sk"

  attribute {
    name = "pk"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  tags = {
    Name        = "General"
    Environment = var.environment
    Purpose     = "General data storage"
  }
}
