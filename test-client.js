import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

const url = process.argv[2] || 'https://mcp-test-server-p506.onrender.com/mcp';

console.log(`Testing MCP server at: ${url}`);

const client = new Client({
  name: 'test-client',
  version: '1.0.0'
}, {
  capabilities: {}
});

try {
  const transport = new SSEClientTransport(new URL(url));
  await client.connect(transport);
  
  console.log('Connected! Server info:', client.getServerInfo());
  
  // List resources
  const resources = await client.listResources();
  console.log('\nResources:', resources);
  
  // Read image
  const image = await client.readResource({ uri: 'image://red-pixel' });
  console.log('\nImage resource:', {
    uri: image.contents[0].uri,
    mimeType: image.contents[0].mimeType,
    blobLength: image.contents[0].blob?.length
  });
  
  // Read CSV
  const csv = await client.readResource({ uri: 'csv://sample-data' });
  console.log('\nCSV resource:', {
    uri: csv.contents[0].uri,
    mimeType: csv.contents[0].mimeType,
    text: csv.contents[0].text
  });
  
  await client.close();
  console.log('\nTest completed successfully!');
  
} catch (error) {
  console.error('Test failed:', error);
  process.exit(1);
}