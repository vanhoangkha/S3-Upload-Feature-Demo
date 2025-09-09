const requireAuth = (event) => {
  let claims = event.requestContext?.authorizer?.claims;
  
  if (!claims) {
    throw new Error('Missing JWT claims - token not validated by API Gateway');
  }
  
  // Parse Cognito groups - handle both array and string formats
  let groups = [];
  if (claims['cognito:groups']) {
    const groupsValue = claims['cognito:groups'];
    if (Array.isArray(groupsValue)) {
      groups = groupsValue;
    } else if (typeof groupsValue === 'string') {
      // Handle string format like "[Admin]" or "Admin"
      if (groupsValue.startsWith('[') && groupsValue.endsWith(']')) {
        // Parse JSON-like string "[Admin]" -> ["Admin"]
        try {
          groups = JSON.parse(groupsValue);
        } catch {
          // If JSON parse fails, extract content between brackets
          groups = [groupsValue.slice(1, -1)];
        }
      } else {
        groups = [groupsValue];
      }
    }
  }
  
  return {
    userId: claims.sub,
    vendorId: claims.vendor_id || claims['custom:vendor_id'] || '',
    roles: groups,
    email: claims.email
  };
};

exports.handler = async (event) => {
    try {
        const auth = requireAuth(event);
        
        // Test admin access
        const hasAdminRole = auth.roles.includes('Admin');
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                auth: auth,
                hasAdminRole: hasAdminRole,
                message: 'Auth parsing test successful'
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: error.message
            })
        };
    }
};
