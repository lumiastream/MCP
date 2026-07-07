#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { buildServer } from './server.js';

async function main(): Promise<void> {
	const { server, eventStream } = buildServer();
	eventStream.start();
	const transport = new StdioServerTransport();
	await server.connect(transport);
	process.stderr.write('Lumia Stream MCP server running on stdio\n');
}

main().catch((error) => {
	process.stderr.write(`Fatal: ${error instanceof Error ? error.message : String(error)}\n`);
	process.exit(1);
});
