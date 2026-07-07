import type { LumiaConfig } from './config.js';

export interface SendResponse {
	status: number;
	message?: unknown;
	[key: string]: unknown;
}

export class LumiaClient {
	constructor(private readonly config: LumiaConfig) {}

	async retrieve(): Promise<Record<string, unknown>> {
		return this.request('GET', '/retrieve') as Promise<Record<string, unknown>>;
	}

	async send(type: string, params: Record<string, unknown> = {}): Promise<SendResponse> {
		return this.request('POST', '/send', { type, params }) as Promise<SendResponse>;
	}

	private baseUrl(): string {
		const scheme = this.config.secure ? 'https' : 'http';
		return `${scheme}://${this.config.host}:${this.config.port}/api`;
	}

	private async request(method: string, path: string, body?: unknown): Promise<unknown> {
		if (!this.config.token) {
			throw new Error(
				'LUMIA_TOKEN is not set. In Lumia Stream open Settings → API, enable the API, and copy the token into the LUMIA_TOKEN env var.',
			);
		}

		let res: Response;
		try {
			res = await fetch(`${this.baseUrl()}${path}`, {
				method,
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${this.config.token}`,
				},
				body: body === undefined ? undefined : JSON.stringify(body),
			});
		} catch (error) {
			throw new Error(
				`Could not reach Lumia Stream at ${this.baseUrl()}. Is the app running with the API enabled? (${error instanceof Error ? error.message : String(error)})`,
			);
		}

		const text = await res.text();
		let data: unknown = text;
		try {
			data = text ? JSON.parse(text) : {};
		} catch {
			data = text;
		}

		if (!res.ok) {
			if (res.status === 401) {
				throw new Error('Lumia rejected the token (401). Check that LUMIA_TOKEN matches Settings → API.');
			}
			const detail = typeof data === 'string' ? data : JSON.stringify(data);
			throw new Error(`Lumia API error ${res.status}: ${detail || res.statusText}`);
		}

		return data;
	}
}
