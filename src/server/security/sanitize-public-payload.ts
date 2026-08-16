import type { RequestHandler, Response } from 'express';
import { sanitizeSensitiveOutput } from '@/lib/security/sanitize-sensitive-output';

export function sanitizePublicPayload(value: unknown): unknown {
	return sanitizeSensitiveOutput(value);
}

const PRESERVED_TEXT_FIELDS_LOCAL = 'preservedPublicTextFields';

export function preserveJsonResponseTextFields(...fields: string[]): RequestHandler {
	return (_request, response, next): void => {
		const existing = response.locals[PRESERVED_TEXT_FIELDS_LOCAL];
		const preserved = existing instanceof Set ? new Set<string>(existing) : new Set<string>();
		for (const field of fields) preserved.add(field);
		response.locals[PRESERVED_TEXT_FIELDS_LOCAL] = preserved;
		next();
	};
}

export const sanitizeJsonResponses: RequestHandler = (_request, response, next): void => {
	const sendJson = response.json.bind(response);
	response.json = ((body: unknown) => {
		const preserved = response.locals[PRESERVED_TEXT_FIELDS_LOCAL];
		return sendJson(
			sanitizeSensitiveOutput(body, {
				preserveTextFields: preserved instanceof Set ? preserved : undefined,
			})
		);
	}) as Response['json'];
	next();
};
