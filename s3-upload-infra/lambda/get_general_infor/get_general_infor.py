import json
import boto3
import os
from decimal import *
from boto3.dynamodb.types import TypeDeserializer

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])
serializer = TypeDeserializer()
    
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return str(obj)
        return json.JSONEncoder.default(self, obj)
        
def deserialize(data):
    if isinstance(data, list):
        return [deserialize(v) for v in data]

    if isinstance(data, dict):
        try:
            return serializer.deserialize(data)
        except TypeError:
            return {k: deserialize(v) for k, v in data.items()}
    else:
        return data
        
def lambda_handler(event, context):
    id_ = event['pathParameters']['id']
    response = table.get_item(Key={'id': id_})
    item = response.get('Item')
    if item:
        return {
            "statusCode": 200,
            "body": json.dumps(item)
        }
    else:
        return {
            "statusCode": 404,
            "body": json.dumps({"message": "Not found"})
        }
