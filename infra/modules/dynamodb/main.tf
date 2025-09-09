resource "aws_dynamodb_table" "documents" {
  name           = "${var.app_name}-${var.env}-documents"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "pk"
  range_key      = "sk"

  attribute {
    name = "pk"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  attribute {
    name = "owner_user_id"
    type = "S"
  }

  attribute {
    name = "vendor_id"
    type = "S"
  }

  attribute {
    name = "updated_at"
    type = "S"
  }

  global_secondary_index {
    name     = "GSI1"
    hash_key = "owner_user_id"
    projection_type = "ALL"
  }

  global_secondary_index {
    name      = "GSI2"
    hash_key  = "vendor_id"
    range_key = "updated_at"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = var.kms_key_arn
  }

  point_in_time_recovery {
    enabled = true
  }

  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  tags = var.tags
}

resource "aws_dynamodb_table" "audits" {
  name           = "${var.app_name}-${var.env}-audits"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"
  
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "S"
  }

  attribute {
    name = "actor"
    type = "S"
  }

  global_secondary_index {
    name     = "TimestampIndex"
    hash_key = "timestamp"
    projection_type = "ALL"
  }

  global_secondary_index {
    name     = "ActorIndex"
    hash_key = "actor"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = var.kms_key_arn
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = var.tags
}

resource "aws_dynamodb_table" "role_audits" {
  name           = "${var.app_name}-${var.env}-role-audits"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "pk"
  range_key      = "sk"

  attribute {
    name = "pk"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = var.kms_key_arn
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = var.tags
}
