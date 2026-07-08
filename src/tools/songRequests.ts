import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { LumiaClient } from '../client.js';
import { toError, toResult } from './util.js';

export function registerSongRequests(server: McpServer, client: LumiaClient): void {
	server.registerTool(
		'control_song_request',
		{
			title: 'Control song requests',
			description: `Control the song request queue (plays through Spotify). "add" queues a song by search query or link; "skip" jumps to the next song; "play"/"pause" control playback; "remove" drops a request (the last one, or a specific id); "clear" empties the whole queue.`,
			inputSchema: {
				action: z.enum(['add', 'skip', 'play', 'pause', 'remove', 'clear']).describe('What to do.'),
				query: z.string().optional().describe('For "add": the song to search for, or a Spotify link.'),
				song_request_id: z.string().optional().describe('For "remove": a specific request id. Omit to remove the most recent request.'),
				username: z.string().optional().describe('For "add": the requester to attribute the song to.'),
				platform: z.string().optional().describe('For "add": the platform the requester is on, e.g. "twitch".'),
			},
			annotations: { readOnlyHint: false, openWorldHint: true },
		},
		async ({ action, query, song_request_id, username, platform }) => {
			try {
				const params: Record<string, unknown> = { action };
				if (action === 'add') {
					if (!query) {
						return toError(new Error('"add" requires a query.'));
					}
					params.value = query;
					if (username) params.username = username;
					if (platform) params.platform = platform;
				} else if (action === 'remove' && song_request_id) {
					params.songRequestId = song_request_id;
				}
				return toResult(await client.send('song-request', params));
			} catch (error) {
				return toError(error);
			}
		},
	);
}
