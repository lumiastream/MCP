import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
	command: 'node',
	args: ['dist/index.js'],
	cwd: process.cwd(),
	env: { ...process.env, LUMIA_TOKEN: process.env.LUMIA_TOKEN || 'smoke-test-token' },
});

const client = new Client({ name: 'smoke', version: '0.0.0' });
await client.connect(transport);

const tools = await client.listTools();
console.log('TOOLS (' + tools.tools.length + '):', tools.tools.map((t) => t.name).sort().join(', '));

const resources = await client.listResources();
console.log('RESOURCES:', resources.resources.map((r) => r.uri).join(', '));

const prompts = await client.listPrompts();
console.log('PROMPTS (' + prompts.prompts.length + '):', prompts.prompts.map((p) => p.name).sort().join(', '));

const call = await client.callTool({ name: 'get_settings', arguments: {} });
console.log('get_settings isError:', call.isError === true);
console.log('get_settings text:', String(call.content?.[0]?.text ?? '').slice(0, 140));

await client.close();
console.log('OK');
