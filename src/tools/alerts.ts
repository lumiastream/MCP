import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { LumiaClient } from '../client.js';
import { toError, toResult } from './util.js';

export function registerAlerts(server: McpServer, client: LumiaClient): void {
	server.registerTool(
		'trigger_alert',
		{
			title: 'Trigger an alert',
			description: `Simulate a platform alert such as "twitch-follower", "twitch-subscriber", "twitch-bits", "youtube-superchat", or "kofi-donation". Use get_settings (options.alert.values) to see which alerts the user has configured. extraSettings can carry variables like { "username": "lumia", "bits": 1000 }.`,
			inputSchema: {
				name: z.string().describe('The alert type, e.g. "twitch-follower".'),
				extraSettings: z
					.record(z.string(), z.any())
					.optional()
					.describe('Variables for the alert variation/TTS, e.g. { "username": "lumia", "amount": 5 }.'),
			},
			annotations: { readOnlyHint: false, openWorldHint: true },
		},
		async ({ name, extraSettings }) => {
			try {
				const params: Record<string, unknown> = { value: name };
				if (extraSettings) params.extraSettings = extraSettings;
				return toResult(await client.send('alert', params));
			} catch (error) {
				return toError(error);
			}
		},
	);
}
