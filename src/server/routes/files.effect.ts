/**
 * Filesystem routes. API callers use opaque root/asset references; absolute paths remain server-only.
 */

import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import express from 'express';
import { serverLogger } from '@/lib/logger/server-logger';
import { getDirectoryInfoConcurrent } from '@/services/file/file.service';
import { getMimeTypeFromExtension } from '@/services/file-entity-mapper/utils/file-info.utils';
import {
	AuthorizedFileMutationError,
	commitAuthorizedFileRelocation,
} from '@/server/security/authorized-file-mutation';
import {
	getAuthorizedRootRegistry,
	parseAuthorizedPathQuery,
	resolveAuthorizedFolderById,
	sendRootAuthorizationError,
} from '@/server/security/authorized-root-request';
import {
	getMediaAssetLocation,
	type MediaAssetReference,
	parseMediaAssetReference,
	resolveMediaAssetReference,
	updateMediaAssetLocation,
} from '@/server/security/media-asset-reference';
import { prepareFileMutationRecovery } from '@/server/security/file-mutation-recovery';
import { type AuthorizedPathReference, RootAuthorizationError } from '@/server/security/authorized-roots';

const router = express.Router();
const logger = serverLogger.withContext('FilesAPI');

function safeOperationError(response: express.Response, error: unknown): void {
	if (sendRootAuthorizationError(response, error)) return;
	if (error instanceof AuthorizedFileMutationError) {
		response.status(error.status).json({ code: error.code, message: error.message, retryable: false });
		return;
	}
	const declaredStatus = (error as { status?: unknown } | undefined)?.status;
	if (typeof declaredStatus === 'number' && declaredStatus >= 400 && declaredStatus <= 599) {
		response.status(declaredStatus).json({
			code:
				typeof (error as { code?: unknown }).code === 'string'
					? (error as { code: string }).code
					: 'FILE_OPERATION_FAILED',
			message: error instanceof Error ? error.message : 'No se pudo completar la operación.',
			retryable: false,
		});
		return;
	}
	const code = (error as NodeJS.ErrnoException | undefined)?.code;
	const status = code === 'ENOENT' ? 404 : code === 'EEXIST' ? 409 : code === 'EACCES' || code === 'EPERM' ? 403 : 500;
	logger.error('Filesystem operation failed', { code: code ?? 'FILE_OPERATION_FAILED' });
	response.status(status).json({
		code: status === 404 ? 'FILE_NOT_FOUND' : 'FILE_OPERATION_FAILED',
		message: status === 404 ? 'El recurso solicitado no existe.' : 'No se pudo completar la operación.',
		retryable: false,
	});
}

function joinRelativePath(parent: string, name: string): string {
	return parent ? `${parent}/${name}` : name;
}

function parseAssetList(value: unknown, field = 'assets'): MediaAssetReference[] {
	if (!Array.isArray(value) || value.length !== 1) {
		throw new RootAuthorizationError('ROOT_PATH_INVALID', `${field} debe contener exactamente un asset.`, 400);
	}
	return value.map(parseMediaAssetReference);
}

function parentRelativePath(path: string): string {
	const separatorIndex = path.lastIndexOf('/');
	return separatorIndex < 0 ? '' : path.slice(0, separatorIndex);
}

function sanitizeDirectoryResult(
	result: Awaited<ReturnType<typeof getDirectoryInfoConcurrent>>,
	reference: AuthorizedPathReference
) {
	return {
		items: result.items.map((item) => {
			const {
				absolutePath: _absolutePath,
				parentPath: _parentPath,
				path: _path,
				relativePath: _legacyRelativePath,
				...safeItem
			} = item;
			return {
				...safeItem,
				relativePath: joinRelativePath(reference.relativePath, item.name),
				rootId: reference.rootId,
			};
		}),
		relativePath: reference.relativePath,
		rootId: reference.rootId,
		total: result.total,
	};
}

async function resolveContentPath(request: {
	app: { locals: Record<string, unknown> };
	query: Record<string, unknown>;
}) {
	const registry = getAuthorizedRootRegistry(request);
	if (request.query.assetId !== undefined || request.query.assetType !== undefined) {
		return resolveMediaAssetReference(
			registry,
			parseMediaAssetReference({ assetId: request.query.assetId, assetType: request.query.assetType }),
			'read'
		);
	}
	return registry.resolve(parseAuthorizedPathQuery(request), 'read');
}

router.get('/roots', (request, response) => {
	try {
		response.json({ roots: getAuthorizedRootRegistry(request).list() });
	} catch (error) {
		safeOperationError(response, error);
	}
});

router.get('/directory', async (request, response) => {
	try {
		const reference = parseAuthorizedPathQuery(request);
		const resolved = await getAuthorizedRootRegistry(request).resolve(reference, 'index');
		const directoryInfo = await getDirectoryInfoConcurrent(resolved.absolutePath);
		response.json({ success: true, data: sanitizeDirectoryResult(directoryInfo, reference) });
	} catch (error) {
		safeOperationError(response, error);
	}
});

const retireRawFilesystemMutation: express.RequestHandler = (_request, response) => {
	response.status(410).json({
		code: 'DOMAIN_OPERATION_REQUIRED',
		message: 'La mutación filesystem directa fue retirada; usa operaciones autorizadas por asset o folder.',
		retryable: false,
	});
};

router.post('/directory', retireRawFilesystemMutation);
router.put('/rename', retireRawFilesystemMutation);
router.post('/copy', retireRawFilesystemMutation);
router.post('/move', retireRawFilesystemMutation);

