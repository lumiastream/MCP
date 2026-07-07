import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { LumiaClient } from '../client.js';
import { toError, toResult } from './util.js';

export function registerCommandState(server: McpServer, client: LumiaClient): void {
	server.registerTool(
		'set_command_state',
		{
			title: 'Enable/disable a command or folder',
			description: `Enable or disable a command, or a whole command folder, by name.`,
			inputSchema: {
				target: z.enum(['command', 'folder']).default('command').describe('Whether "name" refers to a command or a folder.'),
				name: z.string().describe('The command or folder name.'),
				enabled: z.boolean().describe('true to enable, false to disable.'),
			},
			annotations: { readOnlyHint: false, openWorldHint: true },
		},
		async ({ target, name, enabled }) => {
			try {
				const type = target === 'folder' ? 'set-folder-state' : 'set-command-state';
				return toResult(await client.send(type, { name, value: enabled }));
			} catch (error) {
				return toError(error);
			}
		},
	);
}
