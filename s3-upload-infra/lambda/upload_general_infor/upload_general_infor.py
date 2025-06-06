import os
import boto3
import json
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])

def lambda_handler(event, context):
    body = json.loads(event['body'])
    id_ = body['id']
    info = body.get('info', {})
    now = datetime.utcnow().isoformat()
    item = {
        'id': id_,
        'info': info,
        'updated_at': now
    }
    table.put_item(Item=item)
    return {
        "statusCode": 200,
        "body": json.dumps({"message": "Upload general info successful", "item": item})
    }
