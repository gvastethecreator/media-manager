export const API_JSON_BODY_LIMIT = '4mb';
export const API_URLENCODED_BODY_LIMIT = '64kb';
export const MAX_REQUEST_BODY_BYTES = 4 * 1024 * 1024;
export const MAX_BROKER_REQUEST_BODY_BYTES = MAX_REQUEST_BODY_BYTES + 64 * 1024;
export const MAX_REQUEST_HEADER_BYTES = 32 * 1024;

export const API_HTTP_SERVER_OPTIONS = {
	headersTimeout: 15_000,
	maxHeaderSize: MAX_REQUEST_HEADER_BYTES,
	requestTimeout: 60_000,
} as const;

export const BROKER_IDLE_TIMEOUT_SECONDS = 60;
