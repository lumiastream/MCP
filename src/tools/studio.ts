import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { LumiaClient } from '../client.js';
import { toError, toResult } from './util.js';

const STUDIO_TYPES = { scene: 'studio-scene', theme: 'studio-theme', animation: 'studio-animation' } as const;

export function registerStudio(server: McpServer, client: LumiaClient): void {
	server.registerTool(
		'set_studio',
		{
			title: 'Set studio scene/theme/animation',
			description: `Trigger a Lumia Studio scene, theme, or animation by name. Use get_settings to see valid values under options.studio-scene / studio-theme / studio-animation.`,
			inputSchema: {
				kind: z.enum(['scene', 'theme', 'animation']).describe('Which studio item to trigger.'),
				name: z.string().describe('The scene/theme/animation name, e.g. "snow" or "breathe".'),
				duration: z.number().min(0).optional().describe('Duration in milliseconds. Omit to use the default.'),
			},
			annotations: { readOnlyHint: false, openWorldHint: true },
		},
		async ({ kind, name, duration }) => {
			try {
				const params: Record<string, unknown> = { value: name };
				if (duration !== undefined) params.duration = duration;
				return toResult(await client.send(STUDIO_TYPES[kind], params));
			} catch (error) {
				return toError(error);
			}
		},
	);
}
