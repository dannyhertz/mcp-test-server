#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { ListResourcesRequestSchema, ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// Store active sessions
const sessions = new Map();

// Create MCP server instance
const createMcpServer = () => {
  const mcpServer = new Server(
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

  // Handle list resources
  mcpServer.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: [
        {
          uri: 'csv://sample-data',
          name: 'Sample CSV Data',
          description: 'A sample CSV file with test data',
          mimeType: 'text/csv'
        },
        {
          uri: 'image://test-image',
          name: 'Test Image',
          description: 'A sample test image',
          mimeType: 'image/png'
        },
        {
          uri: 'csv://employees',
          name: 'Employee Data',
          description: 'Employee information in CSV format',
          mimeType: 'text/csv'
        },
        {
          uri: 'image://logo',
          name: 'Company Logo',
          description: 'Company logo image',
          mimeType: 'image/jpeg'
        }
      ]
    };
  });

  // Handle read resource
  mcpServer.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    
    if (uri === 'csv://sample-data') {
      return {
        contents: [
          {
            uri: 'csv://sample-data',
            mimeType: 'text/csv',
            text: `id,name,age,city
1,John Doe,30,New York
2,Jane Smith,25,Los Angeles
3,Bob Johnson,35,Chicago
4,Alice Williams,28,Houston
5,Charlie Brown,32,Phoenix`
          }
        ]
      };
    }
    
    if (uri === 'csv://employees') {
      return {
        contents: [
          {
            uri: 'csv://employees',
            mimeType: 'text/csv',
            text: `employee_id,first_name,last_name,department,salary,hire_date
E001,Michael,Scott,Management,75000,2005-03-15
E002,Dwight,Schrute,Sales,65000,2005-03-15
E003,Jim,Halpert,Sales,62000,2005-10-01
E004,Pam,Beesly,Reception,40000,2005-03-15
E005,Stanley,Hudson,Sales,60000,2003-02-05`
          }
        ]
      };
    }
    
    if (uri === 'image://test-image') {
      // Create a simple 1x1 pixel PNG base64 encoded
      const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
      return {
        contents: [
          {
            uri: 'image://test-image',
            mimeType: 'image/png',
            blob: pngBase64
          }
        ]
      };
    }
    
    if (uri === 'image://logo') {
      // Create a simple 2x2 pixel JPEG base64 encoded
      const jpegBase64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAACAAIDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=';
      return {
        contents: [
          {
            uri: 'image://logo',
            mimeType: 'image/jpeg',
            blob: jpegBase64
          }
        ]
      };
    }
    
    throw new Error(`Resource not found: ${uri}`);
  });

  return mcpServer;
};

// Root endpoint with test page
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head>
    <title>MCP Server Test</title>
</head>
<body>
    <h1>MCP Test Server</h1>
    <p>SSE endpoint: ${req.protocol}://${req.get('host')}/sse</p>
    <p>Server is running!</p>
</body>
</html>`);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', server: 'test-mcp-server', version: '1.0.0' });
});

// POST /sse - Initial connection, returns session endpoint
app.post('/sse', (req, res) => {
  const sessionId = uuidv4();
  const sessionUrl = `/sse?sessionId=${sessionId}`;
  
  console.log(`Creating new session: ${sessionId}`);
  sessions.set(sessionId, { created: new Date() });
  
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  
  res.write(`event: endpoint\ndata: ${sessionUrl}\n\n`);
  res.end();
});

// GET /sse?sessionId=xxx - Actual SSE connection
app.get('/sse', async (req, res) => {
  const sessionId = req.query.sessionId;
  
  if (!sessionId) {
    return res.status(400).send('Session ID required');
  }
  
  if (!sessions.has(sessionId)) {
    return res.status(404).send('Session not found');
  }
  
  console.log(`Client connected to session: ${sessionId}`);
  
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  
  // Create MCP server for this session
  const mcpServer = createMcpServer();
  const transport = new SSEServerTransport(req.url, res);
  
  await mcpServer.connect(transport);
  
  // Handle client disconnect
  req.on('close', () => {
    console.log(`Client disconnected from session: ${sessionId}`);
    sessions.delete(sessionId);
    transport.close();
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`MCP HTTP Server (with SSE) running on port ${PORT}`);
  console.log(`SSE endpoint available at: /sse`);
  console.log(`Health check available at: /health`);
  console.log(`Test page available at: /`);
});