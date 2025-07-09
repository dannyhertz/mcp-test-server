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

// Store active transports by session ID
const sessions = new Map();

// SSE endpoint - this is where MCP clients connect
app.all('/sse', async (req, res) => {
  const sessionId = req.query.sessionId;
  console.log(`[${new Date().toISOString()}] ${req.method} /sse${sessionId ? '?sessionId=' + sessionId : ''}`);
  
  try {
    // Create and store transport
    const transport = new SSEServerTransport('/sse', res);
    
    // If this is a session request, reuse the existing MCP connection
    if (sessionId && sessions.has(sessionId)) {
      console.log(`Reusing session ${sessionId}`);
    }
    
    // Connect transport to MCP server
    await mcp.connect(transport);
    
    // Store session if we got one
    const responseSessionId = res.getHeader('X-Session-ID');
    if (responseSessionId) {
      sessions.set(responseSessionId, transport);
    }
    
    // Clean up on disconnect
    req.on('close', () => {
      console.log(`[${new Date().toISOString()}] Client disconnected`);
      if (responseSessionId) {
        sessions.delete(responseSessionId);
      }
    });
    
  } catch (error) {
    console.error('SSE error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

// Start server
const server = createServer(app);
server.listen(PORT, () => {
  console.log(`Simple MCP Server running on port ${PORT}`);
  console.log(`Connect to: http://localhost:${PORT}/sse`);
});