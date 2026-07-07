import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { LumiaEventStream } from '../eventStream.js';
import { toResult } from './util.js';

export function registerRealtime(server: McpServer, events: LumiaEventStream): void {
	server.registerTool(
		'get_recent_events',
		{
			title: 'Get recent stream events',
			description: `Return live events (chat, chat commands, follows, subs, bits, raids, donations, heart-rate, etc.) that Lumia has pushed since this server started. Optionally filter by a type substring (e.g. "follow", "chat", "sub", "bits") or origin (e.g. "twitch"). If nothing is buffered yet, check the returned status.connected.`,
			inputSchema: {
				type: z.string().optional().describe('Match against the event type or alert name, e.g. "follow", "chat", "command", "sub", "bits", "raid", "donation".'),
				origin: z.string().optional().describe('Filter by origin platform, e.g. "twitch", "youtube", "kick".'),
				limit: z.number().min(1).max(200).optional().describe('Max events to return, most recent last. Default 20.'),
			},
			annotations: { readOnlyHint: true, openWorldHint: true },
		},
		async ({ type, origin, limit }) => {
			const list = events.recent({ type, origin, limit });
			return toResult({ status: events.status(), count: list.length, events: list });
		},
	);

	server.registerTool(
		'wait_for_event',
		{
			title: 'Wait for the next event',
			description: `Block until the next matching live event arrives, or until the timeout. Use it to react in real time — e.g. wait for the next follower, then greet them by name. Returns the event, or a timedOut result if none arrived in time.`,
			inputSchema: {
				type: z.string().optional().describe('Only resolve on events matching this type or alert name, e.g. "follow", "sub", "raid", "bits".'),
				origin: z.string().optional().describe('Only resolve on this origin platform, e.g. "twitch".'),
				timeout_seconds: z.number().min(1).max(300).optional().describe('How long to wait before giving up. Default 30, max 300.'),
			},
			annotations: { readOnlyHint: true, openWorldHint: true },
		},
		async ({ type, origin, timeout_seconds }) => {
			const seconds = timeout_seconds ?? 30;
			const event = await events.waitFor({ type, origin, timeoutMs: seconds * 1000 });
			if (!event) return toResult({ timedOut: true, waitedSeconds: seconds, status: events.status() });
			return toResult({ timedOut: false, event });
		},
	);
}
