#!/usr/bin/env node

// The SIMPLEST possible remote MCP server
// Based on the official SDK patterns

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { 
  ListResourcesRequestSchema,
  ReadResourceRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import { createServer } from 'http';

const PORT = process.env.PORT || 3000;

// Create Express app
const app = express();

// CORS headers for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Parse JSON bodies
app.use(express.json());

// Create a single MCP server instance
const mcp = new Server({
  name: 'simple-mcp-server',
  version: '1.0.0'
}, {
  capabilities: {
    resources: {}
  }
});

// Add resource handlers
mcp.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'test://image.png',
        name: 'Test Image',
        mimeType: 'image/png'
      },
      {
        uri: 'test://data.csv', 
        name: 'Test CSV',
        mimeType: 'text/csv'
      }
    ]
  };
});

mcp.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  
  if (uri === 'test://image.png') {
    return {
      contents: [{
        uri: 'test://image.png',
        mimeType: 'image/png',
        // 1x1 red pixel PNG
        blob: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIA9l2+BgAAAABJRU5ErkJggg=='
      }]
    };
  }
  
  if (uri === 'test://data.csv') {
    return {
      contents: [{
        uri: 'test://data.csv',
        mimeType: 'text/csv',
        text: 'id,name,value\n1,Item A,100\n2,Item B,200'
      }]
    };
  }
  
  throw new Error(`Resource not found: ${uri}`);
});

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'MCP server is running',
    endpoint: '/sse'
  });
});

// SSE endpoint - this is where MCP clients connect
app.all('/sse', async (req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} /sse`);
  
  // SSEServerTransport handles everything
  const transport = new SSEServerTransport('/sse', res);
  await mcp.connect(transport);
  
  // Keep connection alive
  const keepAlive = setInterval(() => {
    if (res.writableEnded) {
      clearInterval(keepAlive);
    }
  }, 30000);
  
  req.on('close', () => {
    clearInterval(keepAlive);
    console.log(`[${new Date().toISOString()}] Client disconnected`);
  });
});

// Start server
const server = createServer(app);
server.listen(PORT, () => {
  console.log(`Simple MCP Server running on port ${PORT}`);
  console.log(`Connect to: http://localhost:${PORT}/sse`);
});