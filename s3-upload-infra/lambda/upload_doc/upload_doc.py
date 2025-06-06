import json
import boto3
import os
from datetime import datetime, timezone
import logging

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
client_cloudwatch = boto3.client('cloudwatch')
s3 = boto3.client('s3')
table = dynamodb.Table(os.environ['TABLE_NAME'])
bucket = os.environ.get('BUCKET_NAME')

def lambda_handler(event, context):
    try:
        logger.info(f"Event received: {json.dumps(event)}")
        
        # Parse the request body
        body = json.loads(event['body'])
        logger.info(f"Request body: {json.dumps(body)}")
        
        user_id = body['user_id']
        file = body['file']
        folder = body.get('folder', '')
        file_type = body.get('type', '')
        file_size = body.get('size', 0)
        tag = body.get('tag', '')
        identity_id = body.get('identityId', '')
        key = body.get('key', f"{identity_id}/{file}")
        
        now = datetime.utcnow().isoformat()

        # Save metadata to DynamoDB
        item = {
            'user_id': user_id,
            'file': file,
            'uploaded_at': now,
            'modified': now
        }
        
        # Add optional fields if they exist
        if folder:
            item['folder'] = folder
        if file_type:
            item['type'] = file_type
        if file_size:
            item['size'] = file_size
        if tag:
            item['tag'] = tag
        if key:
            item['path'] = f"s3://{bucket}/{key}"
        
        logger.info(f"Saving item to DynamoDB: {json.dumps(item)}")
        table.put_item(Item=item)
        
        # Return success response with CORS headers
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "https://dev.d3gk57lhevbrz2.amplifyapp.com",
                "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
            },
            "body": json.dumps({
                "message": "Upload successful", 
                "item": item
            })
        }
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Access-Control-Allow-Origin": "https://dev.d3gk57lhevbrz2.amplifyapp.com",
                "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
            },
            "body": json.dumps({
                "message": f"Error: {str(e)}"
            })
        }
