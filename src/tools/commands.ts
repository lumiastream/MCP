import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { LumiaClient } from '../client.js';
import { toError, toResult } from './util.js';

const COMMAND_KINDS = ['chat-command', 'chatbot-command', 'twitch-points', 'twitch-extension'] as const;

export function registerCommands(server: McpServer, client: LumiaClient): void {
	server.registerTool(
		'trigger_command',
		{
			title: 'Trigger a command',
			description: `Trigger one of the user's configured commands by name. "kind" selects which list it comes from: a chat command, a chatbot command, a Twitch channel-points reward, or a Twitch extension command. Use get_settings to see valid names.`,
			inputSchema: {
				name: z.string().describe('The command name, e.g. "blue". Must match one returned by get_settings.'),
				kind: z.enum(COMMAND_KINDS).default('chat-command').describe('Which command list the name belongs to.'),
				hold: z.boolean().optional().describe('If true, set this command as the new persistent default state.'),
				extraSettings: z
					.record(z.string(), z.any())
					.optional()
					.describe(`Extra variables like { "username": "lumia" } used inside the command's TTS/chatbot templates.`),
			},
			annotations: { readOnlyHint: false, openWorldHint: true },
		},
		async ({ name, kind, hold, extraSettings }) => {
			try {
				const params: Record<string, unknown> = { value: name };
				if (hold !== undefined) params.hold = hold;
				if (extraSettings) params.extraSettings = extraSettings;
				return toResult(await client.send(kind, params));
			} catch (error) {
				return toError(error);
			}
		},
	);
}
