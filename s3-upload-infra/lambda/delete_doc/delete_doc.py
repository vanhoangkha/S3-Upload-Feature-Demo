import json
import boto3
import os

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')
table = dynamodb.Table(os.environ['TABLE_NAME'])
bucket = os.environ.get('BUCKET_NAME')

def lambda_handler(event, context):
    # TODO implement
    user_id = event['pathParameters']['id']
    file = event['queryStringParameters']['file']

    # Delete from S3
    if bucket:
        s3.delete_object(Bucket=bucket, Key=f"{user_id}/{file}")

    # Delete from DynamoDB
    table.delete_item(Key={'user_id': user_id, 'file': file})

    return {
        "statusCode": 200,
        "body": json.dumps({"message": "Delete successful", "user_id": user_id, "file": file})
    }
