import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { LumiaClient } from '../client.js';
import { toError, toResult } from './util.js';

export function registerVariables(server: McpServer, client: LumiaClient): void {
	server.registerTool(
		'get_variable',
		{
			title: 'Get a variable',
			description: `Read the current value of a Lumia variable, e.g. "twitch_username" or a custom variable you created.`,
			inputSchema: {
				name: z.string().describe('The variable name, e.g. "twitch_username".'),
			},
			annotations: { readOnlyHint: true },
		},
		async ({ name }) => {
			try {
				const res = await client.send('get-variable-value', { name });
				const value = (res as { message?: unknown }).message ?? null;
				return toResult({ name, value });
			} catch (error) {
				return toError(error);
			}
		},
	);

	server.registerTool(
		'set_variable',
		{
			title: 'Set a variable',
			description: `Create or update a custom Lumia variable that overlays, commands, and custom code can read.`,
			inputSchema: {
				name: z.string().describe('The variable name to set, e.g. "customVar".'),
				value: z.union([z.string(), z.number(), z.boolean()]).describe('The new value.'),
			},
			annotations: { readOnlyHint: false },
		},
		async ({ name, value }) => {
			try {
				return toResult(await client.send('update-variable-value', { name, value }));
			} catch (error) {
				return toError(error);
			}
		},
	);

	server.registerTool(
		'set_counter',
		{
			title: 'Set a counter',
			description: `Set a counter variable to an exact numeric value, e.g. reset a death counter to 0. Creates the counter if it doesn't exist yet.`,
			inputSchema: {
				name: z.string().describe('The counter variable name, e.g. "deaths".'),
				value: z.number().describe('The exact value to set it to.'),
			},
			annotations: { readOnlyHint: false },
		},
		async ({ name, value }) => {
			try {
				return toResult(await client.send('set-counter-value', { name, value }));
			} catch (error) {
				return toError(error);
			}
		},
	);
}
