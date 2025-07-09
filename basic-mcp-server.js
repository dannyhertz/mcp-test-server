#!/usr/bin/env node

// Basic MCP server that handles the SSE protocol manually
import express from 'express';
import cors from 'cors';
import { randomUUID } from 'crypto';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Store sessions
const sessions = new Map();

// MCP Resources
const resources = [
  {
    uri: 'image://test.png',
    name: 'Test Image',
    description: 'A test PNG image',
    mimeType: 'image/png'
  },
  {
    uri: 'csv://test.csv',
    name: 'Test CSV',
    description: 'Sample CSV data',
    mimeType: 'text/csv'
  }
];

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'Basic MCP Server',
    endpoint: '/sse'
  });
});

// Handle all POST requests to /sse
app.post('/sse', async (req, res) => {
  const sessionId = req.query.sessionId;
  
  if (!sessionId || !sessions.has(sessionId)) {
    // No session ID means this is an initial connection
    const newSessionId = randomUUID();
    sessions.set(newSessionId, { created: new Date() });
    
    console.log(`[${new Date().toISOString()}] New session: ${newSessionId}`);
    
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    
    res.write(`event: endpoint\ndata: /sse?sessionId=${newSessionId}\n\n`);
    res.end();
    return;
  }
  
  console.log(`[${new Date().toISOString()}] Request to session ${sessionId}:`, req.body.method);
  
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  
  const { method, params, id } = req.body;
  
  // Handle MCP methods
  if (method === 'initialize') {
    const response = {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          resources: {}
        },
        serverInfo: {
          name: 'basic-mcp-server',
          version: '1.0.0'
        }
      }
    };
    res.write(`data: ${JSON.stringify(response)}\n\n`);
  }
  else if (method === 'resources/list') {
    const response = {
      jsonrpc: '2.0',
      id,
      result: { resources }
    };
    res.write(`data: ${JSON.stringify(response)}\n\n`);
  }
  else if (method === 'resources/read') {
    const { uri } = params;
    let result;
    
    if (uri === 'image://test.png') {
      result = {
        contents: [{
          uri,
          mimeType: 'image/png',
          blob: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIA9l2+BgAAAABJRU5ErkJggg=='
        }]
      };
    } else if (uri === 'csv://test.csv') {
      result = {
        contents: [{
          uri,
          mimeType: 'text/csv',
          text: 'id,name,value\n1,Test A,100\n2,Test B,200'
        }]
      };
    } else {
      result = {
        error: {
          code: -32602,
          message: `Resource not found: ${uri}`
        }
      };
    }
    
    const response = {
      jsonrpc: '2.0',
      id,
      result
    };
    res.write(`data: ${JSON.stringify(response)}\n\n`);
  }
  else {
    const response = {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32601,
        message: `Method not found: ${method}`
      }
    };
    res.write(`data: ${JSON.stringify(response)}\n\n`);
  }
  
  res.end();
});

// GET requests to session endpoint (for SSE stream)
app.get('/sse', (req, res) => {
  const sessionId = req.query.sessionId;
  
  if (!sessionId) {
    res.status(400).send('Session ID required');
    return;
  }
  
  console.log(`[${new Date().toISOString()}] SSE stream opened for session ${sessionId}`);
  
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  
  // Keep alive
  const keepAlive = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 30000);
  
  req.on('close', () => {
    clearInterval(keepAlive);
    console.log(`[${new Date().toISOString()}] SSE stream closed for session ${sessionId}`);
  });
});

app.listen(PORT, () => {
  console.log(`Basic MCP Server running on port ${PORT}`);
  console.log(`Connect to: http://localhost:${PORT}/sse`);
});