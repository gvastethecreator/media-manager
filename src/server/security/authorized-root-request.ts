import type { NextFunction, Response } from 'express';
import { stat } from 'node:fs/promises';
import { createAuthorizedPathInput } from '@/lib/filesystem/authorized-path-proof';
import { isPathInsideDirectory } from '@/lib/filesystem/path-containment';
import { type MediaAssetType, parseMediaAssetReference, resolveMediaAssetReference } from './media-asset-reference';
import {
	AuthorizedRootRegistry,
	type AuthorizedPathReference,
	type ResolvedAuthorizedPath,
	type RootPermission,
	RootAuthorizationError,
} from './authorized-roots';

interface AppLocalsRequest {
	app: { locals: Record<string, unknown> };
}

interface QueryRequest {
	query: Record<string, unknown>;
}

export function getAuthorizedRootRegistry(request: AppLocalsRequest): AuthorizedRootRegistry {
	const registry = request.app.locals.authorizedRootRegistry;
	if (!(registry instanceof AuthorizedRootRegistry)) {
		throw new RootAuthorizationError('ROOT_CONFIG_INVALID', 'El registry de media roots no está disponible.', 503);
	}
	return registry;
}

export function parseAuthorizedPathReference(value: unknown): AuthorizedPathReference {
	if (!(value && typeof value === 'object' && !Array.isArray(value))) {
		throw new RootAuthorizationError('ROOT_PATH_INVALID', 'Se requiere rootId y relativePath.', 400);
	}
	const candidate = value as Record<string, unknown>;
	if (typeof candidate.rootId !== 'string' || typeof candidate.relativePath !== 'string') {
		throw new RootAuthorizationError('ROOT_PATH_INVALID', 'Se requiere rootId y relativePath.', 400);
	}
	return { relativePath: candidate.relativePath, rootId: candidate.rootId };
}

export function parseAuthorizedPathQuery(request: QueryRequest): AuthorizedPathReference {
	return parseAuthorizedPathReference({
		relativePath: request.query.path,
		rootId: request.query.rootId,
	});
}

export function sendRootAuthorizationError(response: Response, error: unknown): boolean {
	if (!(error instanceof RootAuthorizationError)) return false;
	response.status(error.status).json({ code: error.code, message: error.message, retryable: false });
	return true;
}

export function authorizeMediaPathInput(options: {
	expected: 'directory' | 'file';
	permissions?: RootPermission[];
	required: boolean;
}) {
	return async (
		request: { app: { locals: Record<string, unknown> }; body?: Record<string, unknown> },
		response: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			const body = request.body ?? {};
			const sourceValue = body.source;
			const hasLegacyPath = ['absolutePath', 'filePath', 'path'].some((field) => typeof body[field] === 'string');
			if (sourceValue === undefined) {
				if (options.required || hasLegacyPath) {
					throw new RootAuthorizationError(
						'ROOT_PATH_INVALID',
						'Se requiere una referencia source con rootId y relativePath.',
						400
					);
				}
				next();
				return;
			}
			const source = parseAuthorizedPathReference(sourceValue);
			const registry = getAuthorizedRootRegistry(request);
			const permissions = options.permissions ?? ['index', 'read'];
			let resolved = await registry.resolve(source, permissions[0] ?? 'read');
			for (const permission of permissions.slice(1)) resolved = await registry.resolve(source, permission);
			const sourceStat = await stat(resolved.absolutePath);
			if (
				(options.expected === 'file' && !sourceStat.isFile()) ||
				(options.expected === 'directory' && !sourceStat.isDirectory())
			) {
				throw new RootAuthorizationError('ROOT_PATH_INVALID', 'La referencia source tiene un tipo inválido.', 400);
			}
			const { absolutePath: _absolutePath, filePath: _filePath, path: _path, source: _source, ...safeBody } = body;
			request.body = {
				...safeBody,
				path: resolved.absolutePath,
				source: createAuthorizedPathInput(resolved),
			};
			next();
		} catch (error) {
			if (!sendRootAuthorizationError(response, error)) next(error);
		}
	};
}

