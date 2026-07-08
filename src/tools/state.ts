import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { LumiaClient } from '../client.js';
import { toError, toResult } from './util.js';

const PLATFORM_FIELDS: Record<string, Record<string, string>> = {
	twitch: {
		live: 'twitch_live',
		viewers: 'twitch_current_viewer_count',
		followers: 'twitch_total_follower_count',
		subscribers: 'twitch_total_subscriber_count',
		latestFollower: 'twitch_last_follower',
		latestSubscriber: 'twitch_last_subscriber',
		streamStartedAt: 'twitch_uptime_timestamp',
	},
	youtube: {
		live: 'youtube_live',
		viewers: 'youtube_current_viewer_count',
		subscribers: 'youtube_total_subscriber_count',
		latestSubscriber: 'youtube_last_subscriber',
		streamStartedAt: 'youtube_uptime_timestamp',
	},
	kick: {
		live: 'kick_live',
		viewers: 'kick_current_viewer_count',
		followers: 'kick_total_follower_count',
		subscribers: 'kick_total_subscriber_count',
		latestFollower: 'kick_last_follower',
		latestSubscriber: 'kick_last_subscriber',
		streamStartedAt: 'kick_uptime_timestamp',
	},
	facebook: {
		live: 'facebook_live',
		followers: 'facebook_total_follower_count',
		streamStartedAt: 'facebook_uptime_timestamp',
	},
	tiktok: {
		live: 'tiktok_live',
		viewers: 'tiktok_current_viewer_count',
		followers: 'tiktok_total_follower_count',
		latestFollower: 'tiktok_last_follower',
		streamStartedAt: 'tiktok_uptime_timestamp',
	},
};

const AGNOSTIC_VARS = [
	'streamer',
	'total_follower_count',
	'total_subscriber_count',
	'last_follower',
	'last_subscriber',
	'spotify_now_playing_song',
	'spotify_now_playing_artist',
	'youtubemusic_now_playing_song',
	'youtubemusic_now_playing_artist',
	'now_playing_title',
	'now_playing_artist',
	'heartrate_bpm',
];

const CONNECTION_FIELDS = ['followers', 'subscribers', 'viewers', 'latestFollower', 'latestSubscriber'] as const;

function present(value: unknown): boolean {
	return value !== null && value !== undefined && value !== '';
}

function firstPresent(...values: unknown[]): unknown {
	for (const value of values) if (present(value)) return value;
	return null;
}

function stateVarNames(): string[] {
	const names = new Set(AGNOSTIC_VARS);
	for (const fields of Object.values(PLATFORM_FIELDS)) {
		for (const varName of Object.values(fields)) names.add(varName);
	}
	return [...names];
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
			description: `Get a snapshot of the current stream: streamer name, live status, now-playing song, and heart rate, plus a per-platform breakdown (followers, subscribers, viewers, latest follower/subscriber, live) for every connected platform, alongside cross-platform "totals". Platforms with no data are omitted. Note: Lumia "stream mode" on/off isn't a variable, so per-platform "live" is the closest live indicator.`,
			inputSchema: {},
			annotations: { readOnlyHint: true, openWorldHint: true },
		},
		async () => {
			try {
				const raw = await readVariables(client, stateVarNames());

				const song = present(raw.spotify_now_playing_song)
					? [raw.spotify_now_playing_song, raw.spotify_now_playing_artist].filter(present).join(' — ')
					: present(raw.youtubemusic_now_playing_song)
						? [raw.youtubemusic_now_playing_song, raw.youtubemusic_now_playing_artist].filter(present).join(' — ')
						: present(raw.now_playing_title)
							? [raw.now_playing_title, raw.now_playing_artist].filter(present).join(' — ')
							: null;

				const platforms: Record<string, Record<string, unknown>> = {};
				let anyLive = false;

				for (const [platform, fields] of Object.entries(PLATFORM_FIELDS)) {
					const snapshot: Record<string, unknown> = {};
					for (const [field, varName] of Object.entries(fields)) {
						if (present(raw[varName])) snapshot[field] = raw[varName];
					}
					const live = snapshot.live === true || snapshot.live === 'true';
					if (live) anyLive = true;
					if (live || CONNECTION_FIELDS.some((field) => present(snapshot[field]))) {
						platforms[platform] = snapshot;
					}
				}

				const state = {
					streamer: firstPresent(raw.streamer),
					isLive: anyLive,
					nowPlaying: song,
					heartRateBpm: firstPresent(raw.heartrate_bpm),
					totals: {
						followers: firstPresent(raw.total_follower_count),
						subscribers: firstPresent(raw.total_subscriber_count),
						latestFollower: firstPresent(raw.last_follower),
						latestSubscriber: firstPresent(raw.last_subscriber),
					},
					platforms,
				};
				return toResult(state);
			} catch (error) {
				return toError(error);
			}
		},
	);
}
