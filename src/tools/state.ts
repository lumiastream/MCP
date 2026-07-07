import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { LumiaClient } from '../client.js';
import { toError, toResult } from './util.js';

const STATE_VARS = [
	'streamer',
	'twitch_username',
	'twitch_live',
	'twitch_current_viewer_count',
	'twitch_uptime_timestamp',
	'total_follower_count',
	'twitch_total_follower_count',
	'last_follower',
	'total_subscriber_count',
	'twitch_total_subscriber_count',
	'last_subscriber',
	'spotify_now_playing_song',
	'spotify_now_playing_artist',
	'now_playing_title',
	'now_playing_artist',
	'heartrate_bpm',
];

function present(value: unknown): boolean {
	return value !== null && value !== undefined && value !== '';
}

function firstPresent(...values: unknown[]): unknown {
	for (const value of values) if (present(value)) return value;
	return null;
}

async function readVariables(client: LumiaClient, names: string[]): Promise<Record<string, unknown>> {
	const entries = await Promise.all(
		names.map(async (name) => {
			try {
				const res = await client.send('get-variable-value', { name });
				return [name, (res as { message?: unknown }).message ?? null] as const;
			} catch (error) {
				return [name, `error: ${error instanceof Error ? error.message : String(error)}`] as const;
			}
		}),
	);
	return Object.fromEntries(entries);
}

export function registerState(server: McpServer, client: LumiaClient): void {
	server.registerTool(
		'get_variables',
		{
			title: 'Get multiple variables',
			description: `Read several Lumia variables at once by name. Returns a map of name to value. Use get_settings first if you're unsure which variables exist.`,
			inputSchema: {
				names: z.array(z.string()).min(1).describe('Variable names to read, e.g. ["twitch_username", "twitch_total_follower_count"].'),
			},
			annotations: { readOnlyHint: true },
		},
		async ({ names }) => {
			try {
				return toResult(await readVariables(client, names));
			} catch (error) {
				return toError(error);
			}
		},
	);

	server.registerTool(
		'get_state',
		{
			title: 'Get stream state',
			description: `Get a snapshot of the current stream: streamer name, whether it's live, viewer count, follower/subscriber counts and latest names, now-playing song, and heart rate. Values are empty when the relevant integration isn't connected. Note: Lumia "stream mode" on/off isn't exposed as a variable, so "isLive" (the platform live status) is the closest live indicator.`,
			inputSchema: {},
			annotations: { readOnlyHint: true, openWorldHint: true },
		},
		async () => {
			try {
				const raw = await readVariables(client, STATE_VARS);
				const song = present(raw.spotify_now_playing_song)
					? [raw.spotify_now_playing_song, raw.spotify_now_playing_artist].filter(present).join(' — ')
					: present(raw.now_playing_title)
						? [raw.now_playing_title, raw.now_playing_artist].filter(present).join(' — ')
						: null;

				const state = {
					streamer: firstPresent(raw.streamer, raw.twitch_username),
					isLive: firstPresent(raw.twitch_live),
					viewers: firstPresent(raw.twitch_current_viewer_count),
					streamStartedAt: firstPresent(raw.twitch_uptime_timestamp),
					followers: {
						total: firstPresent(raw.total_follower_count, raw.twitch_total_follower_count),
						latest: firstPresent(raw.last_follower),
					},
					subscribers: {
						total: firstPresent(raw.total_subscriber_count, raw.twitch_total_subscriber_count),
						latest: firstPresent(raw.last_subscriber),
					},
					nowPlaying: song,
					heartRateBpm: firstPresent(raw.heartrate_bpm),
				};
				return toResult(state);
			} catch (error) {
				return toError(error);
			}
		},
	);
}
