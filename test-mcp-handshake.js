#!/usr/bin/env node
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

const SERVER_URL = process.argv[2] || 'https://mcp-test-server-p506.onrender.com/sse';

async function testMCPHandshake() {
  console.log(`Testing MCP handshake with: ${SERVER_URL}`);
  
  try {
    // Create SSE transport
    const transport = new SSEClientTransport(new URL(SERVER_URL));
    
    // Create client
    const client = new Client({
      name: 'test-client',
      version: '1.0.0'
    }, {
      capabilities: {}
    });

    // Connect
    console.log('\n1. Connecting to server...');
    await client.connect(transport);
    console.log('✅ Connected successfully');

    // The connection automatically performs initialization
    console.log('\n2. Server info:');
    console.log(`   Name: ${client.getServerInfo().name}`);
    console.log(`   Version: ${client.getServerInfo().version}`);
    
    // List resources
    console.log('\n3. Listing available resources...');
    const resources = await client.listResources();
    console.log(`✅ Found ${resources.resources.length} resources:`);
    resources.resources.forEach(resource => {
      console.log(`   - ${resource.uri} (${resource.mimeType}): ${resource.name}`);
    });

    // Read a CSV resource
    console.log('\n4. Reading CSV resource...');
    const csvResource = await client.readResource({ uri: 'csv://sample-data' });
    console.log('✅ CSV data received:');
    console.log(csvResource.contents[0].text.split('\n').slice(0, 3).join('\n') + '\n   ...');

    // Read an image resource
    console.log('\n5. Reading image resource...');
    const imageResource = await client.readResource({ uri: 'image://test-image' });
    console.log('✅ Image data received:');
    console.log(`   MIME type: ${imageResource.contents[0].mimeType}`);
    console.log(`   Blob length: ${imageResource.contents[0].blob.length} characters`);
    console.log(`   Blob preview: ${imageResource.contents[0].blob.substring(0, 50)}...`);

    // Close connection
    console.log('\n6. Closing connection...');
    await client.close();
    console.log('✅ Connection closed');
    
    console.log('\n🎉 All tests passed! MCP server is working correctly.');
    
  } catch (error) {
    console.error('\n❌ Error during handshake test:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
    process.exit(1);
  }
}

testMCPHandshake();