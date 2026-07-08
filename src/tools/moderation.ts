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
				if ((action === 'vip' || action === 'unvip') && platform !== 'twitch') {
					return toError(new Error('VIP is Twitch-only; set platform to "twitch".'));
				}
				const params: Record<string, unknown> = { value: username, platform };
				if (action === 'timeout') {
					// runtime does parseInt(duration) ?? 10, so NaN slips through when omitted — always send one
					params.duration = duration_minutes ?? 10;
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
		'clear_chat',
		{
			title: 'Clear chat',
			description: `Clear the entire Twitch chat for all viewers. This cannot be undone.`,
			inputSchema: {},
			annotations: { readOnlyHint: false, destructiveHint: true },
		},
		async () => {
			try {
				return toResult(await client.send('clear-chat', { platform: 'twitch' }));
			} catch (error) {
				return toError(error);
			}
		},
	);

	server.registerTool(
		'pin_message',
		{
			title: 'Pin/unpin a chat message',
			description: `Pin a Twitch chat message by its message id, or unpin. For "unpin", omit message_id to unpin whatever is currently pinned.`,
			inputSchema: {
				action: z.enum(['pin', 'unpin']).describe('Pin or unpin.'),
				message_id: z.string().optional().describe('The chat message id. Required for "pin".'),
			},
			annotations: { readOnlyHint: false },
		},
		async ({ action, message_id }) => {
			try {
				if (action === 'pin' && !message_id) {
					return toError(new Error('"pin" requires a message_id.'));
				}
				const params: Record<string, unknown> = { platform: 'twitch' };
				if (message_id) params.value = message_id;
				return toResult(await client.send(action === 'pin' ? 'pin-message' : 'unpin-message', params));
			} catch (error) {
				return toError(error);
			}
		},
	);

	server.registerTool(
		'manage_moderator',
		{
			title: 'Add/remove a moderator',
			description: `Grant or revoke a user's moderator role on Twitch.`,
			inputSchema: {
				action: z.enum(['add', 'remove']).describe('Grant or revoke.'),
				username: z.string().describe('The target username.'),
			},
			annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true },
		},
		async ({ action, username }) => {
			try {
				return toResult(await client.send(action === 'add' ? 'add-moderator' : 'remove-moderator', { value: username, platform: 'twitch' }));
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
