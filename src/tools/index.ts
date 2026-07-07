import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { LumiaClient } from '../client.js';
import { registerAlerts } from './alerts.js';
import { registerColor } from './color.js';
import { registerCommands } from './commands.js';
import { registerSettings } from './settings.js';
import { registerTts } from './tts.js';
import { registerVariables } from './variables.js';

export function registerTools(server: McpServer, client: LumiaClient): void {
	registerSettings(server, client);
	registerCommands(server, client);
	registerColor(server, client);
	registerAlerts(server, client);
	registerVariables(server, client);
	registerTts(server, client);
}
