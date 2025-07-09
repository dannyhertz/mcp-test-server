import fetch from 'node-fetch';

async function debugSSE() {
  const url = 'https://mcp-test-server-p506.onrender.com/sse';
  
  console.log('Sending POST to SSE endpoint...');
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'test-client',
            version: '1.0.0'
          }
        },
        id: 1
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    const reader = response.body;
    let buffer = '';
    
    reader.on('data', (chunk) => {
      buffer += chunk.toString();
      console.log('Received chunk:', chunk.toString());
      
      // Parse SSE events
      const lines = buffer.split('\n');
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i];
        if (line.startsWith('data: ')) {
          const data = line.substring(6);
          console.log('SSE Data:', data);
        }
      }
      buffer = lines[lines.length - 1];
    });
    
    reader.on('end', () => {
      console.log('Stream ended');
    });
    
    reader.on('error', (err) => {
      console.error('Stream error:', err);
    });
    
    // Wait for 10 seconds
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugSSE();