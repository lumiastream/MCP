# @lumiastream/mcp

A [Model Context Protocol](https://modelcontextprotocol.io) server for [Lumia Stream](https://lumiastream.com). It exposes Lumia's local REST API as MCP tools so an AI assistant (Claude Desktop, Claude Code, Cursor, etc.) can trigger commands, set light colors, fire alerts, run TTS, and read/write variables.

It is a thin adapter over the local Lumia API (`http://localhost:39231/api`) — the app does all the real work.

## Prerequisites

- Node.js ≥ 20
- Lumia Stream running on the same machine
- The REST API enabled in Lumia: **Settings → API** (toggle it on and copy the **token**)

## Tools

| Tool | Description |
| --- | --- |
| `get_settings` | Discover what the user actually has: commands, alerts, connected lights, studio scenes/themes/animations, TTS voices. Call this first. |
| `trigger_command` | Run a chat / chatbot / Twitch-points / Twitch-extension command by name. |
| `set_color` | Set light color by hex, rgb, or color temperature (with brightness/transition/duration). |
| `trigger_alert` | Simulate a platform alert (e.g. `twitch-follower`, `kofi-donation`). |
| `get_variable` / `set_variable` | Read or write a Lumia variable. |
| `speak` | Text-to-speech through Lumia's engine. |

There is also a `lumia://settings` **resource** mirroring `get_settings` for clients that read resources as context.

## Configuration

Environment variables:

| Var | Default | Notes |
| --- | --- | --- |
| `LUMIA_TOKEN` | — | **Required.** From Settings → API. |
| `LUMIA_HOST` | `127.0.0.1` | |
| `LUMIA_PORT` | `39231` | |
| `LUMIA_SECURE` | `false` | Set `true` to use the HTTPS port. |

## Use with an MCP client

Once published, point your client at it via `npx`:

```json
{
	"mcpServers": {
		"lumia-stream": {
			"command": "npx",
			"args": ["-y", "@lumiastream/mcp"],
			"env": {
				"LUMIA_TOKEN": "your_token_here"
			}
		}
	}
}
```

### Local development

```bash
npm install
npm run build
```

Then point the client at the built entry:

```json
{
	"mcpServers": {
		"lumia-stream": {
			"command": "node",
			"args": ["/absolute/path/to/Lumia-MCP/dist/index.js"],
			"env": {
				"LUMIA_TOKEN": "your_token_here"
			}
		}
	}
}
```

## Verify

`npm run smoke` builds nothing but connects to `dist/index.js` over stdio, lists the tools/resources, and calls `get_settings`. With a real token it returns live settings; without one it exercises the auth/error path:

```bash
npm run build
LUMIA_TOKEN=your_token_here npm run smoke
```

## Adding a tool

Each `type` in the Lumia [Send API](https://developer.lumiastream.com/docs/rest) maps to a tool. To add one:

1. Create `src/tools/<name>.ts` exporting `register<Name>(server, client)` — copy an existing file.
2. Define the `inputSchema` (zod) and map inputs to `client.send('<type>', params)`.
3. Register it in `src/tools/index.ts`.

Remember the Lumia param convention: `params.value` is the target/name and `params.message` is the content/payload.
