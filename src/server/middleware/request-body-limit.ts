import type { NextFunction, Request, RequestHandler, Response } from 'express-serve-static-core';

export class RequestBodyTooLargeError extends Error {
	readonly status = 413;
	readonly statusCode = 413;
	readonly type = 'entity.too.large';

	constructor() {
		super('Request body exceeds the configured limit.');
	}
}

function declaredContentLength(request: Request): number | undefined {
	const rawLength = request.headers['content-length'];
	if (typeof rawLength !== 'string') return undefined;
	const length = Number(rawLength);
	return Number.isSafeInteger(length) && length >= 0 ? length : undefined;
}

function isHandledByBodyParser(request: Request): boolean {
	const contentType = request.headers['content-type']?.split(';', 1)[0]?.trim().toLowerCase();
	return (
		contentType === 'application/json' ||
		contentType?.endsWith('+json') === true ||
		contentType === 'application/x-www-form-urlencoded'
	);
}

function needsManualDrain(request: Request, declaredLength: number | undefined): boolean {
	if (isHandledByBodyParser(request)) return false;
	if (declaredLength !== undefined) return declaredLength > 0;
	return typeof request.headers['transfer-encoding'] === 'string';
}

function rejectAndDrain(request: Request, next: NextFunction): void {
	request.resume();
	next(new RequestBodyTooLargeError());
}

function drainUnsupportedBody(request: Request, response: Response, next: NextFunction, maxBytes: number): void {
	let receivedBytes = 0;
	let finished = false;
	const cleanup = () => {
		request.off('data', onData);
		request.off('end', onEnd);
		request.off('error', onError);
		response.off('finish', cleanup);
	};
	const reject = () => {
		if (finished) return;
		finished = true;
		cleanup();
		rejectAndDrain(request, next);
	};
	const onData = (chunk: Buffer) => {
		receivedBytes += chunk.byteLength;
		if (receivedBytes > maxBytes) reject();
	};
	const onEnd = () => {
		if (finished) return;
		finished = true;
		cleanup();
		next();
	};
	const onError = (error: Error) => {
		if (finished) return;
		finished = true;
		cleanup();
		next(error);
	};
	request.on('data', onData);
	request.once('end', onEnd);
	request.once('error', onError);
	response.once('finish', cleanup);
}

export function limitRequestBody(maxBytes: number): RequestHandler {
	return (request, response, next): void => {
		const declaredLength = declaredContentLength(request);
		if (declaredLength !== undefined && declaredLength > maxBytes) {
			rejectAndDrain(request, next);
			return;
		}
		if (!needsManualDrain(request, declaredLength)) {
			next();
			return;
		}
		drainUnsupportedBody(request, response, next, maxBytes);
	};
}
