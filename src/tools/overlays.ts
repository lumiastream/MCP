import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { LumiaClient } from '../client.js';
import { toError, toResult } from './util.js';

export function registerOverlays(server: McpServer, client: LumiaClient): void {
	server.registerTool(
		'control_overlay',
		{
			title: 'Control an overlay',
			description: `Show or hide an overlay or a layer, move a layer, or set a layer's content. "target" is the overlay name/uuid for the "visibility" action, or the layer id for the layer actions (both are found in Lumia's overlay settings).`,
			inputSchema: {
				action: z.enum(['visibility', 'layer-visibility', 'layer-position', 'content']).describe('What to change.'),
				target: z.string().describe('Overlay name/uuid for "visibility"; layer id for the layer actions.'),
				visible: z.boolean().optional().describe('For "visibility"/"layer-visibility": show (true) or hide (false).'),
				x: z.number().optional().describe('For "layer-position": X position.'),
				y: z.number().optional().describe('For "layer-position": Y position.'),
				content: z.string().optional().describe('For "content": the new content value.'),
			},
			annotations: { readOnlyHint: false, openWorldHint: true },
		},
		async ({ action, target, visible, x, y, content }) => {
			try {
				const params: Record<string, unknown> = { layer: target };
				let type: string;
				if (action === 'visibility') {
					type = 'overlay-set-visibility';
					params.value = visible ?? true;
				} else if (action === 'layer-visibility') {
					type = 'overlay-set-layer-visibility';
					params.value = visible ?? true;
				} else if (action === 'layer-position') {
					type = 'overlay-set-layer-position';
					if (x !== undefined) params.x = x;
					if (y !== undefined) params.y = y;
				} else {
					type = 'overlay-set-content';
					params.content = content ?? '';
				}
				return toResult(await client.send(type, params));
			} catch (error) {
				return toError(error);
			}
		},
	);
}
