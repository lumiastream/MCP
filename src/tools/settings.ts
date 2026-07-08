import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { LumiaClient } from '../client.js';
import { toError, toResult } from './util.js';

function slimSettings(retrieved: Record<string, unknown>): Record<string, unknown> {
	const data = ((retrieved?.data as Record<string, unknown>) ?? retrieved) as Record<string, any>;
	const opt = (data.options ?? {}) as Record<string, any>;
	const values = (key: string): unknown[] => (Array.isArray(opt[key]?.values) ? opt[key].values : []);
	const count = (key: string): number =>
		typeof opt[key]?.count === 'number' ? opt[key].count : values(key).length;
	const states = (data.states ?? {}) as Record<string, unknown>;

	return {
		premium: data.premium ?? false,
		states: { on: states.on, streamMode: states.streamMode, fuze: states.fuze },
		types: Array.isArray(data.types) ? data.types : [],
		commands: {
			chat: values('chat-command'),
			chatbot: values('chatbot-command'),
			twitchPoints: values('twitch-points'),
			twitchExtension: values('twitch-extension'),
			kickPoints: values('kick-points'),
		},
		alerts: values('alert'),
		studio: {
			scenes: values('studio-scene'),
			themes: values('studio-theme'),
			animations: values('studio-animation'),
		},
		lights: Array.isArray(data.lights) ? data.lights : [],
		voices: Array.isArray(opt.tts?.values?.voices)
			? opt.tts.values.voices.map((voice: any) => ({ id: voice.id, label: voice.label, language: voice.language }))
			: [],
		overlays: { count: count('overlays') },
		overlayLayers: { count: count('overlayLayers') },
	};
}

export function registerSettings(server: McpServer, client: LumiaClient): void {
	server.registerResource(
		'settings',
		'lumia://settings',
		{
			title: 'Lumia Stream settings',
			description: `The current user's available command names, alerts, connected lights, studio scenes/themes/animations, and TTS voices (slimmed — full overlay configs omitted).`,
			mimeType: 'application/json',
		},
		async (uri) => {
			const data = slimSettings(await client.retrieve());
			return {
				contents: [
					{
						uri: uri.href,
						mimeType: 'application/json',
						text: JSON.stringify(data, null, 2),
					},
				],
			};
		},
	);

	server.registerTool(
		'get_settings',
		{
			title: 'Get Lumia settings',
			description: `Discover what this Lumia Stream user actually has set up. The default summary returns states, counts, and studio scene/theme/animation names; large lists are counts only. Pass a section to fetch a full list: "commands" (all chat/chatbot/points/extension command names), "alerts", "lights", or "voices". Call this before triggering things by name, since every user's setup differs.`,
			inputSchema: {
				section: z
					.enum(['summary', 'commands', 'alerts', 'lights', 'voices', 'all'])
					.default('summary')
					.describe('Which slice to return. "summary" = counts + studio + states; the rest return one full list.'),
			},
			annotations: { readOnlyHint: true, openWorldHint: true },
		},
		async ({ section }) => {
			try {
				const slim = slimSettings(await client.retrieve());
				if (section === 'all') return toResult(slim);
				if (section === 'commands') return toResult({ commands: slim.commands });
				if (section === 'alerts') return toResult({ alerts: slim.alerts });
				if (section === 'lights') return toResult({ lights: slim.lights });
				if (section === 'voices') return toResult({ voices: slim.voices });

				const commands = slim.commands as Record<string, unknown[]>;
				return toResult({
					premium: slim.premium,
					states: slim.states,
					types: slim.types,
					studio: slim.studio,
					counts: {
						commands: Object.fromEntries(Object.entries(commands).map(([kind, list]) => [kind, list.length])),
						alerts: (slim.alerts as unknown[]).length,
						lights: (slim.lights as unknown[]).length,
						voices: (slim.voices as unknown[]).length,
						overlays: (slim.overlays as { count: number }).count,
						overlayLayers: (slim.overlayLayers as { count: number }).count,
					},
					hint: 'Pass section: "commands" | "alerts" | "lights" | "voices" for the full lists.',
				});
			} catch (error) {
				return toError(error);
			}
		},
	);
}
