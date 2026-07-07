import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { LumiaClient } from '../client.js';
import { toError, toResult } from './util.js';

export function registerSettings(server: McpServer, client: LumiaClient): void {
	server.registerResource(
		'settings',
		'lumia://settings',
		{
			title: 'Lumia Stream settings',
			description: `The current user's available commands, alerts, connected lights, studio scenes/themes/animations, and TTS voices.`,
			mimeType: 'application/json',
		},
		async (uri) => {
			const data = await client.retrieve();
			return {
				contents: [
					{
						uri: uri.href,
						mimeType: 'application/json',
						text: JSON.stringify(data, null, 2),
					},
				],
			};
		},
	);

	server.registerTool(
		'get_settings',
		{
			title: 'Get Lumia settings',
			description: `Retrieve what this Lumia Stream user actually has set up: chat/points/extension commands, available alerts, connected lights, studio scenes, themes, animations, and TTS voices. Call this first to discover valid values for the other tools, since every user's setup differs.`,
			inputSchema: {},
			annotations: { readOnlyHint: true, openWorldHint: true },
		},
		async () => {
			try {
				return toResult(await client.retrieve());
			} catch (error) {
				return toError(error);
			}
		},
	);
}