router.post('/assets/move', async (request, response) => {
	try {
		const assets = parseAssetList(request.body?.assets);
		const targetFolderId = request.body?.targetFolderId;
		if (typeof targetFolderId !== 'string') {
			throw new RootAuthorizationError('ROOT_PATH_INVALID', 'targetFolderId es obligatorio.', 400);
		}
		await resolveAuthorizedFolderById(request, targetFolderId, 'index');
		const targetFolder = await resolveAuthorizedFolderById(request, targetFolderId, 'write');
		const registry = getAuthorizedRootRegistry(request);
		const moved: Array<{
			assetId: string;
			assetType: string;
			cleanupPending: boolean;
			destination: AuthorizedPathReference;
			recoveryPending: boolean;
		}> = [];

		for (const asset of assets) {
			const originalLocation = await getMediaAssetLocation(asset);
			await resolveMediaAssetReference(registry, asset, 'read');
			const source = await resolveMediaAssetReference(registry, asset, 'delete');
			const destination: AuthorizedPathReference = {
				relativePath: joinRelativePath(targetFolder.relativePath, basename(source.absolutePath)),
				rootId: targetFolder.rootId,
			};
			const relocation = await commitAuthorizedFileRelocation({
				asset,
				commit: (destinationAbsolutePath) =>
					updateMediaAssetLocation(asset, originalLocation.path, {
						folderId: targetFolderId,
						path: destinationAbsolutePath,
						source: destination,
					}),
				destination,
				prepareRecovery: prepareFileMutationRecovery,
				registry,
				rollbackCommit: (destinationAbsolutePath) =>
					updateMediaAssetLocation(asset, destinationAbsolutePath, {
						...originalLocation,
						source: originalLocation.source,
					}),
				source,
			});
			if (relocation.cleanupPending) {
				logger.warn('Asset move committed with source cleanup pending', {
					assetType: asset.assetType,
					code: 'SOURCE_CLEANUP_PENDING',
				});
			}
			moved.push({
				assetId: asset.assetId,
				assetType: asset.assetType,
				cleanupPending: relocation.cleanupPending,
				destination,
				recoveryPending: relocation.recoveryPending,
			});
		}

		response.json({ success: true, data: { moved } });
	} catch (error) {
		safeOperationError(response, error);
	}
});

router.put('/assets/rename', async (request, response) => {
	try {
		const renames = request.body?.renames;
		if (!Array.isArray(renames) || renames.length !== 1) {
			throw new RootAuthorizationError('ROOT_PATH_INVALID', 'renames debe contener exactamente un asset.', 400);
		}
		const registry = getAuthorizedRootRegistry(request);
		const renamed: Array<{
			assetId: string;
			assetType: string;
			cleanupPending: boolean;
			destination: AuthorizedPathReference;
			recoveryPending: boolean;
		}> = [];

		for (const rawRename of renames) {
			if (!(rawRename && typeof rawRename === 'object' && typeof rawRename.newName === 'string')) {
				throw new RootAuthorizationError('ROOT_PATH_INVALID', 'Cada rename requiere un asset y newName.', 400);
			}
			if (!rawRename.newName.trim()) {
				throw new RootAuthorizationError('ROOT_PATH_INVALID', 'newName no puede estar vacío.', 400);
			}
			const asset = parseMediaAssetReference(rawRename.asset);
			const originalLocation = await getMediaAssetLocation(asset);
			const source = await resolveMediaAssetReference(registry, asset, 'delete');
			const destination: AuthorizedPathReference = {
				relativePath: joinRelativePath(parentRelativePath(source.relativePath), rawRename.newName.trim()),
				rootId: source.rootId,
			};
			const relocation = await commitAuthorizedFileRelocation({
				asset,
				commit: (destinationAbsolutePath) =>
					updateMediaAssetLocation(asset, originalLocation.path, {
						name: rawRename.newName.trim(),
						path: destinationAbsolutePath,
						source: destination,
					}),
				destination,
				prepareRecovery: prepareFileMutationRecovery,
				registry,
				rollbackCommit: (destinationAbsolutePath) =>
					updateMediaAssetLocation(asset, destinationAbsolutePath, {
						...originalLocation,
						source: originalLocation.source,
					}),
				source,
			});
			if (relocation.cleanupPending) {
				logger.warn('Asset rename committed with source cleanup pending', {
					assetType: asset.assetType,
					code: 'SOURCE_CLEANUP_PENDING',
				});
			}
			renamed.push({
				assetId: asset.assetId,
				assetType: asset.assetType,
				cleanupPending: relocation.cleanupPending,
				destination,
				recoveryPending: relocation.recoveryPending,
			});
		}

		response.json({ success: true, data: { renamed } });
	} catch (error) {
		safeOperationError(response, error);
	}
});

router.get('/content', async (request, response) => {
	try {
		const resolved = await resolveContentPath(request);
		const fileStat = await stat(resolved.absolutePath);
		if (!fileStat.isFile()) {
			response.status(404).json({ code: 'FILE_NOT_FOUND', message: 'El recurso no es un archivo.', retryable: false });
			return;
		}

		response.set({
			'Content-Length': fileStat.size.toString(),
			'Content-Type': getMimeTypeFromExtension(extname(resolved.absolutePath)),
			'X-Content-Type-Options': 'nosniff',
		});
		const stream = createReadStream(resolved.absolutePath);
		response.on('close', () => stream.destroy());
		stream.on('error', (error) => {
			logger.error('Authorized content stream failed', {
				code: (error as NodeJS.ErrnoException).code ?? 'STREAM_ERROR',
			});
			if (!response.headersSent) safeOperationError(response, error);
			else response.destroy();
		});
		stream.pipe(response);
	} catch (error) {
		safeOperationError(response, error);
	}
});

export default router;
export { router as filesEffectRouter };
