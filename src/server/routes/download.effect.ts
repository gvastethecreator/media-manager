/** Download routes backed by authorized root or asset references. */

import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import express from 'express';
import { serverLogger } from '@/lib/logger/server-logger';
import { getMimeTypeFromExtension } from '@/services/file-entity-mapper/utils/file-info.utils';
import {
	getAuthorizedRootRegistry,
	parseAuthorizedPathQuery,
	parseAuthorizedPathReference,
	sendRootAuthorizationError,
} from '@/server/security/authorized-root-request';
import { setAuthorizedFileDeliveryHeaders } from '@/server/security/authorized-asset-cache';
import { parseMediaAssetReference, resolveMediaAssetReference } from '@/server/security/media-asset-reference';

const router = express.Router();
const logger = serverLogger.withContext('DownloadAPI');

const encodeRFC5987Value = (value: string): string =>
	encodeURIComponent(value)
		.replace(/['()]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`)
		.replace(/\*/g, '%2A');

const createAttachmentHeader = (fileName: string): string => {
	const fallbackName =
		fileName
			.replace(/[^\x20-\x7E]/g, '_')
			.replace(/["\\;]/g, '_')
			.trim() || 'download';
	return `attachment; filename="${fallbackName}"; filename*=UTF-8''${encodeRFC5987Value(fileName)}`;
};

interface DownloadRequest {
	app: { locals: Record<string, unknown> };
	body?: { asset?: unknown; source?: unknown };
	fresh: boolean;
	method: string;
	query: Record<string, unknown>;
}

async function resolveDownloadPath(request: DownloadRequest) {
	const registry = getAuthorizedRootRegistry(request);
	if (request.method === 'POST') {
		if (request.body?.asset !== undefined) {
			return resolveMediaAssetReference(registry, parseMediaAssetReference(request.body.asset), 'export');
		}
		return registry.resolve(parseAuthorizedPathReference(request.body?.source), 'export');
	}
	if (request.query.assetId !== undefined || request.query.assetType !== undefined) {
		return resolveMediaAssetReference(
			registry,
			parseMediaAssetReference({ assetId: request.query.assetId, assetType: request.query.assetType }),
			'export'
		);
	}
	return registry.resolve(parseAuthorizedPathQuery(request), 'export');
}

function sendDownloadError(response: express.Response, error: unknown): void {
	if (sendRootAuthorizationError(response, error)) return;
	const code = (error as NodeJS.ErrnoException | undefined)?.code;
	logger.error('Authorized download failed', { code: code ?? 'DOWNLOAD_FAILED' });
	response.status(code === 'ENOENT' ? 404 : 500).json({
		code: code === 'ENOENT' ? 'FILE_NOT_FOUND' : 'DOWNLOAD_FAILED',
		message: code === 'ENOENT' ? 'El recurso solicitado no existe.' : 'No se pudo descargar el recurso.',
		retryable: false,
	});
}

async function downloadHandler(request: DownloadRequest, response: express.Response): Promise<void> {
	try {
		const resolved = await resolveDownloadPath(request);
		const fileStat = await stat(resolved.absolutePath);
		if (!fileStat.isFile()) {
			response.status(404).json({ code: 'FILE_NOT_FOUND', message: 'El recurso no es un archivo.', retryable: false });
			return;
		}
		const fileName = basename(resolved.absolutePath);
		response.set({
			'Content-Disposition': createAttachmentHeader(fileName),
			'Content-Length': fileStat.size.toString(),
			'Content-Type': getMimeTypeFromExtension(extname(resolved.absolutePath)),
		});
		if (setAuthorizedFileDeliveryHeaders(request, response, fileStat)) {
			response.status(304).end();
			return;
		}
		const stream = createReadStream(resolved.absolutePath);
		response.on('close', () => stream.destroy());
		stream.on('error', (error) => {
			logger.error('Authorized download stream failed', {
				code: (error as NodeJS.ErrnoException).code ?? 'STREAM_ERROR',
			});
			if (!response.headersSent) sendDownloadError(response, error);
			else response.destroy();
		});
		stream.pipe(response);
	} catch (error) {
		sendDownloadError(response, error);
	}
}

router.post('/', downloadHandler);
router.get('/', downloadHandler);

export default router;
export { router as downloadEffectRouter };
