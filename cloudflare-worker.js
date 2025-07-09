export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    // Health check
    if (url.pathname === '/') {
      return new Response(JSON.stringify({
        status: 'ok',
        endpoint: url.origin + '/sse'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // SSE endpoint
    if (url.pathname === '/sse') {
      // For GET requests, return SSE stream
      if (request.method === 'GET' || request.method === 'POST') {
        const sessionId = crypto.randomUUID();
        
        // Return SSE response
        return new Response(`event: endpoint\ndata: /sse?sessionId=${sessionId}\n\n`, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          }
        });
      }
    }
    
    // Handle session requests
    if (url.pathname === '/sse' && url.searchParams.has('sessionId')) {
      if (request.method === 'POST') {
        const body = await request.json();
        
        // Simple response based on method
        if (body.method === 'initialize') {
          return new Response(`data: ${JSON.stringify({
            jsonrpc: '2.0',
            id: body.id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: { resources: {} },
              serverInfo: { name: 'test-mcp-server', version: '1.0.0' }
            }
          })}\n\n`, {
            headers: {
              ...corsHeaders,
              'Content-Type': 'text/event-stream',
            }
          });
        }
        
        if (body.method === 'resources/list') {
          return new Response(`data: ${JSON.stringify({
            jsonrpc: '2.0',
            id: body.id,
            result: {
              resources: [
                { uri: 'test://image.png', name: 'Test Image', mimeType: 'image/png' },
                { uri: 'test://data.csv', name: 'Test CSV', mimeType: 'text/csv' }
              ]
            }
          })}\n\n`, {
            headers: {
              ...corsHeaders,
              'Content-Type': 'text/event-stream',
            }
          });
        }
        
        if (body.method === 'resources/read') {
          const uri = body.params.uri;
          if (uri === 'test://image.png') {
            return new Response(`data: ${JSON.stringify({
              jsonrpc: '2.0',
              id: body.id,
              result: {
                contents: [{
                  uri: 'test://image.png',
                  mimeType: 'image/png',
                  blob: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIA9l2+BgAAAABJRU5ErkJggg=='
                }]
              }
            })}\n\n`, {
              headers: {
                ...corsHeaders,
                'Content-Type': 'text/event-stream',
              }
            });
          }
          
          if (uri === 'test://data.csv') {
            return new Response(`data: ${JSON.stringify({
              jsonrpc: '2.0',
              id: body.id,
              result: {
                contents: [{
                  uri: 'test://data.csv',
                  mimeType: 'text/csv',
                  text: 'id,name,value\\n1,Item A,100\\n2,Item B,200'
                }]
              }
            })}\n\n`, {
              headers: {
                ...corsHeaders,
                'Content-Type': 'text/event-stream',
              }
            });
          }
        }
      }
    }
    
    return new Response('Not Found', { status: 404 });
  }
};