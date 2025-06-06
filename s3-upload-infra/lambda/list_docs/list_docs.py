import os
import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])

def lambda_handler(event, context):
    user_id = event['pathParameters']['id']
    response = table.query(
        KeyConditionExpression=Key('user_id').eq(user_id)
    )
    return {
        "statusCode": 200,
        "body": str(response['Items'])
    } 