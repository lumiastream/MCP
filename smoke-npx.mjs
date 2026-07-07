import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function tryForm(label, command, args) {
	const transport = new StdioClientTransport({
		command,
		args,
		env: { ...process.env, LUMIA_TOKEN: process.env.LUMIA_TOKEN || 'smoke-test-token' },
	});
	const client = new Client({ name: 'smoke-npx', version: '0.0.0' });
	try {
		await client.connect(transport);
		const tools = await client.listTools();
		console.log(`[PASS] ${label} -> ${tools.tools.length} tools`);
		await client.close();
	} catch (error) {
		console.log(`[FAIL] ${label} -> ${error instanceof Error ? error.message : String(error)}`);
		try {
			await client.close();
		} catch {}
	}
}

await tryForm('A: npx -y @lumiastream/mcp', 'npx', ['-y', '@lumiastream/mcp']);
await tryForm('B: npx -y -p @lumiastream/mcp lumia-mcp', 'npx', ['-y', '-p', '@lumiastream/mcp', 'lumia-mcp']);
