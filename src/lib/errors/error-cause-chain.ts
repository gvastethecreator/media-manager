const MAX_ERROR_CAUSE_DEPTH = 5;

export function errorCauseMessages(error: Error): string[] {
	const messages: string[] = [];
	const visited = new Set<Error>();
	let current: Error | undefined = error;

	for (let depth = 0; current && depth < MAX_ERROR_CAUSE_DEPTH; depth += 1) {
		if (visited.has(current)) break;
		visited.add(current);
		messages.push(current.message.toLowerCase());
		current = current.cause instanceof Error ? current.cause : undefined;
	}

	return messages;
}
