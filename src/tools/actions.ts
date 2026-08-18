import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { LumiaClient } from '../client.js';
import { toError, toResult } from './util.js';

const actionSchema = z
	.object({
		base: z
			.string()
			.optional()
			.describe(`Which system runs the action: "lumia", "overlay", "api", or an integration/plugin key like "twitch", "obs", "spotify". Omit only for the type-driven steps (delay, conditional, loop, randomGroup, stop).`),
		type: z.string().describe('The action name, e.g. "chatbot", "setColor", "overlaySetVisibility".'),
		value: z.any().optional().describe('The action payload. Shapes differ per action — read the lumia://actions/catalog resource first.'),
		delay: z.number().optional().describe('For a { type: "delay" } step: how long to wait, in milliseconds.'),
	})
	.passthrough();

async function readCatalog(client: LumiaClient): Promise<string> {
	const res = await client.send('get-action-catalog');
	const message = (res as { message?: unknown }).message;
	return typeof message === 'string' ? message : JSON.stringify(message ?? {}, null, 2);
}

export function registerActions(server: McpServer, client: LumiaClient): void {
	server.registerResource(
		'actions',
		'lumia://actions/catalog',
		{
			title: 'Lumia action catalog',
			description: `Every action run_actions can execute, with the exact "value" shape each one expects. Read this before building an action list.`,
			mimeType: 'text/plain',
		},
		async (uri) => ({
			contents: [{ uri: uri.href, mimeType: 'text/plain', text: await readCatalog(client) }],
		}),
	);

	server.registerTool(
		'get_action_catalog',
		{
			title: 'Get the action catalog',
			description: `List every action available to run_actions along with the "value" shape it expects. Call this before run_actions unless you already know the exact shape — payloads differ per action and a wrong shape fails silently.`,
			inputSchema: {},
			annotations: { readOnlyHint: true, openWorldHint: true },
		},
		async () => {
			try {
				return { content: [{ type: 'text' as const, text: await readCatalog(client) }] };
			} catch (error) {
				return toError(error);
			}
		},
	);

	server.registerTool(
		'run_actions',
		{
			title: 'Run Lumia actions',
			description: `Run a list of Lumia actions in order — the same building blocks the user's commands and alerts are made of. This covers far more than the individual tools: every Lumia action, overlay action, HTTP request, and every connected integration or plugin (Twitch, OBS, Spotify, and so on), plus control-flow steps (delay, conditional, loop, randomGroup, stop). Call get_action_catalog first for the exact "value" shape of each action. Note that in most Lumia actions value.value is the target/name and value.message is the content/payload. Actions that execute arbitrary code or synthetic input on the machine (code, writeToFile, commandRunner, inputEvents) are rejected.`,
			inputSchema: {
				actions: z.array(actionSchema).min(1).describe('The actions to run, in order.'),
				extraSettings: z
					.record(z.string(), z.any())
					.optional()
					.describe('Template variables available to the actions, e.g. { "username": "lumia" } for {{username}}.'),
			},
			annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true },
		},
		async ({ actions, extraSettings }) => {
			try {
				const params: Record<string, unknown> = { actions };
				if (extraSettings) params.extraSettings = extraSettings;
				const res = await client.send('run-actions', params);
				return toResult((res as { message?: unknown }).message ?? { ran: actions.length });
			} catch (error) {
				return toError(error);
			}
		},
	);
}
