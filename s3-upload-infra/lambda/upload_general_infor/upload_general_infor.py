import os
import boto3
import json
from datetime import datetime
import logging

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])

def lambda_handler(event, context):
    try:
        logger.info(f"Event received: {json.dumps(event)}")
        
        # Extract path parameters
        path_parameters = event.get('pathParameters', {})
        id_ = path_parameters.get('id') if path_parameters else None
        
        # Parse the request body
        body = json.loads(event['body'])
        logger.info(f"Request body: {json.dumps(body)}")
        
        # If id is not in path parameters, try to get it from the body
        if not id_:
            id_ = body.get('id')
        
        # Extract size and amount from body
        size = body.get('size', 0)
        amount = body.get('amount', 0)
        
        now = datetime.utcnow().isoformat()
        
        # Create item to store in DynamoDB
        item = {
            'id': id_,
            'size': size,
            'amount': amount,
            'updated_at': now
        }
        
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
                "message": "Upload general info successful", 
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
