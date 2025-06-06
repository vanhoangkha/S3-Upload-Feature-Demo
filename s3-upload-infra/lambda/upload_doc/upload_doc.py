import json
import boto3
import os
from datetime import datetime, timezone

dynamodb = boto3.resource('dynamodb')
client_cloudwatch = boto3.client('cloudwatch')
s3 = boto3.client('s3')
table = dynamodb.Table(os.environ['TABLE_NAME'])
bucket = os.environ.get('BUCKET_NAME')

def lambda_handler(event, context):
    body = json.loads(event['body'])
    user_id = body['user_id']
    file = body['file']
    file_content = body.get('file_content')  # base64 or plain text
    now = datetime.utcnow().isoformat()

    # Save file to S3 if content provided
    if file_content and bucket:
        s3.put_object(Bucket=bucket, Key=f"{user_id}/{file}", Body=file_content)

    # Save metadata to DynamoDB
    item = {
        'user_id': user_id,
        'file': file,
        'uploaded_at': now
    }
    table.put_item(Item=item)

    return {
        "statusCode": 200,
        "body": json.dumps({"message": "Upload successful", "item": item})
    }
