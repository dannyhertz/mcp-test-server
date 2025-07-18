import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { 
  ListResourcesRequestSchema,
  ReadResourceRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// Create a single MCP server instance
const mcpServer = new Server({
  name: 'mcp-image-test',
  version: '1.0.0'
}, {
  capabilities: {
    resources: {}
  }
});

// Set up resource handlers
mcpServer.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'image://test-image',
        name: 'Test Image',
        description: 'A test PNG image',
        mimeType: 'image/png'
      },
      {
        uri: 'csv://test-csv',
        name: 'Test CSV',
        description: 'Sample CSV data',
        mimeType: 'text/csv'
      }
    ]
  };
});

mcpServer.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  
  if (uri === 'image://test-image') {
    // Red pixel PNG
    return {
      contents: [{
        uri,
        mimeType: 'image/png',
        blob: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIA9l2+BgAAAABJRU5ErkJggg=='
      }]
    };
  }
  
  if (uri === 'csv://test-csv') {
    return {
      contents: [{
        uri,
        mimeType: 'text/csv',
        text: 'name,value\nTest 1,100\nTest 2,200'
      }]
    };
  }
  
  throw new Error(`Unknown resource: ${uri}`);
});

// Health check
app.get('/', (req, res) => {
  res.json({ 
    name: 'mcp-image-test',
    mcp: {
      endpoint: `${req.protocol}://${req.get('host')}/mcp`,
      transport: 'sse'
    }
  });
});

// SSE endpoint - exactly as MCP SDK expects
app.all('/mcp', async (req, res) => {
  const transport = new SSEServerTransport('/mcp', res);
  await mcpServer.connect(transport);
});

app.listen(PORT, () => {
  console.log(`MCP Image Test Server v2 running on port ${PORT}`);
  console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
  console.log(`Deployed at: ${new Date().toISOString()}`);
});