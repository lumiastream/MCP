import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { loadConfig } from './config.js';
import { LumiaClient } from './client.js';
import { registerTools } from './tools/index.js';

export function buildServer(): McpServer {
	const config = loadConfig();
	const client = new LumiaClient(config);
	const server = new McpServer({ name: 'lumia-stream', version: '0.1.0' });
	registerTools(server, client);
	return server;
}
