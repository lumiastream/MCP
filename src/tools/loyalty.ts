import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { LumiaClient } from '../client.js';
import { toError, toResult } from './util.js';

export function registerLoyalty(server: McpServer, client: LumiaClient): void {
	server.registerTool(
		'loyalty_points',
		{
			title: 'Add/remove loyalty points',
			description: `Add or remove a viewer's loyalty points. Use a negative amount to remove points.`,
			inputSchema: {
				username: z.string().describe('The viewer username.'),
				amount: z.number().describe('Points to add; use a negative number to remove.'),
				platform: z.enum(['twitch', 'youtube', 'facebook', 'kick', 'tiktok']).default('twitch').describe('The platform the viewer is on.'),
			},
			annotations: { readOnlyHint: false, openWorldHint: true },
		},
		async ({ username, amount, platform }) => {
			try {
				return toResult(await client.send('add-loyalty-points', { value: amount, username, platform }));
			} catch (error) {
				return toError(error);
			}
		},
	);

	server.registerTool(
		'get_loyalty_points',
		{
			title: 'Get loyalty points',
			description: `Read a viewer's current loyalty points balance. To change it, use loyalty_points.`,
			inputSchema: {
				username: z.string().describe('The viewer username.'),
				platform: z.enum(['twitch', 'youtube', 'facebook', 'kick', 'tiktok']).default('twitch').describe('The platform the viewer is on.'),
			},
			annotations: { readOnlyHint: true },
		},
		async ({ username, platform }) => {
			try {
				const res = await client.send('get-loyalty-points', { username, platform });
				const points = (res as { message?: unknown }).message ?? null;
				return toResult({ username, platform, points });
			} catch (error) {
				return toError(error);
			}
		},
	);
}
