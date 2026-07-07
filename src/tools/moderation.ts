import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { LumiaClient } from '../client.js';
import { toError, toResult } from './util.js';

const MOD_TYPES = { ban: 'ban-user', unban: 'unban-user', timeout: 'timeout-user', vip: 'add-vip', unvip: 'remove-vip' } as const;

export function registerModeration(server: McpServer, client: LumiaClient): void {
	server.registerTool(
		'moderate_user',
		{
			title: 'Moderate a user',
			description: `Ban, unban, or time out a user, or grant/remove VIP. Ban/unban/timeout work on Twitch and YouTube; VIP is Twitch only. For "timeout", set duration_minutes and optionally a reason.`,
			inputSchema: {
				action: z.enum(['ban', 'unban', 'timeout', 'vip', 'unvip']).describe('Moderation action.'),
				username: z.string().describe('The target username.'),
				platform: z.enum(['twitch', 'youtube']).default('twitch').describe('Platform (VIP is Twitch only).'),
				duration_minutes: z.number().min(1).optional().describe('For "timeout": how many minutes.'),
				reason: z.string().optional().describe('For "timeout": the reason to show.'),
			},
			annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true },
		},
		async ({ action, username, platform, duration_minutes, reason }) => {
			try {
				const params: Record<string, unknown> = { value: username, platform };
				if (action === 'timeout') {
					if (duration_minutes !== undefined) params.duration = duration_minutes;
					if (reason !== undefined) params.name = reason;
				}
				return toResult(await client.send(MOD_TYPES[action], params));
			} catch (error) {
				return toError(error);
			}
		},
	);

	server.registerTool(
		'delete_message',
		{
			title: 'Delete a chat message',
			description: `Delete a specific chat message by its message id.`,
			inputSchema: {
				message_id: z.string().describe('The id of the message to delete.'),
				platform: z.enum(['twitch', 'youtube']).default('twitch').describe('Platform.'),
			},
			annotations: { readOnlyHint: false, destructiveHint: true },
		},
		async ({ message_id, platform }) => {
			try {
				return toResult(await client.send('delete-message', { value: message_id, platform }));
			} catch (error) {
				return toError(error);
			}
		},
	);

	server.registerTool(
		'translate_message',
		{
			title: 'Translate a message to chat',
			description: `Translate a message into a target language and post it to chat. "language" is a code like "en", "es", or "fr".`,
			inputSchema: {
				message: z.string().describe('The message to translate.'),
				language: z.string().describe('Target language code, e.g. "en".'),
				platform: z.enum(['twitch', 'youtube', 'facebook']).default('twitch').describe('Platform.'),
				username: z.string().optional().describe('Optional username to attribute the message to.'),
			},
			annotations: { readOnlyHint: false, openWorldHint: true },
		},
		async ({ message, language, platform, username }) => {
			try {
				const params: Record<string, unknown> = { value: message, language, platform };
				if (username) params.username = username;
				return toResult(await client.send('translate-message', params));
			} catch (error) {
				return toError(error);
			}
		},
	);
}
