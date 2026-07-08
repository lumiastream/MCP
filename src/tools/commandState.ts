import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { LumiaClient } from '../client.js';
import { toError, toResult } from './util.js';

export function registerCommandState(server: McpServer, client: LumiaClient): void {
	server.registerTool(
		'set_command_state',
		{
			title: 'Enable/disable a command or folder',
			description: `Enable or disable a command, or a whole command folder, by name. For commands, "kind" picks which list the name belongs to (chat, chatbot, Twitch channel points, Kick points, or Twitch extension); points/extension kinds also sync the platform-side reward state on an up-to-date Lumia Stream.`,
			inputSchema: {
				target: z.enum(['command', 'folder']).default('command').describe('Whether "name" refers to a command or a folder.'),
				kind: z
					.enum(['chat', 'chatbot', 'twitch-points', 'kick-points', 'twitch-extension'])
					.default('chat')
					.describe('For target "command": which command list the name belongs to.'),
				name: z.string().describe('The command or folder name.'),
				enabled: z.boolean().describe('true to enable, false to disable.'),
			},
			annotations: { readOnlyHint: false, openWorldHint: true },
		},
		async ({ target, kind, name, enabled }) => {
			try {
				if (target === 'folder') {
					return toResult(await client.send('set-folder-state', { name, value: enabled }));
				}
				return toResult(await client.send('set-command-state', { name, value: enabled, kind }));
			} catch (error) {
				return toError(error);
			}
		},
	);
}
