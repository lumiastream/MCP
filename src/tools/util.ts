export function toResult(data: unknown) {
	const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
	return { content: [{ type: 'text' as const, text }] };
}

export function toError(error: unknown) {
	const message = error instanceof Error ? error.message : String(error);
	return { content: [{ type: 'text' as const, text: message }], isError: true };
}
