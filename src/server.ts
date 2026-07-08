import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { loadConfig, type LumiaConfig } from './config.js';
import { LumiaClient } from './client.js';
import { LumiaEventStream } from './eventStream.js';
import { registerTools } from './tools/index.js';
import { registerRealtime } from './tools/realtime.js';
import { registerPrompts } from './prompts.js';

export { LumiaClient } from './client.js';
export { LumiaEventStream } from './eventStream.js';
export { loadConfig } from './config.js';
export type { LumiaConfig } from './config.js';

export interface BuildServerOptions {
	config?: Partial<LumiaConfig>;
	eventStream?: LumiaEventStream;
}

export function buildServer(options: BuildServerOptions = {}): { server: McpServer; eventStream: LumiaEventStream } {
	const config = { ...loadConfig(), ...options.config };
	const client = new LumiaClient(config);
	const eventStream = options.eventStream ?? new LumiaEventStream(config);
	const server = new McpServer({ name: 'lumia-stream', version: '0.4.0' });
	registerTools(server, client);
	registerRealtime(server, eventStream);
	registerPrompts(server);
	return { server, eventStream };
}
