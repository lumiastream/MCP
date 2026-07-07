import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { LumiaClient } from '../client.js';
import { registerAlerts } from './alerts.js';
import { registerChat } from './chat.js';
import { registerColor } from './color.js';
import { registerCommands } from './commands.js';
import { registerCommandState } from './commandState.js';
import { registerFuze } from './fuze.js';
import { registerLoyalty } from './loyalty.js';
import { registerLumiaState } from './lumiaState.js';
import { registerModeration } from './moderation.js';
import { registerOverlays } from './overlays.js';
import { registerQueue } from './queue.js';
import { registerSettings } from './settings.js';
import { registerState } from './state.js';
import { registerStudio } from './studio.js';
import { registerTts } from './tts.js';
import { registerVariables } from './variables.js';

export function registerTools(server: McpServer, client: LumiaClient): void {
	registerSettings(server, client);
	registerCommands(server, client);
	registerColor(server, client);
	registerAlerts(server, client);
	registerVariables(server, client);
	registerTts(server, client);

	registerStudio(server, client);
	registerOverlays(server, client);
	registerLumiaState(server, client);
	registerQueue(server, client);
	registerCommandState(server, client);
	registerFuze(server, client);
	registerLoyalty(server, client);

	registerChat(server, client);
	registerModeration(server, client);

	registerState(server, client);
}
