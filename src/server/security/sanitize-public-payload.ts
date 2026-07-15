import type { RequestHandler, Response } from 'express';
import { sanitizeSensitiveOutput } from '@/lib/security/sanitize-sensitive-output';

export function sanitizePublicPayload(value: unknown): unknown {
	return sanitizeSensitiveOutput(value);
}

export const sanitizeJsonResponses: RequestHandler = (_request, response, next): void => {
	const sendJson = response.json.bind(response);
	response.json = ((body: unknown) => sendJson(sanitizePublicPayload(body))) as Response['json'];
	next();
};
