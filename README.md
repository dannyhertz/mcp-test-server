# MCP Test Server

A simple MCP (Model Context Protocol) server for testing CSV and image resource parsing.

## Features

- Serves CSV resources with sample data
- Serves image resources (PNG and JPEG) as base64-encoded blobs
- SSE (Server-Sent Events) transport for remote MCP communication
- Test page for debugging connections

## Resources Available

1. `csv://sample-data` - Basic CSV with user data
2. `csv://employees` - Employee information CSV
3. `image://test-image` - Small PNG image
4. `image://logo` - Small JPEG image

## Deploy to Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

1. Click the button above
2. Connect your GitHub account if needed
3. Create a new repository or use an existing one
4. Deploy!

Your MCP server will be available at: `https://your-app-name.onrender.com/sse`

## Local Development

```bash
npm install
npm start
```

Server runs on `http://localhost:3000`
- SSE endpoint: `http://localhost:3000/sse`
- Health check: `http://localhost:3000/health`
- Test page: `http://localhost:3000/`

## Connect Your MCP Client

Configure your MCP client to connect to:
- Local: `http://localhost:3000/sse`
- Deployed: `https://your-app-name.onrender.com/sse`

No authentication required.