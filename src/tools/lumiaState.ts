import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { LumiaClient } from '../client.js';
import { toError, toResult } from './util.js';

export function registerLumiaState(server: McpServer, client: LumiaClient): void {
	server.registerTool(
		'set_lumia_state',
		{
			title: 'Start/stop Lumia',
			description: `Turn Lumia's light control on or off, toggle it, or reset all lights to their default state.`,
			inputSchema: {
				action: z
					.enum(['on', 'off', 'toggle', 'default'])
					.describe('on = start Lumia, off = stop Lumia, toggle = flip current state, default = reset lights to default.'),
			},
			annotations: { readOnlyHint: false },
		},
		async ({ action }) => {
			try {
				if (action === 'on') return toResult(await client.send('start-lumia', { value: true }));
				if (action === 'off') return toResult(await client.send('stop-lumia', { value: false }));
				if (action === 'toggle') return toResult(await client.send('set-lumia', { value: null }));
				return toResult(await client.send('to-default', {}));
			} catch (error) {
				return toError(error);
			}
		},
	);

	server.registerTool(
		'set_stream_mode',
		{
			title: 'Set stream mode',
			description: `Turn Lumia Stream Mode on or off, or toggle it.`,
			inputSchema: {
				mode: z.enum(['on', 'off', 'toggle']).describe('Turn stream mode on, off, or toggle it.'),
			},
			annotations: { readOnlyHint: false },
		},
		async ({ mode }) => {
			try {
				const value = mode === 'on' ? true : mode === 'off' ? false : null;
				return toResult(await client.send('toggle-stream-mode', { value }));
			} catch (error) {
				return toError(error);
			}
		},
	);
}
