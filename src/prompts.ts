import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

function userPrompt(text: string) {
	return { messages: [{ role: 'user' as const, content: { type: 'text' as const, text } }] };
}

export function registerPrompts(server: McpServer): void {
	server.registerPrompt(
		'start_stream',
		{
			title: 'Start stream routine',
			description: 'Discover the setup, set inviting lights, welcome chat, and run the intro command.',
		},
		() =>
			userPrompt(
				`Help me start my stream. First call get_settings to see my commands, scenes, and lights. Then set my lights to a warm, inviting look; post a short welcome message to my chat; speak a brief hello via TTS; and if I have an intro or "starting soon" command or studio scene, run it. Tell me what you did.`,
			),
	);

	server.registerPrompt(
		'brb',
		{
			title: 'Be right back',
			description: 'Switch to a BRB vibe: calm lights, a chat heads-up, and a BRB scene if present.',
		},
		() =>
			userPrompt(
				`I'm stepping away. Set my lights to a calm, dim state, post a friendly "be right back" message in my chat, and if I have a BRB command or studio scene (check get_settings), run it.`,
			),
	);

	server.registerPrompt(
		'hype',
		{
			title: 'Hype moment',
			description: 'Celebrate: flashy lights, a hype alert/command, and an energetic chat shout.',
		},
		() =>
			userPrompt(
				`Big moment! Flash my lights in a bright, celebratory way, then trigger my hype alert or command if I have one (check get_settings), and post an energetic message to chat.`,
			),
	);

	server.registerPrompt(
		'wind_down',
		{
			title: 'Wind down / end stream',
			description: 'Ease out: warm dim lights, thank the chat, and run any ending command.',
		},
		() =>
			userPrompt(
				`Help me wind down the stream. Set my lights warm and dim, thank my chat with both a spoken message and a chat message, and if I have an ending or "stream over" command or scene, run it.`,
			),
	);

	server.registerPrompt(
		'thank_new_followers',
		{
			title: 'Thank recent followers',
			description: 'Read recent follow events and thank each new follower by name.',
		},
		() =>
			userPrompt(
				`Check my recent events for new followers with get_recent_events, then thank each new follower by name with a short, warm chat message. If there are none, just tell me.`,
			),
	);
}
