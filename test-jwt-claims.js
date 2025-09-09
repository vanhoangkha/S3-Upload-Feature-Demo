exports.handler = async (event) => {
    console.log('Full event:', JSON.stringify(event, null, 2));
    
    const response = {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            version: event.version,
            requestContext: event.requestContext,
            claims: event.requestContext?.authorizer?.jwt?.claims || event.requestContext?.authorizer?.claims,
            message: 'JWT Claims Debug'
        })
    };
    
    return response;
};
