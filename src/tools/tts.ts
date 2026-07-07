import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { LumiaClient } from '../client.js';
import { toError, toResult } from './util.js';

export function registerTts(server: McpServer, client: LumiaClient): void {
	server.registerTool(
		'speak',
		{
			title: 'Text to speech',
			description: `Speak text aloud through Lumia's TTS engine on the streamer's machine. Optionally pick a voice from get_settings (options.tts.voices). Volume is Windows-only, 0-100.`,
			inputSchema: {
				text: z.string().describe('The text to speak.'),
				voice: z.string().optional().describe('Voice id/name from get_settings, e.g. "Brian".'),
				volume: z.number().min(0).max(100).optional().describe('Windows-only volume, 0-100.'),
			},
			annotations: { readOnlyHint: false },
		},
		async ({ text, voice, volume }) => {
			try {
				const params: Record<string, unknown> = { value: text };
				if (voice) params.voice = voice;
				if (volume !== undefined) params.volume = volume;
				return toResult(await client.send('tts', params));
			} catch (error) {
				return toError(error);
			}
		},
	);
}
