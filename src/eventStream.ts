import type { LumiaConfig } from './config.js';

export interface LumiaEvent {
	origin?: string;
	subOrigin?: string;
	type?: string;
	event?: string;
	data?: unknown;
	receivedAt: string;
	[key: string]: unknown;
}

interface Waiter {
	match: (event: LumiaEvent) => boolean;
	resolve: (event: LumiaEvent) => void;
	timer: NodeJS.Timeout;
}

export class LumiaEventStream {
	private ws?: WebSocket;
	private readonly buffer: LumiaEvent[] = [];
	private readonly waiters = new Set<Waiter>();
	private stopped = false;
	private connected = false;
	private reconnectDelay = 1000;

	constructor(
		private readonly config: LumiaConfig,
		private readonly maxBuffer = 200,
	) {}

	start(): void {
		if (!this.config.token || this.stopped) return;
		this.connect();
	}

	private url(): string {
		const scheme = this.config.secure ? 'wss' : 'ws';
		const params = new URLSearchParams({ token: this.config.token, name: 'mcp-server' });
		return `${scheme}://${this.config.host}:${this.config.port}/api?${params.toString()}`;
	}

	private connect(): void {
		try {
			const ws = new WebSocket(this.url());
			this.ws = ws;
			ws.addEventListener('open', () => {
				this.connected = true;
				this.reconnectDelay = 1000;
			});
			ws.addEventListener('message', (event: MessageEvent) => {
				this.onMessage(event.data);
			});
			ws.addEventListener('close', () => {
				this.connected = false;
				this.scheduleReconnect();
			});
			ws.addEventListener('error', () => {
				this.connected = false;
			});
		} catch {
			this.scheduleReconnect();
		}
	}

	private scheduleReconnect(): void {
		if (this.stopped) return;
		const delay = this.reconnectDelay;
		this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
		setTimeout(() => {
			if (!this.stopped) this.connect();
		}, delay);
	}

	private onMessage(raw: unknown): void {
		let parsed: unknown;
		try {
			parsed = JSON.parse(typeof raw === 'string' ? raw : String(raw));
		} catch {
			return;
		}
		if (!parsed || typeof parsed !== 'object' || typeof (parsed as LumiaEvent).type !== 'string') return;

		const event: LumiaEvent = { ...(parsed as Record<string, unknown>), receivedAt: new Date().toISOString() };
		this.buffer.push(event);
		if (this.buffer.length > this.maxBuffer) this.buffer.shift();

		for (const waiter of [...this.waiters]) {
			if (waiter.match(event)) {
				clearTimeout(waiter.timer);
				this.waiters.delete(waiter);
				waiter.resolve(event);
			}
		}
	}

	private matcher(type?: string, origin?: string): (event: LumiaEvent) => boolean {
		const needle = type?.toLowerCase();
		return (event) => {
			if (origin && event.origin !== origin) return false;
			if (!needle) return true;
			return `${event.type ?? ''} ${event.event ?? ''}`.toLowerCase().includes(needle);
		};
	}

	recent(opts: { type?: string; origin?: string; limit?: number } = {}): LumiaEvent[] {
		const match = this.matcher(opts.type, opts.origin);
		return this.buffer.filter(match).slice(-(opts.limit ?? 20));
	}

	waitFor(opts: { type?: string; origin?: string; timeoutMs: number }): Promise<LumiaEvent | null> {
		return new Promise((resolve) => {
			const match = this.matcher(opts.type, opts.origin);
			const timer = setTimeout(() => {
				this.waiters.delete(waiter);
				resolve(null);
			}, opts.timeoutMs);
			const waiter: Waiter = { match, resolve, timer };
			this.waiters.add(waiter);
		});
	}

	status(): { connected: boolean; buffered: number; hasToken: boolean } {
		return { connected: this.connected, buffered: this.buffer.length, hasToken: Boolean(this.config.token) };
	}

	stop(): void {
		this.stopped = true;
		try {
			this.ws?.close();
		} catch {
			// ignore
		}
	}
}
