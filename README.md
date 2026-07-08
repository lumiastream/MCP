# @lumiastream/mcp

A [Model Context Protocol](https://modelcontextprotocol.io) server for [Lumia Stream](https://lumiastream.com). It exposes Lumia's local API as MCP tools so an AI assistant (Claude Desktop, Claude Code, Cursor, etc.) can control lights, trigger commands and alerts, run TTS, post to and moderate chat, read live stream state, and react to events in real time.

It is a thin adapter over the local Lumia API (`http://localhost:39231/api`) plus its event WebSocket — the app does all the real work.

## Prerequisites

- Node.js ≥ 20
- Lumia Stream running on the same machine
- The REST API enabled in Lumia: **Settings → API** (toggle it on and copy the **token**)

## Tools

**Discover & state**
- `get_settings` — commands, alerts, connected lights, studio scenes/themes/animations, TTS voices. Call this first.
- `get_state` — snapshot: live status, viewers, follower/subscriber counts, latest names, now-playing song, heart rate.
- `get_variable` / `get_variables` / `set_variable` — read one or many Lumia variables, or write one.

**Lights & studio**
- `set_color` — hex, RGB, or color temperature, with brightness/transition/duration.
- `set_studio` — trigger a studio scene, theme, or animation.
- `set_lumia_state` — start/stop/toggle Lumia, or reset lights to default.

**Trigger commands & alerts**
- `trigger_command` — chat / chatbot / Twitch-points / Twitch-extension command by name.
- `trigger_alert` — simulate a platform alert (e.g. `twitch-follower`, `kofi-donation`).

**Chat, voice & moderation**
- `send_chat_message` — post to chat as the bot or as yourself.
- `speak` — text-to-speech through Lumia's engine.
- `shoutout` — clip + chat shoutout for a user.
- `moderate_user` — ban / unban / timeout / VIP.
- `delete_message` — remove a message by id.
- `translate_message` — translate and post to chat.

**Stream management**
- `set_stream_info` — change the stream title and/or category (Twitch, Kick).
- `create_clip` — create a Twitch clip; its id/url land in the `twitch_last_clip_*` variables.
- `create_stream_marker` — mark the current moment of the Twitch broadcast.
- `send_announcement` — highlighted Twitch chat announcement.
- `run_commercial` — run a Twitch ad break (30–180 seconds).
- `set_chat_mode` — toggle Twitch slow / subscriber-only / follower-only / emote-only chat.
- `create_poll` / `end_poll` — start a Twitch poll; end it (archive, or terminate leaving it visible).
- `create_prediction` / `end_prediction` — start a Twitch prediction; resolve it with the winning outcome, or cancel and refund.
- `clear_chat` — clear Twitch chat for everyone.
- `pin_message` — pin or unpin a Twitch chat message.
- `manage_moderator` — grant or revoke Twitch moderator.
- `control_song_request` — add/skip/play/pause/remove/clear song requests.
- `get_loyalty_points` — read a viewer's loyalty points balance.
- `set_counter` — set a counter variable to an exact value.
- `manage_chatbot_command` — create/update/delete a chatbot command (unlimited on every plan).

**Overlays, session & economy**
- `control_overlay` — show/hide overlays and layers, move and resize layers, set content.
- `set_stream_mode` — stream mode on/off/toggle.
- `control_queue` — pause/resume/clear the queue, clear cooldowns.
- `set_command_state` — enable/disable a command or folder.
- `control_fuze` — start/stop/toggle Fuze, set audio sensitivity.
- `loyalty_points` — add or remove a viewer's loyalty points.

**Real-time**
- `get_recent_events` — recent live events (chat, follows, subs, bits, raids, donations) since the server started.
- `wait_for_event` — block until the next matching event (e.g. the next follower), then react.

Also a `lumia://settings` **resource** mirroring `get_settings`, and **prompts** (slash-commands in most clients): `start_stream`, `brb`, `hype`, `wind_down`, `thank_new_followers`.

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

Step-by-step instructions for each client (Claude Desktop, Claude Code, Cursor, Codex, VS Code, Windsurf, Gemini CLI) are in the [setup guide](https://dev.lumiastream.com/docs/mcp/setup).

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

Each `type` in the Lumia [Send API](https://dev.lumiastream.com/docs/rest) maps to a tool. To add one:

1. Create `src/tools/<name>.ts` exporting `register<Name>(server, client)` — copy an existing file.
2. Define the `inputSchema` (zod) and map inputs to `client.send('<type>', params)`.
3. Register it in `src/tools/index.ts`.

Remember the Lumia param convention: `params.value` is the target/name and `params.message` is the content/payload.
