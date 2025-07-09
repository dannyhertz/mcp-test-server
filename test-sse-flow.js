// Test the SSE flow manually
import fetch from 'node-fetch';

const BASE_URL = 'https://mcp-test-server-p506.onrender.com';

async function testSSEFlow() {
  console.log('1. Testing initial POST to /sse...');
  
  // Step 1: POST to /sse to get session
  const initResponse = await fetch(`${BASE_URL}/sse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  
  console.log('Response status:', initResponse.status);
  console.log('Content-Type:', initResponse.headers.get('content-type'));
  
  // Read the SSE response
  const reader = initResponse.body;
  let buffer = '';
  
  const readChunk = new Promise((resolve) => {
    reader.on('data', (chunk) => {
      buffer += chunk.toString();
      console.log('Received:', chunk.toString());
      
      // Look for session endpoint
      const match = buffer.match(/data: (\/sse\?sessionId=[^\n]+)/);
      if (match) {
        resolve(match[1]);
      }
    });
    
    setTimeout(() => resolve(null), 5000);
  });
  
  const sessionEndpoint = await readChunk;
  console.log('\n2. Got session endpoint:', sessionEndpoint);
  
  if (!sessionEndpoint) {
    console.error('Failed to get session endpoint');
    return;
  }
  
  // Step 2: POST to session endpoint with initialize
  console.log('\n3. Sending initialize to session endpoint...');
  const initRequest = {
    jsonrpc: '2.0',
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test-client', version: '1.0.0' }
    },
    id: 1
  };
  
  const sessionResponse = await fetch(`${BASE_URL}${sessionEndpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(initRequest)
  });
  
  console.log('Session response status:', sessionResponse.status);
  console.log('Session response type:', sessionResponse.headers.get('content-type'));
  
  // Read response
  const sessionData = await new Promise((resolve) => {
    let data = '';
    sessionResponse.body.on('data', (chunk) => {
      data += chunk.toString();
    });
    sessionResponse.body.on('end', () => resolve(data));
    setTimeout(() => resolve(data), 2000);
  });
  
  console.log('Session response:', sessionData);
}

testSSEFlow().catch(console.error);