/** Ensures a sanitized media source is physically contained by its declared Folder. */
export function authorizeMediaPlacementInput() {
	return async (
		request: { app: { locals: Record<string, unknown> }; body?: Record<string, unknown> },
		response: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			const body = request.body ?? {};
			if (typeof body.folderId !== 'string' || typeof body.path !== 'string') {
				throw new RootAuthorizationError('ROOT_PATH_INVALID', 'Se requiere un Folder y una source autorizada.', 400);
			}
			const folder = await resolveAuthorizedFolderById(request, body.folderId, 'index');
			if (!isPathInsideDirectory(folder.absolutePath, body.path)) {
				throw new RootAuthorizationError(
					'ROOT_PATH_CONFLICT',
					'La source no pertenece físicamente al Folder declarado.',
					409
				);
			}
			next();
		} catch (error) {
			if (!sendRootAuthorizationError(response, error)) next(error);
		}
	};
}

export async function resolveAuthorizedFolderById(
	request: AppLocalsRequest,
	folderId: string,
	permission: 'delete' | 'index' | 'read' | 'write'
): Promise<ResolvedAuthorizedPath> {
	if (!folderId || folderId.length > 192) {
		throw new RootAuthorizationError('ROOT_PATH_INVALID', 'El folder ID no es válido.', 400);
	}
	const [{ eq }, { db }, { folders }] = await Promise.all([
		import('drizzle-orm'),
		import('@/lib/drizzle'),
		import('@/lib/drizzle/schema/organization/folders'),
	]);
	const [folder] = await db.select({ path: folders.path }).from(folders).where(eq(folders.id, folderId)).limit(1);
	if (!folder?.path) throw new RootAuthorizationError('ROOT_PATH_NOT_FOUND', 'Folder no encontrado.', 404);
	return getAuthorizedRootRegistry(request).authorizeAbsolutePath(folder.path, permission);
}

export function authorizeFolderPathById(permission: 'delete' | 'index' | 'read' | 'write') {
	return async (
		request: { app: { locals: Record<string, unknown> }; params: Record<string, string> },
		response: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			const folderId = request.params.folderId ?? request.params.id;
			const authorized = await resolveAuthorizedFolderById(request, folderId, permission);
			response.locals.authorizedRootReference = {
				relativePath: authorized.relativePath,
				rootId: authorized.rootId,
			};
			next();
		} catch (error) {
			if (!sendRootAuthorizationError(response, error)) next(error);
		}
	};
}

export function authorizeMediaAssetParam(options: {
	allowDeleted?: boolean;
	allowMissing?: boolean;
	assetType: MediaAssetType | ((request: { params: Record<string, string> }) => unknown);
	idParam?: string;
	permissions?: RootPermission[];
}) {
	return async (
		request: {
			app: { locals: Record<string, unknown> };
			params: Record<string, string>;
		},
		response: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			const assetType = typeof options.assetType === 'function' ? options.assetType(request) : options.assetType;
			const reference = parseMediaAssetReference({
				assetId: request.params[options.idParam ?? 'id'],
				assetType,
			});
			const registry = getAuthorizedRootRegistry(request);
			let resolved = await resolveMediaAssetReference(registry, reference, options.permissions?.[0] ?? 'read', {
				allowDeleted: options.allowDeleted,
				allowMissing: options.allowMissing,
			});
			for (const permission of options.permissions?.slice(1) ?? []) {
				resolved = await resolveMediaAssetReference(registry, reference, permission, {
					allowDeleted: options.allowDeleted,
					allowMissing: options.allowMissing,
				});
			}
			response.locals.authorizedAssetPath = resolved.absolutePath;
			response.locals.authorizedAssetReference = {
				assetId: reference.assetId,
				assetType: reference.assetType,
			};
			next();
		} catch (error) {
			if (!sendRootAuthorizationError(response, error)) next(error);
		}
	};
}

