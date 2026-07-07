import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { LumiaClient } from '../client.js';
import { toError, toResult } from './util.js';

export function registerColor(server: McpServer, client: LumiaClient): void {
	server.registerTool(
		'set_color',
		{
			title: 'Set light color',
			description: `Set the color and brightness of the user's lights. Provide exactly one of: hex (e.g. "#FF4076"), rgb ({ r, g, b } each 0-255), or ct (color temperature 2900-7000 kelvin). Brightness is 0-100; transition and duration are in milliseconds.`,
			inputSchema: {
				hex: z
					.string()
					.regex(/^#?[0-9a-fA-F]{6}$/)
					.optional()
					.describe('Hex color like "#FF4076". Mutually exclusive with rgb/ct.'),
				rgb: z
					.object({
						r: z.number().min(0).max(255),
						g: z.number().min(0).max(255),
						b: z.number().min(0).max(255),
					})
					.optional()
					.describe('RGB color, each channel 0-255.'),
				ct: z.number().min(2900).max(7000).optional().describe('Color temperature in kelvin, 2900-7000.'),
				brightness: z.number().min(0).max(100).optional().describe('Brightness 0-100. Defaults to 100.'),
				transition: z.number().min(0).optional().describe('Transition time in ms. Defaults to 0.'),
				duration: z.number().min(0).optional().describe('How long the color holds in ms. Defaults to 4000.'),
				hold: z.boolean().optional().describe('If true, keep this color as the new default state.'),
			},
			annotations: { readOnlyHint: false },
		},
		async ({ hex, rgb, ct, brightness, transition, duration, hold }) => {
			try {
				if (!hex && !rgb && ct === undefined) {
					return toError(new Error('Provide one of: hex, rgb, or ct.'));
				}

				const params: Record<string, unknown> = {};
				if (brightness !== undefined) params.brightness = brightness;
				if (transition !== undefined) params.transition = transition;
				if (duration !== undefined) params.duration = duration;
				if (hold !== undefined) params.hold = hold;

				let type = 'rgb-color';
				if (hex) {
					type = 'hex-color';
					params.value = hex.startsWith('#') ? hex : `#${hex}`;
				} else if (rgb) {
					params.value = rgb;
				} else {
					params.value = { ct };
				}

				return toResult(await client.send(type, params));
			} catch (error) {
				return toError(error);
			}
		},
	);
}
