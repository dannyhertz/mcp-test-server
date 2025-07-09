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
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Create MCP server
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
  console.log('[MCP] Listing resources');
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
  console.log('[MCP] Reading resource:', request.params.uri);
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
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    name: 'mcp-image-test',
    sse_endpoint: `${req.protocol}://${req.get('host')}/sse`
  });
});

// The key insight: SSEServerTransport expects to handle BOTH the initial connection AND message posting
// So we need to let it manage the entire flow through a single endpoint
const sseHandler = async (req, res) => {
  console.log(`[SSE] ${req.method} request received`);
  
  try {
    // Create transport with the base path
    const transport = new SSEServerTransport('/sse', res);
    
    // Connect the transport to our server
    await mcpServer.connect(transport);
    
    console.log('[SSE] MCP server connected via SSE transport');
    
    // The transport will handle the rest:
    // - For GET/POST without body: sends SSE stream with session endpoint
    // - For POST with body: processes the message
    
  } catch (error) {
    console.error('[SSE] Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to establish SSE connection' });
    }
  }
};

// SSE endpoint - handles both GET and POST
app.get('/sse', sseHandler);
app.post('/sse', sseHandler);

// Also handle requests with session IDs
app.get('/sse/:sessionId', sseHandler);
app.post('/sse/:sessionId', sseHandler);

app.listen(PORT, () => {
  console.log(`MCP SSE Server running on port ${PORT}`);
  console.log(`Connect to: http://localhost:${PORT}/sse`);
});