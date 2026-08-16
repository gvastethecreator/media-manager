import type { ErrorRequestHandler, Response } from 'express';

interface RequestSizeError {
	status?: unknown;
	statusCode?: unknown;
	type?: unknown;
}

function requestId(response: Response): string | undefined {
	const value = response.locals.requestId;
	return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function isPayloadTooLarge(error: unknown): boolean {
	if (!error || typeof error !== 'object') return false;
	const requestError = error as RequestSizeError;
	return requestError.type === 'entity.too.large' || requestError.status === 413 || requestError.statusCode === 413;
}

function errorContext(response: Response): { requestId?: string } {
	const id = requestId(response);
	return id ? { requestId: id } : {};
}

export const publicErrorHandler: ErrorRequestHandler = (error, _request, response, next): void => {
	if (response.headersSent) {
		next(error);
		return;
	}
	if (isPayloadTooLarge(error)) {
		response.status(413).json({
			code: 'PAYLOAD_TOO_LARGE',
			message: 'El cuerpo de la solicitud supera el límite permitido.',
			retryable: false,
			...errorContext(response),
		});
		return;
	}
	response.status(500).json({
		code: 'INTERNAL_SERVER_ERROR',
		message: 'Ocurrió un error interno.',
		retryable: false,
		...errorContext(response),
	});
};
