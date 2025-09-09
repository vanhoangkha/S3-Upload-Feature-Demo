# Kinesis Firehose Delivery Stream
resource "aws_kinesis_firehose_delivery_stream" "audit_stream" {
  name        = "${var.app_name}-${var.env}-audit-stream"
  destination = "extended_s3"

  server_side_encryption {
    enabled  = true
    key_type = "CUSTOMER_MANAGED_CMK"
    key_arn  = var.kms_key_arn
  }

  extended_s3_configuration {
    role_arn   = aws_iam_role.firehose.arn
    bucket_arn = "arn:aws:s3:::${var.s3_bucket_name}"
    prefix     = "audit-logs/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/hour=!{timestamp:HH}/"
    
    buffering_size     = 5
    buffering_interval = 300
    
    compression_format = "GZIP"
    
    data_format_conversion_configuration {
      enabled = true
      
      input_format_configuration {
        deserializer {
          open_x_json_ser_de {}
        }
      }
      
      output_format_configuration {
        serializer {
          parquet_ser_de {}
        }
      }
      
      schema_configuration {
        database_name = aws_glue_catalog_database.audit.name
        table_name    = aws_glue_catalog_table.audit.name
        role_arn      = aws_iam_role.firehose.arn
      }
    }

    cloudwatch_logging_options {
      enabled         = true
      log_group_name  = aws_cloudwatch_log_group.firehose.name
      log_stream_name = "S3Delivery"
    }
  }

  tags = var.tags
}

# Lambda function to process DynamoDB Stream
resource "aws_lambda_function" "stream_processor" {
  function_name                  = "${var.app_name}-${var.env}-audit-stream-processor"
  role                          = aws_iam_role.stream_processor.arn
  reserved_concurrent_executions = 5
  kms_key_arn                   = var.kms_key_arn
  
  package_type = "Zip"
  filename     = data.archive_file.stream_processor.output_path
  
  handler = "index.handler"
  runtime = "nodejs18.x"
  timeout = 60

  environment {
    variables = {
      FIREHOSE_STREAM_NAME = aws_kinesis_firehose_delivery_stream.audit_stream.name
    }
  }

  dead_letter_config {
    target_arn = aws_sqs_queue.stream_processor_dlq.arn
  }

  tracing_config {
    mode = "Active"
  }

  tags = var.tags
}

# DynamoDB Stream Event Source Mapping
resource "aws_lambda_event_source_mapping" "audit_stream" {
  event_source_arn  = var.audit_stream_arn
  function_name     = aws_lambda_function.stream_processor.arn
  starting_position = "LATEST"
  
  batch_size = 10
}

# Glue Database
resource "aws_glue_catalog_database" "audit" {
  name = "${var.app_name}_${var.env}_audit"
}

# Glue Table
resource "aws_glue_catalog_table" "audit" {
  name          = "audit_logs"
  database_name = aws_glue_catalog_database.audit.name

  table_type = "EXTERNAL_TABLE"

  parameters = {
    "classification" = "parquet"
  }

  storage_descriptor {
    location      = "s3://${var.s3_bucket_name}/audit-logs/"
    input_format  = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat"
    output_format = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat"

    ser_de_info {
      serialization_library = "org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe"
    }

    columns {
      name = "timestamp"
      type = "timestamp"
    }

    columns {
      name = "actor"
      type = "string"
    }

    columns {
      name = "action"
      type = "string"
    }

    columns {
      name = "resource"
      type = "string"
    }

    columns {
      name = "details"
      type = "string"
    }
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "firehose" {
  name              = "/aws/kinesisfirehose/${var.app_name}-${var.env}-audit-stream"
  retention_in_days = 365
  kms_key_id        = var.kms_key_arn
  tags              = var.tags
}

# Stream processor Lambda code
data "archive_file" "stream_processor" {
  type        = "zip"
  output_path = "/tmp/stream_processor.zip"
  
  source {
    content = <<EOF
const AWS = require('aws-sdk');
const firehose = new AWS.Firehose();

exports.handler = async (event) => {
    const records = event.Records.map(record => {
        if (record.eventName === 'INSERT' || record.eventName === 'MODIFY') {
            const data = record.dynamodb.NewImage;
            return {
                Data: JSON.stringify({
                    timestamp: data.timestamp?.S,
                    actor: data.actor?.S,
                    action: data.action?.S,
                    resource: data.resource?.S,
                    details: data.details?.S
                }) + '\n'
            };
        }
        return null;
    }).filter(Boolean);

    if (records.length > 0) {
        await firehose.putRecordBatch({
            DeliveryStreamName: process.env.FIREHOSE_STREAM_NAME,
            Records: records
        }).promise();
    }

    return { statusCode: 200 };
};
EOF
    filename = "index.js"
  }
}

# IAM Roles
resource "aws_iam_role" "firehose" {
  name = "${var.app_name}-${var.env}-firehose-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "firehose.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy" "firehose" {
  name = "${var.app_name}-${var.env}-firehose-policy"
  role = aws_iam_role.firehose.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:AbortMultipartUpload",
          "s3:GetBucketLocation",
          "s3:GetObject",
          "s3:ListBucket",
          "s3:ListBucketMultipartUploads",
          "s3:PutObject"
        ]
        Resource = [
          "arn:aws:s3:::${var.s3_bucket_name}",
          "arn:aws:s3:::${var.s3_bucket_name}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "glue:GetTable",
          "glue:GetTableVersion",
          "glue:GetTableVersions"
        ]
        Resource = [
          "arn:aws:glue:*:*:catalog",
          "arn:aws:glue:*:*:database/${aws_glue_catalog_database.audit.name}",
          "arn:aws:glue:*:*:table/${aws_glue_catalog_database.audit.name}/${aws_glue_catalog_table.audit.name}"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

resource "aws_iam_role" "stream_processor" {
  name = "${var.app_name}-${var.env}-stream-processor-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "stream_processor_basic" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.stream_processor.name
}

resource "aws_iam_role_policy_attachment" "stream_processor_xray" {
  policy_arn = "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
  role       = aws_iam_role.stream_processor.name
}

# Dead Letter Queue for stream processor
resource "aws_sqs_queue" "stream_processor_dlq" {
  name                      = "${var.app_name}-${var.env}-stream-processor-dlq"
  message_retention_seconds = 1209600 # 14 days
  kms_master_key_id        = var.kms_key_arn
  tags                     = var.tags
}

resource "aws_iam_role_policy" "stream_processor" {
  name = "${var.app_name}-${var.env}-stream-processor-policy"
  role = aws_iam_role.stream_processor.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:DescribeStream",
          "dynamodb:GetRecords",
          "dynamodb:GetShardIterator",
          "dynamodb:ListStreams"
        ]
        Resource = var.audit_stream_arn
      },
      {
        Effect = "Allow"
        Action = [
          "firehose:PutRecord",
          "firehose:PutRecordBatch"
        ]
        Resource = aws_kinesis_firehose_delivery_stream.audit_stream.arn
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.stream_processor_dlq.arn
      }
    ]
  })
}
