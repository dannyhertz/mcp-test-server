import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'MCP server is running' });
});

// Home page
app.get('/', (req, res) => {
  res.send(`
    <h1>MCP Test Server</h1>
    <p>This server provides image and CSV resources via MCP</p>
    <p>SSE Transport: Connect your MCP client to <code>${req.protocol}://${req.get('host')}/</code></p>
  `);
});

// Create a new MCP server for each connection
const sessions = new Map();

// Handle SSE connections
app.post('/', async (req, res) => {
  console.log('New MCP connection initiated');
  
  // Create a new MCP server instance for this connection
  const mcpServer = new Server({
    name: 'mcp-test-server',
    version: '1.0.0'
  }, {
    capabilities: {
      resources: {}
    }
  });

  // Handle list resources
  mcpServer.setRequestHandler('resources/list', async () => {
    console.log('Listing resources');
    return {
      resources: [
        {
          uri: 'image://red-pixel',
          name: 'Red Pixel',
          description: 'A 1x1 red pixel PNG image',
          mimeType: 'image/png'
        },
        {
          uri: 'csv://sample-data',
          name: 'Sample Data',
          description: 'Sample CSV data with 3 rows',
          mimeType: 'text/csv'
        }
      ]
    };
  });

  // Handle read resource
  mcpServer.setRequestHandler('resources/read', async (request) => {
    console.log('Reading resource:', request.params.uri);
    const { uri } = request.params;
    
    if (uri === 'image://red-pixel') {
      // 1x1 red pixel PNG (base64)
      return {
        contents: [{
          uri: 'image://red-pixel',
          mimeType: 'image/png',
          blob: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIA9l2+BgAAAABJRU5ErkJggg=='
        }]
      };
    }
    
    if (uri === 'csv://sample-data') {
      return {
        contents: [{
          uri: 'csv://sample-data',
          mimeType: 'text/csv',
          text: 'id,name,value\n1,Alice,100\n2,Bob,200\n3,Charlie,300'
        }]
      };
    }
    
    throw new Error(`Resource not found: ${uri}`);
  });

  try {
    const transport = new SSEServerTransport('/', res);
    await mcpServer.connect(transport);
    console.log('MCP connection established');
  } catch (error) {
    console.error('Failed to establish MCP connection:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to establish connection' });
    }
  }
});

app.listen(PORT, () => {
  console.log(`MCP server listening on port ${PORT}`);
  console.log(`Connect via: http://localhost:${PORT}/`);
});