export function authorizeMediaAssetBodyIds(options: {
	allowMissing?: boolean;
	assetType: MediaAssetType;
	bodyField?: string;
	permissions?: RootPermission[];
}) {
	return async (
		request: {
			app: { locals: Record<string, unknown> };
			body?: Record<string, unknown>;
		},
		response: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			const bodyField = options.bodyField ?? 'ids';
			const ids = request.body?.[bodyField];
			if (!Array.isArray(ids) || ids.length === 0 || ids.length > 100) {
				throw new RootAuthorizationError('ROOT_PATH_INVALID', 'Se requiere una lista acotada de asset IDs.', 400);
			}
			const registry = getAuthorizedRootRegistry(request);
			await Promise.all(
				ids.map(async (assetId) => {
					const reference = parseMediaAssetReference({ assetId, assetType: options.assetType });
					for (const permission of options.permissions ?? ['read']) {
						await resolveMediaAssetReference(registry, reference, permission, {
							allowMissing: options.allowMissing,
						});
					}
				})
			);
			next();
		} catch (error) {
			if (!sendRootAuthorizationError(response, error)) next(error);
		}
	};
}

interface MediaEntityPath {
	entityType?: unknown;
	id?: unknown;
	path?: unknown;
}

export function toMediaAssetType(value: unknown): MediaAssetType | null {
	switch (value) {
		case 'image':
		case 'video':
		case 'audio':
		case 'document':
		case 'file3d':
			return value;
		case 'json':
		case 'jsonFile':
			return 'json';
		default:
			return null;
	}
}

async function authorizeMediaEntity(
	request: AppLocalsRequest,
	entity: MediaEntityPath,
	assetType: MediaAssetType,
	permissions: RootPermission[]
): Promise<void> {
	const registry = getAuthorizedRootRegistry(request);
	if (assetType === 'image') {
		const reference = parseMediaAssetReference({ assetId: entity.id, assetType });
		for (const permission of permissions) await resolveMediaAssetReference(registry, reference, permission);
		return;
	}
	if (typeof entity.path === 'string') {
		for (const permission of permissions) await registry.authorizeAbsolutePath(entity.path, permission);
		return;
	}
	const reference = parseMediaAssetReference({ assetId: entity.id, assetType });
	for (const permission of permissions) await resolveMediaAssetReference(registry, reference, permission);
}

export async function assertAuthorizedMediaEntity(
	request: AppLocalsRequest,
	entity: MediaEntityPath,
	assetType: MediaAssetType,
	permissions: RootPermission[] = ['read']
): Promise<void> {
	await authorizeMediaEntity(request, entity, assetType, permissions);
}

export async function filterAuthorizedMediaEntities<T extends MediaEntityPath>(
	request: AppLocalsRequest,
	entities: readonly T[],
	assetType: MediaAssetType,
	permissions: RootPermission[] = ['read']
): Promise<T[]> {
	const decisions = await Promise.all(
		entities.map(async (entity) => {
			try {
				await authorizeMediaEntity(request, entity, assetType, permissions);
				return true;
			} catch (error) {
				if (error instanceof RootAuthorizationError) return false;
				throw error;
			}
		})
	);
	return entities.filter((_entity, index) => decisions[index]);
}

export async function filterAuthorizedMixedMediaEntities<T extends MediaEntityPath>(
	request: AppLocalsRequest,
	entities: readonly T[],
	permissions: RootPermission[] = ['read']
): Promise<T[]> {
	const decisions = await Promise.all(
		entities.map(async (entity) => {
			const assetType = toMediaAssetType(entity.entityType);
			if (!assetType) return false;
			try {
				await authorizeMediaEntity(request, entity, assetType, permissions);
				return true;
			} catch (error) {
				if (error instanceof RootAuthorizationError) return false;
				throw error;
			}
		})
	);
	return entities.filter((_entity, index) => decisions[index]);
}
