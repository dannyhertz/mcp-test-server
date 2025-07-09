#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { ListResourcesRequestSchema, ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

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

// Serve test page
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head>
    <title>MCP Server Test</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
        }
        .status {
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
        }
        .success {
            background-color: #d4edda;
            color: #155724;
        }
        .error {
            background-color: #f8d7da;
            color: #721c24;
        }
        pre {
            background-color: #f5f5f5;
            padding: 10px;
            border-radius: 5px;
            overflow-x: auto;
        }
        button {
            margin: 5px;
            padding: 10px 20px;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <h1>MCP Server Test Page</h1>
    
    <div id="status"></div>
    
    <h2>Server Info</h2>
    <p>Server: <span id="server-url"></span></p>
    <p>SSE Endpoint: <span id="sse-url"></span></p>
    
    <h2>Tests</h2>
    <button onclick="testHealth()">Test Health Endpoint</button>
    <button onclick="testSSE()">Test SSE Connection</button>
    
    <h2>Output</h2>
    <pre id="output"></pre>

    <script>
        const serverUrl = window.location.origin;
        document.getElementById('server-url').textContent = serverUrl;
        document.getElementById('sse-url').textContent = serverUrl + '/sse';
        
        function log(message, isError = false) {
            const output = document.getElementById('output');
            const timestamp = new Date().toISOString();
            output.textContent += \`[\${timestamp}] \${message}\\n\`;
            if (isError) {
                console.error(message);
            } else {
                console.log(message);
            }
        }
        
        function setStatus(message, isError = false) {
            const status = document.getElementById('status');
            status.className = 'status ' + (isError ? 'error' : 'success');
            status.textContent = message;
        }
        
        async function testHealth() {
            try {
                log('Testing health endpoint...');
                const response = await fetch(\`\${serverUrl}/health\`);
                const data = await response.json();
                log('Health check response: ' + JSON.stringify(data, null, 2));
                setStatus('Health check successful!');
            } catch (error) {
                log('Health check failed: ' + error.message, true);
                setStatus('Health check failed: ' + error.message, true);
            }
        }
        
        function testSSE() {
            log('Testing SSE connection...');
            const eventSource = new EventSource(\`\${serverUrl}/sse\`);
            
            eventSource.onopen = () => {
                log('SSE connection opened');
                setStatus('SSE connection established!');
            };
            
            eventSource.onmessage = (event) => {
                log('SSE message received: ' + event.data);
            };
            
            eventSource.onerror = (error) => {
                log('SSE error occurred', true);
                setStatus('SSE connection error', true);
                eventSource.close();
            };
            
            // Close after 5 seconds
            setTimeout(() => {
                eventSource.close();
                log('SSE connection closed');
            }, 5000);
        }
        
        // Initial test
        window.onload = () => {
            log('Page loaded. Server URL: ' + serverUrl);
            log('SSE endpoint: ' + serverUrl + '/sse');
            log('Click buttons to test endpoints.');
        };
    </script>
</body>
</html>`);
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', server: 'test-mcp-server', version: '1.0.0' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`MCP HTTP Server (with SSE) running on port ${PORT}`);
  console.log(`SSE endpoint available at: /sse`);
  console.log(`Health check available at: /health`);
  console.log(`Test page available at: /`);
});