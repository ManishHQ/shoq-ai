import { spawn } from 'child_process';

// Test the MCP server
const mcpProcess = spawn('node', ['dist/mcp-server.js'], {
  stdio: ['pipe', 'pipe', 'inherit']
});

// Send list tools request
const listToolsRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/list'
};

mcpProcess.stdin.write(JSON.stringify(listToolsRequest) + '\n');

// Send get_server_stats tool call
const toolCallRequest = {
  jsonrpc: '2.0',
  id: 2,
  method: 'tools/call',
  params: {
    name: 'get_server_stats',
    arguments: {}
  }
};

setTimeout(() => {
  mcpProcess.stdin.write(JSON.stringify(toolCallRequest) + '\n');
}, 1000);

mcpProcess.stdout.on('data', (data) => {
  console.log('Response:', data.toString());
});

// Close after 5 seconds
setTimeout(() => {
  mcpProcess.kill();
}, 5000);