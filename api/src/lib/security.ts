import { APIGatewayProxyEvent } from 'aws-lambda';

export const sanitizeEvent = (event: APIGatewayProxyEvent): APIGatewayProxyEvent => {
  if (!event || typeof event !== 'object') {
    throw new Error('Invalid event structure');
  }
  
  if (!event.requestContext || !event.httpMethod) {
    throw new Error('Missing required event fields');
  }
  
  return event;
};

export const sanitizeForLog = (data: any): any => {
  if (typeof data === 'string') {
    return data.replace(/[\r\n\t]/g, '_');
  }
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeForLog(value);
    }
    return sanitized;
  }
  return data;
};

export const sanitizeOutput = (data: any): any => {
  if (typeof data === 'string') {
    return data
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeOutput(value);
    }
    return sanitized;
  }
  return data;
};

export const safeJsonParse = (jsonString: string | null): any => {
  if (!jsonString) return {};
  
  try {
    const parsed = JSON.parse(jsonString);
    
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('Invalid JSON structure');
    }
    
    return parsed;
  } catch (error) {
    throw new Error('Invalid JSON format');
  }
};

export const createSafeResponse = (statusCode: number, data: any) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY'
  },
  body: JSON.stringify(sanitizeOutput(data))
});