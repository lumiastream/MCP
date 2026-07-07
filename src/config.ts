export interface LumiaConfig {
	host: string;
	port: number;
	token: string;
	secure: boolean;
}

export function loadConfig(): LumiaConfig {
	return {
		host: process.env.LUMIA_HOST?.trim() || '127.0.0.1',
		port: Number(process.env.LUMIA_PORT) || 39231,
		token: process.env.LUMIA_TOKEN?.trim() || '',
		secure: process.env.LUMIA_SECURE === 'true',
	};
}
