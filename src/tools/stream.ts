import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { LumiaClient } from '../client.js';
import { toError, toResult } from './util.js';

export function registerStream(server: McpServer, client: LumiaClient): void {
	server.registerTool(
		'set_stream_info',
		{
			title: 'Set stream title/category',
			description: `Change the live stream title and/or category. Provide title, category, or both. Works on Twitch and Kick; the category is matched by name search on the platform. YouTube is not supported.`,
			inputSchema: {
				title: z.string().optional().describe('The new stream title.'),
				category: z.string().optional().describe('The new category/game name, e.g. "Just Chatting".'),
				platform: z.enum(['twitch', 'kick']).default('twitch').describe('Platform.'),
			},
			annotations: { readOnlyHint: false, openWorldHint: true },
		},
		async ({ title, category, platform }) => {
			try {
				if (title === undefined && category === undefined) {
					return toError(new Error('Provide title, category, or both.'));
				}
				const results: Record<string, unknown> = {};
				if (title !== undefined) {
					results.title = await client.send('change-stream-title', { value: title, platform });
				}
				if (category !== undefined) {
					results.category = await client.send('change-current-category', { value: category, platform });
				}
				return toResult(results);
			} catch (error) {
				return toError(error);
			}
		},
	);

	server.registerTool(
		'create_clip',
		{
			title: 'Create a clip',
			description: `Create a Twitch clip of the last moments of the live stream. The clip id and url land in the "twitch_last_clip_id" and "twitch_last_clip_url" variables — read them with get_variable afterwards. Only works while live on Twitch.`,
			inputSchema: {},
			annotations: { readOnlyHint: false, openWorldHint: true },
		},
		async () => {
			try {
				return toResult(await client.send('clip', { platform: 'twitch' }));
			} catch (error) {
				return toError(error);
			}
		},
	);

	server.registerTool(
		'create_stream_marker',
		{
			title: 'Create a stream marker',
			description: `Mark the current moment of the Twitch broadcast (shows up in the Highlighter for editing later). Only works while live on Twitch.`,
			inputSchema: {
				description: z.string().optional().describe('Optional marker description, e.g. "funny moment".'),
			},
			annotations: { readOnlyHint: false, openWorldHint: true },
		},
		async ({ description }) => {
			try {
				return toResult(await client.send('create-stream-marker', { value: description ?? '', platform: 'twitch' }));
			} catch (error) {
				return toError(error);
			}
		},
	);

	server.registerTool(
		'send_announcement',
		{
			title: 'Send a chat announcement',
			description: `Post a highlighted announcement message to Twitch chat.`,
			inputSchema: {
				message: z.string().describe('The announcement text.'),
			},
			annotations: { readOnlyHint: false, openWorldHint: true },
		},
		async ({ message }) => {
			try {
				return toResult(await client.send('send-announcement', { value: message, platform: 'twitch' }));
			} catch (error) {
				return toError(error);
			}
		},
	);

	server.registerTool(
		'run_commercial',
		{
			title: 'Run a commercial',
			description: `Run an ad break on the Twitch channel. Twitch serves an ad as close to the requested length as possible. Only works while live on Twitch, and respects the channel's ad cooldown.`,
			inputSchema: {
				duration: z.number().int().min(30).max(180).default(60).describe('Commercial length in seconds (30-180).'),
			},
			annotations: { readOnlyHint: false, openWorldHint: true },
		},
		async ({ duration }) => {
			try {
				return toResult(await client.send('run-commercial', { duration, platform: 'twitch' }));
			} catch (error) {
				return toError(error);
			}
		},
	);

	server.registerTool(
		'set_chat_mode',
		{
			title: 'Set a chat mode',
			description: `Turn a Twitch chat mode on or off: slow mode, subscriber-only, follower-only, or emote-only.`,
			inputSchema: {
				mode: z.enum(['slow', 'subscriber', 'follower', 'emote']).describe('Which chat mode to change.'),
				enabled: z.boolean().describe('true to turn the mode on, false to turn it off.'),
				duration: z
					.number()
					.int()
					.min(0)
					.optional()
					.describe('slow mode: wait time between messages in seconds (3-120, default 30). follower mode: minimum follow age in minutes (0-129600, default 0). Ignored for other modes.'),
			},
			annotations: { readOnlyHint: false, openWorldHint: true },
		},
		async ({ mode, enabled, duration }) => {
			try {
				const types = { slow: 'set-slow-mode', subscriber: 'set-subscriber-mode', follower: 'set-follow-mode', emote: 'set-emotes-mode' } as const;
				const params: Record<string, unknown> = { value: enabled, platform: 'twitch' };
				if (duration !== undefined) {
					params.duration = duration;
				}
				return toResult(await client.send(types[mode], params));
			} catch (error) {
				return toError(error);
			}
		},
	);

	server.registerTool(
		'create_poll',
		{
			title: 'Create a poll',
			description: `Start a Twitch poll. The poll id lands in the "twitch_current_poll_id" variable, and end_poll targets the last poll created this way. Only works while live on Twitch.`,
			inputSchema: {
				title: z.string().describe('The poll question, e.g. "Which game next?".'),
				choices: z.array(z.string()).min(2).max(5).describe('2-5 choice titles (25 chars max each). Titles must not contain commas.'),
				duration: z.number().int().min(15).max(1800).default(120).describe('How long the poll runs, in seconds (15-1800).'),
			},
			annotations: { readOnlyHint: false, openWorldHint: true },
		},
		async ({ title, choices, duration }) => {
			try {
				return toResult(await client.send('create-poll', { name: title, value: choices.join(','), duration, platform: 'twitch' }));
			} catch (error) {
				return toError(error);
			}
		},
	);

	server.registerTool(
		'end_poll',
		{
			title: 'End the current poll',
			description: `End the Twitch poll that is currently running. Only finds polls that were created through Lumia.`,
			inputSchema: {
				status: z
					.enum(['ARCHIVED', 'TERMINATED'])
					.default('ARCHIVED')
					.describe('ARCHIVED ends the poll and hides it from public view; TERMINATED ends it early but leaves the result publicly visible.'),
			},
			annotations: { readOnlyHint: false, openWorldHint: true },
		},
		async ({ status }) => {
			try {
				return toResult(await client.send('end-poll', { name: status, platform: 'twitch' }));
			} catch (error) {
				return toError(error);
			}
		},
	);

	server.registerTool(
		'create_prediction',
		{
			title: 'Create a prediction',
			description: `Start a Twitch channel-points prediction. The prediction id and outcomes are cached so end_prediction can resolve it by outcome title. Only works while live on Twitch.`,
			inputSchema: {
				title: z.string().describe('The prediction question, e.g. "Will we win this match?".'),
				outcomes: z.array(z.string()).min(2).max(10).describe('2-10 outcome titles (25 chars max each), e.g. ["Yes", "No"]. Titles must not contain commas.'),
				duration: z.number().int().min(30).max(1800).default(120).describe('Prediction window in seconds (30-1800) during which viewers can vote.'),
			},
			annotations: { readOnlyHint: false, openWorldHint: true },
		},
		async ({ title, outcomes, duration }) => {
			try {
				return toResult(await client.send('create-prediction', { name: title, value: outcomes.join(','), duration, platform: 'twitch' }));
			} catch (error) {
				return toError(error);
			}
		},
	);

	server.registerTool(
		'end_prediction',
		{
			title: 'End the current prediction',
			description: `Resolve or cancel the Twitch prediction that is currently running. To resolve, name the winning outcome — it must match one of the prediction's outcome titles (case-insensitive). Canceling refunds all channel points. Only works for predictions created through Lumia in the current app session.`,
			inputSchema: {
				winning_outcome: z.string().optional().describe('The title of the winning outcome, e.g. "Yes". Required when resolving; ignored when canceling.'),
				status: z.enum(['RESOLVED', 'CANCELED']).default('RESOLVED').describe('RESOLVED pays out to the winning outcome; CANCELED refunds everyone.'),
			},
			annotations: { readOnlyHint: false, openWorldHint: true },
		},
		async ({ winning_outcome, status }) => {
			try {
				if (status === 'RESOLVED' && !winning_outcome) {
					return toError(new Error('winning_outcome is required when status is RESOLVED.'));
				}
				return toResult(await client.send('end-prediction', { value: winning_outcome ?? '', name: status, platform: 'twitch' }));
			} catch (error) {
				return toError(error);
			}
		},
	);
}
