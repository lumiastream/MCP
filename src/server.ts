import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { loadConfig } from './config.js';
import { LumiaClient } from './client.js';
import { LumiaEventStream } from './eventStream.js';
import { registerTools } from './tools/index.js';
import { registerRealtime } from './tools/realtime.js';
import { registerPrompts } from './prompts.js';

export function buildServer(): { server: McpServer; eventStream: LumiaEventStream } {
	const config = loadConfig();
	const client = new LumiaClient(config);
	const eventStream = new LumiaEventStream(config);
	const server = new McpServer({ name: 'lumia-stream', version: '0.2.0' });
	registerTools(server, client);
	registerRealtime(server, eventStream);
	registerPrompts(server);
	return { server, eventStream };
}
