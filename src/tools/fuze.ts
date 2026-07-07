import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { LumiaClient } from '../client.js';
import { toError, toResult } from './util.js';

export function registerFuze(server: McpServer, client: LumiaClient): void {
	server.registerTool(
		'control_fuze',
		{
			title: 'Control Fuze',
			description: `Start, stop, or toggle Fuze, or set its audio sensitivity (a value below 100 makes it less sensitive).`,
			inputSchema: {
				action: z.enum(['start', 'stop', 'toggle', 'sensitivity']).describe('Fuze action.'),
				sensitivity: z.number().min(0).optional().describe('For action "sensitivity": the value to set, e.g. 50.'),
			},
			annotations: { readOnlyHint: false },
		},
		async ({ action, sensitivity }) => {
			try {
				if (action === 'start') return toResult(await client.send('start-fuze', { value: true }));
				if (action === 'stop') return toResult(await client.send('stop-fuze', { value: false }));
				if (action === 'toggle') return toResult(await client.send('toggle-fuze', { value: null }));
				return toResult(await client.send('fuze-audio-sensitivity', { value: sensitivity ?? 100 }));
			} catch (error) {
				return toError(error);
			}
		},
	);
}
