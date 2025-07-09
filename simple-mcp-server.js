#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  ListResourcesRequestSchema, 
  ReadResourceRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';

// Create server
const server = new Server(
  {
    name: 'test-mcp-server',
    version: '1.0.0'
  },
  {
    capabilities: {
      resources: {}
    }
  }
);

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'test://image',
        name: 'Test Image',
        description: 'A simple test image',
        mimeType: 'image/png'
      },
      {
        uri: 'test://csv',
        name: 'Test CSV',
        description: 'Sample CSV data',
        mimeType: 'text/csv'
      }
    ]
  };
});

// Read resource content
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  
  if (uri === 'test://image') {
    // 1x1 red pixel PNG
    return {
      contents: [{
        uri: 'test://image',
        mimeType: 'image/png',
        blob: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIA+v2VCwAAAABJRU5ErkJggg=='
      }]
    };
  }
  
  if (uri === 'test://csv') {
    return {
      contents: [{
        uri: 'test://csv',
        mimeType: 'text/csv',
        text: 'name,age\nAlice,30\nBob,25'
      }]
    };
  }
  
  throw new Error(`Unknown resource: ${uri}`);
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP server running on stdio');
}

main().catch(console.error);