#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { 
  ListResourcesRequestSchema, 
  ReadResourceRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import cors from 'cors';

const PORT = process.env.PORT || 3000;

// Create Express app
const app = express();
app.use(cors());

// Create MCP server
const mcpServer = new Server(
  {
    name: 'test-image-server',
    version: '1.0.0'
  },
  {
    capabilities: {
      resources: {}
    }
  }
);

// List resources handler
mcpServer.setRequestHandler(ListResourcesRequestSchema, async () => {
  console.error('Listing resources');
  return {
    resources: [
      {
        uri: 'image://test-png',
        name: 'Test PNG Image',
        description: 'A small test PNG image',
        mimeType: 'image/png'
      },
      {
        uri: 'csv://test-data',  
        name: 'Test CSV Data',
        description: 'Sample CSV data',
        mimeType: 'text/csv'
      }
    ]
  };
});

// Read resource handler
mcpServer.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  console.error('Reading resource:', request.params.uri);
  const { uri } = request.params;
  
  if (uri === 'image://test-png') {
    // Red 1x1 pixel PNG
    return {
      contents: [{
        uri: 'image://test-png',
        mimeType: 'image/png',
        blob: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
      }]
    };
  }
  
  if (uri === 'csv://test-data') {
    return {
      contents: [{
        uri: 'csv://test-data',
        mimeType: 'text/csv',
        text: 'id,name,value\n1,Item A,100\n2,Item B,200\n3,Item C,300'
      }]
    };
  }
  
  throw new Error(`Resource not found: ${uri}`);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Home page
app.get('/', (req, res) => {
  res.send('MCP Test Server - SSE endpoint at /sse');
});

// SSE endpoint
app.get('/sse', async (req, res) => {
  console.error('SSE connection established');
  const transport = new SSEServerTransport('/sse', res);
  await mcpServer.connect(transport);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`SSE endpoint: http://localhost:${PORT}/sse`);
});