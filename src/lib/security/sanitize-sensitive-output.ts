const PRIVATE_PATH_FIELDS = new Set([
	'absolutePath',
	'destPath',
	'destinationPath',
	'filePath',
	'originalPath',
	'parentPath',
	'path',
	'sourcePath',
]);

const PATH_TERMINATOR = String.raw`\r\n"'<>|,;()\[\]{}`;
const FILE_URL = new RegExp(String.raw`file:\/\/{1,3}[^${PATH_TERMINATOR}]*`, 'gi');
const WINDOWS_ABSOLUTE_PATH = new RegExp(
	String.raw`(?<![a-zA-Z0-9])(?:[a-zA-Z]:[\\/]|\\\\(?:[.?]\\)?)(?:[^${PATH_TERMINATOR}]*?\.[a-zA-Z0-9]{1,16}|[^${PATH_TERMINATOR}]*)`,
	'g'
);
const POSIX_PRIVATE_PATH = new RegExp(
	String.raw`(?<![:/a-zA-Z0-9])\/(?:data|etc|home|media|mnt|opt|private|root|run|srv|tmp|usr|Users|var)(?:\/[^${PATH_TERMINATOR}]*)*`,
	'g'
);

export function sanitizeSensitiveText(value: string): string {
	return value
		.replace(FILE_URL, '[redacted-path]')
		.replace(WINDOWS_ABSOLUTE_PATH, '[redacted-path]')
		.replace(POSIX_PRIVATE_PATH, '[redacted-path]');
}

function isPrivatePathField(field: string): boolean {
	return (
		PRIVATE_PATH_FIELDS.has(field) || (field !== 'relativePath' && field.toLocaleLowerCase('en-US').endsWith('path'))
	);
}

function sanitizeValue(value: unknown, seen: WeakSet<object>): unknown {
	if (typeof value === 'string') return sanitizeSensitiveText(value);
	if (value === null || value === undefined || typeof value !== 'object') return value;
	if (value instanceof Date || (typeof Buffer !== 'undefined' && Buffer.isBuffer(value))) return value;
	if (value instanceof Error) {
		return {
			message: sanitizeSensitiveText(value.message),
			name: value.name,
			...(value.stack && { stack: sanitizeSensitiveText(value.stack) }),
		};
	}
	if (seen.has(value)) return '[circular]';
	seen.add(value);
	if (Array.isArray(value)) return value.map((item) => sanitizeValue(item, seen));

	const sanitized: Record<string, unknown> = {};
	for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
		if (!isPrivatePathField(key)) sanitized[key] = sanitizeValue(item, seen);
	}
	return sanitized;
}

export function sanitizeSensitiveOutput(value: unknown): unknown {
	return sanitizeValue(value, new WeakSet());
}
