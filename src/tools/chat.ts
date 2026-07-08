import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { LumiaClient } from '../client.js';
import { toError, toResult } from './util.js';

export function registerChat(server: McpServer, client: LumiaClient): void {
	server.registerTool(
		'send_chat_message',
		{
			title: 'Send a chat message',
			description: `Post a message to your live chat through Lumia's chat bot. The platform must be connected and the chat bot enabled. Set as_streamer to post as yourself instead of the bot account.`,
			inputSchema: {
				message: z.string().describe('The message text to send.'),
				platform: z.enum(['twitch', 'youtube', 'facebook']).default('twitch').describe('Which chat to post to.'),
				as_streamer: z.boolean().optional().describe('If true, send as the streamer (self) rather than the bot.'),
			},
			annotations: { readOnlyHint: false, openWorldHint: true },
		},
		async ({ message, platform, as_streamer }) => {
			try {
				const params: Record<string, unknown> = { value: message, platform };
				if (as_streamer) params.userToChatAs = 'self';
				return toResult(await client.send('chatbot-message', params));
			} catch (error) {
				return toError(error);
			}
		},
	);

	server.registerTool(
		'shoutout',
		{
			title: 'Shout out a user',
			description: `Shout out a user: finds a clip of them if possible, shows it on your overlays, and posts a shoutout in chat.`,
			inputSchema: {
				username: z.string().describe('The user to shout out.'),
				platform: z.enum(['twitch', 'youtube', 'kick']).default('twitch').describe('The platform the user is on.'),
			},
			annotations: { readOnlyHint: false, openWorldHint: true },
		},
		async ({ username, platform }) => {
			try {
				return toResult(await client.send('shoutout', { value: username, platform }));
			} catch (error) {
				return toError(error);
			}
		},
	);
}
