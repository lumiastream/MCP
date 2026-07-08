import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { LumiaClient } from '../client.js';
import { toError, toResult } from './util.js';

const ACTION_TYPES = { create: 'create-chatbot-command', update: 'update-chatbot-command', delete: 'delete-chatbot-command' } as const;

export function registerCommandManagement(server: McpServer, client: LumiaClient): void {
	server.registerTool(
		'manage_chatbot_command',
		{
			title: 'Create/update/delete a chatbot command',
			description: `Create, update, or delete a chatbot command (chatbot commands are unlimited on every plan). Names are slugified (lowercase, spaces become dashes). "message" is the chat reply and is required for create; it supports {{variables}}. Update merges only the fields you pass; delete refuses built-in system commands. Requires an up-to-date Lumia Stream.`,
			inputSchema: {
				action: z.enum(['create', 'update', 'delete']).describe('What to do.'),
				name: z.string().describe('The command name (without the chat prefix), e.g. "socials".'),
				message: z.string().optional().describe('The chatbot reply text. Required for create; optional for update.'),
				description: z.string().optional().describe('Internal description shown in the commands list.'),
				aliases: z.array(z.string()).optional().describe('Alternate names that also trigger the command.'),
				new_name: z.string().optional().describe('For update: rename the command to this.'),
				show_in_commands_list: z.boolean().optional().describe('Show it on your public lumiastream.com commands page.'),
				enabled: z.boolean().optional().describe('Whether the command is enabled. Defaults to true on create.'),
				cooldown_seconds: z.number().min(0).optional().describe('Cooldown between uses, in seconds.'),
			},
			annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true },
		},
		async ({ action, name, message, description, aliases, new_name, show_in_commands_list, enabled, cooldown_seconds }) => {
			try {
				if (action === 'create' && !message?.trim()) {
					return toError(new Error('message is required when creating a command.'));
				}
				const params: Record<string, unknown> = { name };
				if (message !== undefined) params.message = message;
				if (description !== undefined) params.description = description;
				if (aliases !== undefined) params.alias = aliases;
				if (new_name !== undefined) params.newName = new_name;
				if (show_in_commands_list !== undefined) params.showInCommandsList = show_in_commands_list;
				if (enabled !== undefined) params.on = enabled;
				if (cooldown_seconds !== undefined) params.cooldownDuration = Math.round(cooldown_seconds * 1000);
				const res = await client.send(ACTION_TYPES[action], params);
				return toResult({ action, command: (res as { message?: unknown }).message ?? name });
			} catch (error) {
				return toError(error);
			}
		},
	);
}
