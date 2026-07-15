/** Advanced metadata extraction through authorized root/asset references. */

import { readFile, stat } from 'node:fs/promises';
import { basename } from 'node:path';
import express from 'express';
import { serverLogger } from '@/lib/logger/server-logger';
import {
	getAuthorizedRootRegistry,
	parseAuthorizedPathReference,
	sendRootAuthorizationError,
} from '@/server/security/authorized-root-request';
import { parseMediaAssetReference, resolveMediaAssetReference } from '@/server/security/media-asset-reference';

const router = express.Router();
const logger = serverLogger.withContext('MetadataAdvancedAPI');
const MAX_METADATA_FILE_BYTES = 100 * 1024 * 1024;

router.post('/extract', async (request, response) => {
	try {
		const registry = getAuthorizedRootRegistry(request);
		const asset = request.body?.asset === undefined ? undefined : parseMediaAssetReference(request.body.asset);
		const source = asset ? undefined : parseAuthorizedPathReference(request.body?.source);
		const resolved = asset
			? await resolveMediaAssetReference(registry, asset, 'read')
			: await registry.resolve(source!, 'read');
		const fileStat = await stat(resolved.absolutePath);
		if (!fileStat.isFile()) {
			response.status(404).json({ code: 'FILE_NOT_FOUND', message: 'El recurso no es un archivo.', retryable: false });
			return;
		}
		if (fileStat.size > MAX_METADATA_FILE_BYTES) {
			response.status(413).json({
				code: 'METADATA_FILE_TOO_LARGE',
				message: 'El archivo excede el límite de extracción de metadatos.',
				retryable: false,
			});
			return;
		}
		const [{ extractAllMetadata }, fileBuffer] = await Promise.all([
			import('@/server/services/metadata/unified-parser.service'),
			readFile(resolved.absolutePath),
		]);
		const metadata = await extractAllMetadata(fileBuffer, basename(resolved.absolutePath), {}, resolved.absolutePath);
		logger.info('Metadata extracted from authorized source', { assetType: asset?.assetType, size: fileBuffer.length });
		response.json({
			extractedAt: new Date().toISOString(),
			metadata,
			source: asset ?? source,
			success: true,
		});
	} catch (error) {
		if (sendRootAuthorizationError(response, error)) return;
		const code = (error as NodeJS.ErrnoException | undefined)?.code;
		logger.error('Authorized metadata extraction failed', { code: code ?? 'METADATA_EXTRACTION_FAILED' });
		response.status(code === 'ENOENT' ? 404 : 500).json({
			code: code === 'ENOENT' ? 'FILE_NOT_FOUND' : 'METADATA_EXTRACTION_FAILED',
			message: code === 'ENOENT' ? 'El recurso solicitado no existe.' : 'No se pudieron extraer los metadatos.',
			retryable: false,
		});
	}
});

export default router;
