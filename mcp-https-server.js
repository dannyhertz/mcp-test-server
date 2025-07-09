#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { ListResourcesRequestSchema, ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import cors from 'cors';
import https from 'https';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3443;

// Enable CORS for all origins
app.use(cors());

// Create server instance
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

// Create SSE endpoint
app.get('/sse', async (req, res) => {
  console.log('Client connected to SSE endpoint');
  const transport = new SSEServerTransport('/sse', res);
  await mcpServer.connect(transport);
  
  // Handle client disconnect
  req.on('close', () => {
    console.log('Client disconnected');
    transport.close();
  });
});

// Serve test page
app.get('/', (req, res) => {
  res.sendFile('test.html', { root: '.' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', server: 'test-mcp-server', version: '1.0.0' });
});

// Read SSL certificates
const privateKey = fs.readFileSync('key.pem', 'utf8');
const certificate = fs.readFileSync('cert.pem', 'utf8');
const credentials = { key: privateKey, cert: certificate };

// Create HTTPS server
const httpsServer = https.createServer(credentials, app);

// Start the server
httpsServer.listen(PORT, () => {
  console.log(`MCP HTTPS Server running on https://localhost:${PORT}`);
  console.log(`SSE endpoint: https://localhost:${PORT}/sse`);
  console.log(`Health check: https://localhost:${PORT}/health`);
  console.log('\nNote: Using self-signed certificate. Your client may need to allow insecure connections.');
});