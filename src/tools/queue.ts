import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { LumiaClient } from '../client.js';
import { toError, toResult } from './util.js';

const QUEUE_TYPES = { pause: 'pause-queue', resume: 'resume-queue', clear: 'clear-queue', 'clear-cooldowns': 'clear-cooldowns' } as const;

export function registerQueue(server: McpServer, client: LumiaClient): void {
	server.registerTool(
		'control_queue',
		{
			title: 'Control the alert queue',
			description: `Pause, resume, or clear Lumia's alert/effect queue, or clear all command cooldowns.`,
			inputSchema: {
				action: z.enum(['pause', 'resume', 'clear', 'clear-cooldowns']).describe('Queue action to perform.'),
			},
			annotations: { readOnlyHint: false, destructiveHint: true },
		},
		async ({ action }) => {
			try {
				return toResult(await client.send(QUEUE_TYPES[action]));
			} catch (error) {
				return toError(error);
			}
		},
	);
}
