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

const SECRET_FIELDS = new Set([
	'apikey',
	'authorization',
	'cookie',
	'databaseurl',
	'password',
	'refreshtoken',
	'secret',
	'sessiontoken',
	'token',
]);

const AUTHORED_LOG_FIELDS = new Set([
	'body',
	'content',
	'data',
	'description',
	'filename',
	'input',
	'jsonstring',
	'metadata',
	'name',
	'note',
	'payload',
	'prompt',
	'requestbody',
	'responsebody',
	'settings',
	'summary',
	'tag',
	'tagdata',
	'title',
	'updates',
]);

const IDENTIFIER_LOG_FIELDS = new Set([
	'id',
	'albumid',
	'assetid',
	'audioid',
	'characterid',
	'collectionid',
	'conceptid',
	'documentid',
	'entityid',
	'file3did',
	'fileid',
	'folderid',
	'groupid',
	'imageid',
	'jobid',
	'jsonfileid',
	'mediaid',
	'noteid',
	'operationid',
	'parentid',
	'placeid',
	'profileid',
	'promptid',
	'propertyid',
	'rootid',
	'sourcefileid',
	'tagid',
	'thumbnailid',
	'videoid',
	'wildcardid',
	'worlditemid',
]);

const HASH_LOG_FIELDS = new Set(['checksum', 'contenthash', 'hash']);

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
const UUID = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;
const SHA_256 = /\b[a-f0-9]{64}\b/gi;

export function sanitizeSensitiveText(value: string): string {
	return value
		.replace(FILE_URL, '[redacted-path]')
		.replace(WINDOWS_ABSOLUTE_PATH, '[redacted-path]')
		.replace(POSIX_PRIVATE_PATH, '[redacted-path]');
}

export function sanitizeSensitiveLogText(value: string): string {
	return sanitizeSensitiveText(value).replace(UUID, '[redacted-id]').replace(SHA_256, '[redacted-hash]');
}

function isPrivatePathField(field: string): boolean {
	return (
		PRIVATE_PATH_FIELDS.has(field) || (field !== 'relativePath' && field.toLocaleLowerCase('en-US').endsWith('path'))
	);
}

function isSecretField(field: string): boolean {
	return SECRET_FIELDS.has(field.replace(/[-_]/g, '').toLocaleLowerCase('en-US'));
}

function isAuthoredLogField(field: string): boolean {
	const normalized = field.replace(/[-_]/g, '').toLocaleLowerCase('en-US');
	return AUTHORED_LOG_FIELDS.has(normalized) || normalized.endsWith('prompt');
}

function isIdentifierLogField(field: string): boolean {
	return IDENTIFIER_LOG_FIELDS.has(field.replace(/[-_]/g, '').toLocaleLowerCase('en-US'));
}

function isHashLogField(field: string): boolean {
	return HASH_LOG_FIELDS.has(field.replace(/[-_]/g, '').toLocaleLowerCase('en-US'));
}

function sanitizeValue(
	value: unknown,
	seen: WeakSet<object>,
	preserveText: boolean,
	preserveTextFields: ReadonlySet<string>,
	redactAuthoredFields: boolean,
	redactIdentifiers: boolean
): unknown {
	if (typeof value === 'string')
		return preserveText ? value : redactIdentifiers ? sanitizeSensitiveLogText(value) : sanitizeSensitiveText(value);
	if (value === null || value === undefined || typeof value !== 'object') return value;
	if (value instanceof Date || (typeof Buffer !== 'undefined' && Buffer.isBuffer(value))) return value;
	if (value instanceof Error) {
		return {
			message: redactIdentifiers ? sanitizeSensitiveLogText(value.message) : sanitizeSensitiveText(value.message),
			name: value.name,
			...(value.stack && {
				stack: redactIdentifiers ? sanitizeSensitiveLogText(value.stack) : sanitizeSensitiveText(value.stack),
			}),
		};
	}
	if (seen.has(value)) return '[circular]';
	seen.add(value);
	if (Array.isArray(value)) {
		return value.map((item) =>
			sanitizeValue(item, seen, preserveText, preserveTextFields, redactAuthoredFields, redactIdentifiers)
		);
	}

	const sanitized: Record<string, unknown> = {};
	for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
		if (isSecretField(key)) {
			sanitized[key] = '[redacted]';
		} else if (redactAuthoredFields && isAuthoredLogField(key)) {
			sanitized[key] = '[redacted-content]';
		} else if (redactIdentifiers && isIdentifierLogField(key)) {
			sanitized[key] = '[redacted-id]';
		} else if (redactIdentifiers && isHashLogField(key)) {
			sanitized[key] = '[redacted-hash]';
		} else if (!isPrivatePathField(key)) {
			sanitized[key] = sanitizeValue(
				item,
				seen,
				preserveText || preserveTextFields.has(key),
				preserveTextFields,
				redactAuthoredFields,
				redactIdentifiers
			);
		}
	}
	return sanitized;
}

export function sanitizeSensitiveOutput(
	value: unknown,
	options: { preserveTextFields?: ReadonlySet<string> } = {}
): unknown {
	return sanitizeValue(value, new WeakSet(), false, options.preserveTextFields ?? new Set(), false, false);
}

export function sanitizeSensitiveLogOutput(value: unknown): unknown {
	if (typeof value === 'string') return value.length === 0 ? '' : '[redacted-content]';
	return sanitizeValue(value, new WeakSet(), false, new Set(), true, true);
}
