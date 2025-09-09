output "api_id" {
  description = "API Gateway ID"
  value       = aws_apigatewayv2_api.main.id
}

output "api_name" {
  description = "API Gateway name"
  value       = aws_apigatewayv2_api.main.name
}

output "api_endpoint" {
  description = "API Gateway endpoint URL"
  value       = aws_apigatewayv2_api.main.api_endpoint
}

output "api_base_url" {
  description = "API Gateway base URL with stage"
  value       = "${aws_apigatewayv2_api.main.api_endpoint}/v1"
}
