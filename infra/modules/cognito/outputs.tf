output "user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.main.id
}

output "user_pool_client_id" {
  description = "Cognito User Pool Client ID"
  value       = aws_cognito_user_pool_client.main.id
}

output "user_pool_arn" {
  description = "Cognito User Pool ARN"
  value       = aws_cognito_user_pool.main.arn
}

output "cognito_issuer" {
  description = "Cognito issuer URL"
  value       = "https://cognito-idp.us-east-1.amazonaws.com/${aws_cognito_user_pool.main.id}"
}

output "cognito_domain" {
  description = "Cognito domain"
  value       = "https://${aws_cognito_user_pool_domain.main.domain}.auth.us-east-1.amazoncognito.com"
}
