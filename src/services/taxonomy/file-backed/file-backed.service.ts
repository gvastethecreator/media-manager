/**
 * Durable filesystem primitives for ADR-0007 taxonomy artifacts.
 *
 * The caller owns root authorization and DB coordination. This module owns the
 * portable UTF-8 representation, optimistic conflict checks, serialized writes,
 * same-directory atomic replacement and reversible rename/delete staging.
 */

import { createHash, randomUUID } from 'node:crypto';
import { link, mkdir, open, readFile, rename, rm, stat } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join } from 'node:path';
import { serverLogger } from '@/lib/logger/server-logger';

const logger = serverLogger.withContext('FileBackedService');
const MAX_ARTIFACT_BYTES = 2 * 1024 * 1024;
const ARTIFACT_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
const ARTIFACT_EXTENSION = /^\.[A-Za-z0-9]{1,10}$/;
const HASH = /^[0-9a-f]{64}$/;
const TOMBSTONE_NONCE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const AUTHORED_KEYS = new Set([
	'id',
	'kind',
	'schemaVersion',
	'title',
	'summary',
	'category',
	'emoji',
	'color',
	'purpose',
	'parameters',
]);
const PARAMETER_KEYS = new Set([
	'canonicalKey',
	'custom',
	'default',
	'description',
	'enumTokens',
	'example',
	'key',
	'multiple',
	'required',
	'type',
]);

export type ArtifactFamily = 'note' | 'prompt' | 'wildcard';
export type ArtifactSyncStatus = 'external_change' | 'missing' | 'synced';
export const CANONICAL_PROMPT_PARAMETER_KEYS = ['subject', 'context', 'tone', 'style', 'constraints'] as const;
export const PROMPT_PARAMETER_TYPES = ['text', 'number', 'boolean', 'date', 'enum_token'] as const;

export type CanonicalPromptParameterKey = (typeof CANONICAL_PROMPT_PARAMETER_KEYS)[number];
export type ArtifactParameterType = (typeof PROMPT_PARAMETER_TYPES)[number];
export type ArtifactParameterValue = boolean | number | string | boolean[] | number[] | string[];

export interface ArtifactParameter {
	canonicalKey?: CanonicalPromptParameterKey;
	custom: boolean;
	default?: ArtifactParameterValue;
	description?: string;
	enumTokens?: string[];
	example?: ArtifactParameterValue;
	key: string;
	multiple?: boolean;
	required?: boolean;
	type: ArtifactParameterType;
}

export interface AuthoredMetadata {
	category?: string;
	color?: string;
	emoji?: string;
	id?: string;
	kind?: ArtifactFamily;
	parameters?: ArtifactParameter[];
	purpose?: string;
	schemaVersion?: 1;
	summary?: string;
	title: string;
}

export interface SyncResult {
	content: string | null;
	currentHash: string | null;
	needsReindex: boolean;
	status: ArtifactSyncStatus;
	storedHash: string | null;
}

export interface FileBackedConfig {
	extension: string;
	rootDir: string;
}

/**
 * Capability for one governed artifact path.
 *
 * Filesystem primitives deliberately receive this reference instead of an
 * absolute path. Every mutating syscall resolves it again through the owner
 * registry, so a root withdrawal or a junction swap that happened after an
 * earlier lookup fails closed before the write, rename, or unlink.
 *
 * Node's portable path APIs cannot pin a parent directory handle. A hostile
 * local process can still swap a reparse point after this last validation and
 * before the OS syscall. Callers must treat that narrow interval as a known
 * platform limit; a future native handle-based implementation can close it.
 */
export interface ArtifactPathAuthority {
	readonly relativePath: string;
	readonly rootId: string;
	resolve(mode: ArtifactPathMode): Promise<string>;
	sibling(fileName: string): ArtifactPathAuthority;
}

export type ArtifactPathMode = 'create' | 'existing';
export type ArtifactPathResolver = (
	reference: { relativePath: string; rootId: string },
	mode: ArtifactPathMode
) => Promise<string>;

function assertArtifactRelativePath(relativePath: string): void {
	if (
		!relativePath ||
		relativePath.includes('\\') ||
		relativePath.includes('\0') ||
		relativePath.startsWith('/') ||
		relativePath.split('/').some((segment) => !segment || segment === '.' || segment === '..')
	) {
		throw new ArtifactValidationError('La referencia authored no contiene una ruta relativa portable.');
	}
}

function assertArtifactSiblingName(fileName: string): void {
	if (
		!fileName ||
		fileName.includes('/') ||
		fileName.includes('\\') ||
		fileName.includes('\0') ||
		fileName === '.' ||
		fileName === '..'
	) {
		throw new ArtifactValidationError('El nombre temporal authored no es portable.');
	}
}

/**
 * Builds an opaque path capability from a root-bound reference and its
 * registry resolver. The resolver remains the only place that can turn the
 * reference into an absolute path.
 */
export function createArtifactPathAuthority(
	reference: { relativePath: string; rootId: string },
	resolver: ArtifactPathResolver
): ArtifactPathAuthority {
	if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(reference.rootId)) {
		throw new ArtifactValidationError('rootId no cumple el contrato portable.');
	}
	assertArtifactRelativePath(reference.relativePath);

	const createAuthority = (relativePath: string): ArtifactPathAuthority => ({
		relativePath,
		rootId: reference.rootId,
		resolve: async (mode) => {
			const absolutePath = await resolver({ relativePath, rootId: reference.rootId }, mode);
			if (!isAbsolute(absolutePath)) {
				throw new ArtifactValidationError('El resolvedor authored no devolvió una ruta absoluta local.');
			}
			return absolutePath;
		},
		sibling: (fileName) => {
			assertArtifactSiblingName(fileName);
			const segments = relativePath.split('/');
			segments[segments.length - 1] = fileName;
			const siblingPath = segments.join('/');
			assertArtifactRelativePath(siblingPath);
			return createAuthority(siblingPath);
		},
	});

	return createAuthority(reference.relativePath);
}

export interface ArtifactWriteOptions {
	createOnly?: boolean;
	expectedHash?: string;
}

export interface ArtifactWriteResult {
	byteSize: number;
	contentHash: string;
}

export interface QuarantinedArtifact {
	contentHash: string;
	original: ArtifactPathAuthority;
	quarantine: ArtifactPathAuthority;
}

export interface ArtifactDeletionTombstone {
	contentHash: string;
	entityId: string;
	entityType: ArtifactFamily;
	markerHash: string;
	nonce: string;
	original: ArtifactPathAuthority;
	tombstone: ArtifactPathAuthority;
}

export interface CreateArtifactDeletionTombstoneInput {
	contentHash: string;
	entityId: string;
	entityType: ArtifactFamily;
	nonce: string;
}

export class ArtifactConflictError extends Error {
	constructor(message = 'El artefacto cambió desde la última lectura.') {
		super(message);
		this.name = 'ArtifactConflictError';
	}
}

export class ArtifactValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ArtifactValidationError';
	}
}

let mutationQueue: Promise<void> = Promise.resolve();

function runSerialized<T>(operation: () => Promise<T>): Promise<T> {
	const result = mutationQueue.then(operation, operation);
	mutationQueue = result.then(
		() => undefined,
		() => undefined
	);
	return result;
}

function isMissingError(error: unknown): boolean {
	return (error as NodeJS.ErrnoException).code === 'ENOENT';
}

function isArtifactMissingError(error: unknown): boolean {
	const code = (error as { code?: string }).code;
	return code === 'ENOENT' || code === 'ROOT_PATH_NOT_FOUND';
}

function isExistsError(error: unknown): boolean {
	return (error as NodeJS.ErrnoException).code === 'EEXIST';
}

async function restoreMovedFileWithoutOverwrite(
	movedPath: ArtifactPathAuthority,
	originalPath: ArtifactPathAuthority
): Promise<void> {
	try {
		await link(await resolveForMutation(movedPath, 'existing'), await resolveForMutation(originalPath, 'create'));
		await removeArtifactFile(movedPath);
	} catch (error) {
		if (isExistsError(error)) {
			throw new ArtifactConflictError('Un escritor externo ocupó el path canónico durante la operación.');
		}
		throw error;
	}
}

function assertHash(hash: string, label: string): void {
	if (!HASH.test(hash)) throw new ArtifactValidationError(`${label} no es un SHA-256 canónico.`);
}

function validateText(value: unknown, label: string, maxLength: number): asserts value is string | undefined {
	if (value === undefined) return;
	if (typeof value !== 'string' || value.includes('\0') || value.length > maxLength) {
		throw new ArtifactValidationError(`${label} no cumple el contrato authored.`);
	}
}

const PARAMETER_KEY = /^[a-z][a-z0-9_]{0,63}$/;
const ENUM_TOKEN = /^[a-z][a-z0-9_-]{0,63}$/;
const CANONICAL_PARAMETER_KEYS = new Set<string>(CANONICAL_PROMPT_PARAMETER_KEYS);

function validateParameterValue(parameter: ArtifactParameter, value: ArtifactParameterValue, label: string): void {
	const values = parameter.multiple ? (Array.isArray(value) ? value : null) : Array.isArray(value) ? null : [value];
	if (!values || values.length > 100) {
		throw new ArtifactValidationError(`${label} de ${parameter.key} no respeta su cardinalidad.`);
	}
	const valid = values.every((entry) => {
		switch (parameter.type) {
			case 'boolean':
				return typeof entry === 'boolean';
			case 'number':
				return typeof entry === 'number' && Number.isFinite(entry);
			case 'date':
				return typeof entry === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(entry);
			case 'enum_token':
				return typeof entry === 'string' && (parameter.enumTokens?.includes(entry) ?? false);
			case 'text':
				return typeof entry === 'string';
		}
	});
	if (!valid) throw new ArtifactValidationError(`${label} de ${parameter.key} no coincide con ${parameter.type}.`);
}

function validateParameter(parameter: ArtifactParameter): void {
	if (!(parameter && typeof parameter === 'object' && !Array.isArray(parameter))) {
		throw new ArtifactValidationError('Un parameter authored no es un objeto gobernado.');
	}
	for (const key of Object.keys(parameter)) {
		if (!PARAMETER_KEYS.has(key)) throw new ArtifactValidationError(`Campo de parameter no gobernado: ${key}.`);
	}
	if (
		typeof parameter.key !== 'string' ||
		!PARAMETER_KEY.test(parameter.key) ||
		typeof parameter.custom !== 'boolean'
	) {
		throw new ArtifactValidationError('Un parameter authored tiene una identidad inválida.');
	}
	if (typeof parameter.type !== 'string' || !PROMPT_PARAMETER_TYPES.includes(parameter.type)) {
		throw new ArtifactValidationError(`Parameter ${parameter.key} usa un tipo no gobernado.`);
	}
	if (parameter.multiple !== undefined && typeof parameter.multiple !== 'boolean') {
		throw new ArtifactValidationError(`multiple de ${parameter.key} debe ser boolean.`);
	}
	if (parameter.required !== undefined && typeof parameter.required !== 'boolean') {
		throw new ArtifactValidationError(`required de ${parameter.key} debe ser boolean.`);
	}
	const isCanonical = CANONICAL_PARAMETER_KEYS.has(parameter.key);
	if (parameter.custom === isCanonical) {
		throw new ArtifactValidationError(
			isCanonical
				? `Parameter ${parameter.key} pertenece al vocabulario canónico y no puede marcarse custom.`
				: `Parameter ${parameter.key} debe declararse custom.`
		);
	}
	if (parameter.custom && !parameter.description?.trim()) {
		throw new ArtifactValidationError(`Parameter custom ${parameter.key} requiere description.`);
	}
	validateText(parameter.description, `description de ${parameter.key}`, 1_024);
	if (parameter.canonicalKey !== undefined) {
		if (!(parameter.custom && CANONICAL_PARAMETER_KEYS.has(parameter.canonicalKey))) {
			throw new ArtifactValidationError(`canonicalKey de ${parameter.key} no es un puente válido.`);
		}
	}
	if (parameter.enumTokens !== undefined) {
		if (
			parameter.type !== 'enum_token' ||
			!Array.isArray(parameter.enumTokens) ||
			parameter.enumTokens.length === 0 ||
			parameter.enumTokens.length > 100
		) {
			throw new ArtifactValidationError(`enumTokens de ${parameter.key} no cumple el contrato.`);
		}
		const tokens = new Set<string>();
		for (const token of parameter.enumTokens) {
			if (!ENUM_TOKEN.test(token) || tokens.has(token)) {
				throw new ArtifactValidationError(`enumTokens de ${parameter.key} contiene identidades inválidas.`);
			}
			tokens.add(token);
		}
	} else if (parameter.type === 'enum_token') {
		throw new ArtifactValidationError(`Parameter enum_token ${parameter.key} requiere enumTokens.`);
	}
	if (parameter.default !== undefined) validateParameterValue(parameter, parameter.default, 'default');
	if (parameter.example !== undefined) validateParameterValue(parameter, parameter.example, 'example');
}

function validatePromptBody(metadata: AuthoredMetadata, body: string): void {
	if (!metadata.purpose?.trim()) throw new ArtifactValidationError('Prompt portable requiere purpose authored.');
	if (!body.trim()) throw new ArtifactValidationError('Prompt portable requiere contenido authored.');
	const parameters = new Map((metadata.parameters ?? []).map((parameter) => [parameter.key, parameter]));
	const placeholders = new Set<string>();
	const placeholderPattern = /\{\{\s*([^{}]+?)\s*\}\}/g;
	for (const match of body.matchAll(placeholderPattern)) {
		const key = match[1];
		if (!PARAMETER_KEY.test(key)) throw new ArtifactValidationError(`Placeholder inválido: ${key}.`);
		if (!parameters.has(key)) throw new ArtifactValidationError(`Placeholder sin parameter declarado: ${key}.`);
		placeholders.add(key);
	}
	if (body.replace(placeholderPattern, '').includes('{{') || body.replace(placeholderPattern, '').includes('}}')) {
		throw new ArtifactValidationError('Prompt contiene un placeholder mal formado.');
	}
	for (const parameter of parameters.values()) {
		if (parameter.required && !placeholders.has(parameter.key)) {
			throw new ArtifactValidationError(`Parameter requerido no usado en el Prompt: ${parameter.key}.`);
		}
	}
}

function normalizeWildcardBody(body: string): string {
	const entries = normalizeArtifactContent(body)
		.split('\n')
		.map((entry) => entry.trim())
		.filter(Boolean);
	if (entries.length === 0) throw new ArtifactValidationError('Wildcard portable requiere al menos una entrada.');
	if (new Set(entries).size !== entries.length) {
		throw new ArtifactValidationError('Wildcard portable no admite entradas duplicadas.');
	}
	return entries.join('\n');
}

function normalizeAuthoredBody(metadata: AuthoredMetadata, body: string): string {
	const normalized = normalizeArtifactContent(body);
	if (metadata.kind === 'prompt') validatePromptBody(metadata, normalized);
	if (metadata.kind === 'wildcard') return normalizeWildcardBody(normalized);
	return normalized;
}

function validateMetadata(metadata: AuthoredMetadata): void {
	validateText(metadata.title, 'title', 512);
	if (!metadata.title.trim()) throw new ArtifactValidationError('title es obligatorio.');
	validateText(metadata.summary, 'summary', 4_096);
	validateText(metadata.category, 'category', 128);
	validateText(metadata.emoji, 'emoji', 32);
	validateText(metadata.color, 'color', 128);
	validateText(metadata.purpose, 'purpose', 4_096);

	const identityFields = [metadata.id, metadata.kind, metadata.schemaVersion];
	if (identityFields.some((value) => value !== undefined)) {
		if (!(metadata.id && ARTIFACT_ID.test(metadata.id))) {
			throw new ArtifactValidationError('id no cumple el contrato portable.');
		}
		if (!(metadata.kind && ['note', 'prompt', 'wildcard'].includes(metadata.kind))) {
			throw new ArtifactValidationError('kind no pertenece a una familia file-backed.');
		}
		if (metadata.schemaVersion !== 1) throw new ArtifactValidationError('schemaVersion no está soportado.');
	}

	if (metadata.kind !== 'prompt' && (metadata.purpose !== undefined || metadata.parameters !== undefined)) {
		throw new ArtifactValidationError('purpose y parameters sólo pertenecen a Prompt.');
	}
	if (metadata.parameters !== undefined) {
		if (!Array.isArray(metadata.parameters))
			throw new ArtifactValidationError('parameters debe ser una lista gobernada.');
		if (metadata.parameters.length > 100) throw new ArtifactValidationError('parameters excede el límite gobernado.');
		const keys = new Set<string>();
		for (const parameter of metadata.parameters) {
			validateParameter(parameter);
			if (keys.has(parameter.key)) throw new ArtifactValidationError(`Parameter duplicado: ${parameter.key}.`);
			keys.add(parameter.key);
		}
	}
}

export function normalizeArtifactContent(content: string): string {
	if (typeof content !== 'string') throw new ArtifactValidationError('El contenido authored debe ser texto UTF-8.');
	const normalized = content
		.replace(/^\uFEFF/, '')
		.replaceAll('\r\n', '\n')
		.replaceAll('\r', '\n');
	if (normalized.includes('\0')) throw new ArtifactValidationError('El contenido authored contiene bytes nulos.');
	if (Buffer.byteLength(normalized, 'utf8') > MAX_ARTIFACT_BYTES) {
		throw new ArtifactValidationError(`El contenido authored excede ${MAX_ARTIFACT_BYTES} bytes.`);
	}
	return normalized;
}

async function readArtifactFileIfPresent(path: ArtifactPathAuthority): Promise<string | null> {
	try {
		return await readArtifactFile(path);
	} catch (error) {
		if (isArtifactMissingError(error)) return null;
		throw error;
	}
}

/**
 * Resolve immediately before one filesystem mutation. The authority callback
 * must re-run the root registry's parent/reparse validation; no caller may
 * retain an absolute path as a write capability.
 */
async function resolveForMutation(path: ArtifactPathAuthority, mode: ArtifactPathMode): Promise<string> {
	return path.resolve(mode);
}

function artifactFileName(path: ArtifactPathAuthority): string {
	return path.relativePath.split('/').at(-1) ?? '';
}

async function ensureArtifactParent(path: ArtifactPathAuthority): Promise<string> {
	const absolutePath = await resolveForMutation(path, 'create');
	await mkdir(dirname(absolutePath), { recursive: true });
	return absolutePath;
}

async function removeArtifactFile(path: ArtifactPathAuthority, force = false): Promise<void> {
	const absolutePath = await resolveForMutation(path, force ? 'create' : 'existing');
	await rm(absolutePath, { force });
}

async function syncDirectoryBestEffort(directoryPath: string): Promise<void> {
	let handle: Awaited<ReturnType<typeof open>> | undefined;
	try {
		handle = await open(directoryPath, 'r');
		await handle.sync();
	} catch (error) {
		const code = (error as NodeJS.ErrnoException).code;
		if (!['EACCES', 'EISDIR', 'EINVAL', 'ENOTSUP', 'EPERM', 'UNKNOWN'].includes(code ?? '')) throw error;
	} finally {
		await handle?.close();
	}
}

export async function readArtifactFile(path: ArtifactPathAuthority): Promise<string> {
	const statPath = await path.resolve('existing');
	const fileStat = await stat(statPath);
	if (!fileStat.isFile()) throw new ArtifactValidationError('La referencia taxonomy no apunta a un archivo regular.');
	if (fileStat.size > MAX_ARTIFACT_BYTES) {
		throw new ArtifactValidationError(`El archivo authored excede ${MAX_ARTIFACT_BYTES} bytes.`);
	}
	// Revalidate once more directly before opening bytes. This catches a path
	// swap that happened after stat without turning the earlier absolute path
	// into durable authority.
	const bytes = await readFile(await path.resolve('existing'));
	let content: string;
	try {
		content = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
	} catch {
		throw new ArtifactValidationError('El archivo authored no contiene UTF-8 válido.');
	}
	return normalizeArtifactContent(content);
}

export async function writeArtifactFile(
	path: ArtifactPathAuthority,
	content: string,
	options: ArtifactWriteOptions = {}
): Promise<ArtifactWriteResult> {
	const normalized = normalizeArtifactContent(content);
	if (options.expectedHash !== undefined) assertHash(options.expectedHash, 'expectedHash');

	return runSerialized(async () => {
		const current = await readArtifactFileIfPresent(path);
		if (options.createOnly && current !== null) throw new ArtifactConflictError('El artefacto ya existe.');
		if (options.expectedHash !== undefined) {
			if (current === null || computeArtifactHash(current) !== options.expectedHash) throw new ArtifactConflictError();
		}

		const committedHash = computeArtifactHash(normalized);
		await ensureArtifactParent(path);
		const temporary = path.sibling(`.${artifactFileName(path)}.${randomUUID()}.tmp`);
		let previous: ArtifactPathAuthority | undefined;
		let handle: Awaited<ReturnType<typeof open>> | undefined;
		try {
			handle = await open(await resolveForMutation(temporary, 'create'), 'wx', 0o600);
			await handle.writeFile(normalized, { encoding: 'utf8' });
			await handle.sync();
			await handle.close();
			handle = undefined;
			if (options.expectedHash !== undefined) {
				previous = path.sibling(`.${artifactFileName(path)}.${randomUUID()}.quarantine`);
				try {
					await rename(await resolveForMutation(path, 'existing'), await resolveForMutation(previous, 'create'));
				} catch (error) {
					if (isMissingError(error)) throw new ArtifactConflictError();
					throw error;
				}
				const captured = await readArtifactFile(previous);
				if (computeArtifactHash(captured) !== options.expectedHash) {
					await restoreMovedFileWithoutOverwrite(previous, path);
					previous = undefined;
					throw new ArtifactConflictError();
				}
			}
			try {
				await link(await resolveForMutation(temporary, 'existing'), await resolveForMutation(path, 'create'));
			} catch (error) {
				if (isExistsError(error)) {
					throw new ArtifactConflictError('El artefacto apareció durante la escritura.');
				}
				throw error;
			}
			const installed = await readArtifactFile(path);
			if (computeArtifactHash(installed) !== committedHash) {
				throw new ArtifactConflictError('El archivo cambió durante la confirmación de la escritura.');
			}
			await removeArtifactFile(temporary);
			if (previous) {
				await removeArtifactFile(previous);
				previous = undefined;
			}
			await syncDirectoryBestEffort(dirname(await resolveForMutation(path, 'create')));
		} catch (error) {
			await handle?.close();
			try {
				await removeArtifactFile(temporary, true);
			} catch {
				// Root withdrawal during cleanup must not replace the original failure.
			}
			if (previous) {
				try {
					await restoreMovedFileWithoutOverwrite(previous, path);
				} catch {
					// Preserve both the external winner and quarantine for deterministic rebuild.
				}
			}
			throw error;
		}

		const result = {
			byteSize: Buffer.byteLength(normalized, 'utf8'),
			contentHash: committedHash,
		};
		logger.info('Artifact file committed', result);
		return result;
	});
}

function serializeDeletionTombstone(
	input: CreateArtifactDeletionTombstoneInput,
	original: ArtifactPathAuthority
): string {
	assertHash(input.contentHash, 'contentHash');
	if (!ARTIFACT_ID.test(input.entityId) || !['note', 'prompt', 'wildcard'].includes(input.entityType)) {
		throw new ArtifactValidationError('La tombstone authored no contiene identidad válida.');
	}
	if (!TOMBSTONE_NONCE.test(input.nonce)) {
		throw new ArtifactValidationError('La tombstone authored no contiene nonce válido.');
	}
	return `${JSON.stringify({
		contentHash: input.contentHash,
		entityId: input.entityId,
		entityType: input.entityType,
		nonce: input.nonce,
		originalRelativePath: original.relativePath,
		version: 1,
	})}\n`;
}

function parseDeletionTombstone(content: string, tombstone: ArtifactPathAuthority): ArtifactDeletionTombstone {
	let parsed: unknown;
	try {
		parsed = JSON.parse(content);
	} catch {
		throw new ArtifactValidationError('La tombstone authored no contiene JSON válido.');
	}
	if (!(parsed && typeof parsed === 'object' && !Array.isArray(parsed))) {
		throw new ArtifactValidationError('La tombstone authored no es un objeto válido.');
	}
	const value = parsed as Record<string, unknown>;
	if (
		value.version !== 1 ||
		typeof value.contentHash !== 'string' ||
		typeof value.entityId !== 'string' ||
		typeof value.entityType !== 'string' ||
		typeof value.nonce !== 'string' ||
		typeof value.originalRelativePath !== 'string'
	) {
		throw new ArtifactValidationError('La tombstone authored no cumple el contrato.');
	}
	assertHash(value.contentHash, 'contentHash');
	if (
		!ARTIFACT_ID.test(value.entityId) ||
		!['note', 'prompt', 'wildcard'].includes(value.entityType as ArtifactFamily)
	) {
		throw new ArtifactValidationError('La tombstone authored contiene identidad inválida.');
	}
	if (!TOMBSTONE_NONCE.test(value.nonce)) {
		throw new ArtifactValidationError('La tombstone authored contiene nonce inválido.');
	}
	assertArtifactRelativePath(value.originalRelativePath);
	const originalFileName = value.originalRelativePath.split('/').at(-1);
	if (!originalFileName || !tombstone.relativePath.includes(`.${originalFileName}.`)) {
		throw new ArtifactValidationError('La tombstone no corresponde con su archivo governed.');
	}
	return {
		contentHash: value.contentHash,
		entityId: value.entityId,
		entityType: value.entityType as ArtifactFamily,
		markerHash: createHash('sha256').update(content, 'utf8').digest('hex'),
		nonce: value.nonce,
		original: tombstone.sibling(originalFileName),
		tombstone,
	};
}

export async function createArtifactDeletionTombstone(
	original: ArtifactPathAuthority,
	input: CreateArtifactDeletionTombstoneInput
): Promise<ArtifactDeletionTombstone> {
	const tombstone = original.sibling(`.${artifactFileName(original)}.${input.nonce}.delete-tombstone`);
	const content = serializeDeletionTombstone(input, original);
	return runSerialized(async () => {
		await ensureArtifactParent(tombstone);
		let handle: Awaited<ReturnType<typeof open>> | undefined;
		try {
			handle = await open(await resolveForMutation(tombstone, 'create'), 'wx', 0o600);
			await handle.writeFile(content, { encoding: 'utf8' });
			await handle.sync();
			await handle.close();
			handle = undefined;
			await syncDirectoryBestEffort(dirname(await resolveForMutation(tombstone, 'create')));
		} catch (error) {
			await handle?.close();
			try {
				await removeArtifactFile(tombstone, true);
			} catch {
				// Keep the first failure; rebuild can classify a surviving marker.
			}
			throw error;
		}
		return parseDeletionTombstone(content, tombstone);
	});
}

export async function readArtifactDeletionTombstone(path: ArtifactPathAuthority): Promise<ArtifactDeletionTombstone> {
	const content = await readArtifactFile(path);
	return parseDeletionTombstone(content, path);
}

export async function discardArtifactDeletionTombstone(tombstone: ArtifactDeletionTombstone): Promise<void> {
	return runSerialized(async () => {
		const current = await readArtifactDeletionTombstone(tombstone.tombstone);
		if (current.markerHash !== tombstone.markerHash) {
			throw new ArtifactConflictError('La tombstone cambió antes de su limpieza.');
		}
		await removeArtifactFile(tombstone.tombstone);
		await syncDirectoryBestEffort(dirname(await resolveForMutation(tombstone.tombstone, 'create')));
	});
}

export function computeArtifactHash(content: string): string {
	return createHash('sha256').update(normalizeArtifactContent(content), 'utf8').digest('hex');
}

export async function checkArtifactChanged(
	path: ArtifactPathAuthority,
	storedHash: string | null
): Promise<SyncResult> {
	if (storedHash !== null) assertHash(storedHash, 'storedHash');
	const content = await readArtifactFileIfPresent(path);
	if (content === null) {
		return { content: null, currentHash: null, needsReindex: false, status: 'missing', storedHash };
	}
	const currentHash = computeArtifactHash(content);
	const needsReindex = currentHash !== storedHash;
	return {
		content,
		currentHash,
		needsReindex,
		status: needsReindex ? 'external_change' : 'synced',
		storedHash,
	};
}

function parseScalar(rawValue: string, key: string): unknown {
	if (key === 'schemaVersion') {
		if (!/^\d+$/.test(rawValue)) throw new ArtifactValidationError('schemaVersion debe ser entero.');
		return Number(rawValue);
	}
	if (key === 'parameters') {
		try {
			return JSON.parse(rawValue);
		} catch {
			throw new ArtifactValidationError('parameters debe ser JSON gobernado válido.');
		}
	}
	if (rawValue.startsWith('"')) {
		try {
			const parsed: unknown = JSON.parse(rawValue);
			if (typeof parsed !== 'string') throw new Error('not-string');
			return parsed;
		} catch {
			throw new ArtifactValidationError(`${key} contiene un string inválido.`);
		}
	}
	return rawValue;
}

export function extractFrontmatter(content: string): { metadata: AuthoredMetadata; body: string } {
	const normalized = normalizeArtifactContent(content);
	const frontmatterMatch = normalized.match(/^---\n([\s\S]*?)\n---(?:\n|$)([\s\S]*)$/);
	if (!frontmatterMatch) return { metadata: { title: '' }, body: normalized };

	const [, rawMetadata, rawBody] = frontmatterMatch;
	const values: Record<string, unknown> = {};
	for (const line of rawMetadata.split('\n')) {
		if (!line.trim()) continue;
		const colonIndex = line.indexOf(':');
		if (colonIndex < 1) throw new ArtifactValidationError('Frontmatter authored inválido.');
		const key = line.slice(0, colonIndex).trim();
		if (!AUTHORED_KEYS.has(key)) throw new ArtifactValidationError(`Campo authored no gobernado: ${key}.`);
		if (Object.hasOwn(values, key)) throw new ArtifactValidationError(`Campo authored duplicado: ${key}.`);
		values[key] = parseScalar(line.slice(colonIndex + 1).trim(), key);
	}

	const metadata = values as unknown as AuthoredMetadata;
	if (typeof metadata.title !== 'string') throw new ArtifactValidationError('title es obligatorio.');
	validateMetadata(metadata);
	const body = rawBody.startsWith('\n') ? rawBody.slice(1) : rawBody;
	return { metadata, body: normalizeAuthoredBody(metadata, body) };
}

function appendString(lines: string[], key: string, value: string | undefined): void {
	if (value !== undefined) lines.push(`${key}: ${JSON.stringify(value)}`);
}

export function generateFrontmatter(metadata: AuthoredMetadata, body: string): string {
	validateMetadata(metadata);
	const normalizedBody = normalizeAuthoredBody(metadata, body);
	const lines = ['---'];
	appendString(lines, 'id', metadata.id);
	appendString(lines, 'kind', metadata.kind);
	if (metadata.schemaVersion !== undefined) lines.push(`schemaVersion: ${metadata.schemaVersion}`);
	appendString(lines, 'title', metadata.title);
	appendString(lines, 'summary', metadata.summary);
	appendString(lines, 'category', metadata.category);
	appendString(lines, 'emoji', metadata.emoji);
	appendString(lines, 'color', metadata.color);
	appendString(lines, 'purpose', metadata.purpose);
	if (metadata.parameters !== undefined) lines.push(`parameters: ${JSON.stringify(metadata.parameters)}`);
	lines.push('---', '', normalizedBody);
	return lines.join('\n');
}

/**
 * Validates a portable filename for callers that need a display or migration
 * path. Its result is never accepted by storage as mutation authority; use an
 * ArtifactPathAuthority for every filesystem operation.
 */
export function buildArtifactPath(config: FileBackedConfig, artifactId: string): string {
	if (!isAbsolute(config.rootDir)) throw new ArtifactValidationError('rootDir debe ser absoluto.');
	if (!ARTIFACT_ID.test(artifactId)) throw new ArtifactValidationError('artifactId no cumple el contrato portable.');
	if (!ARTIFACT_EXTENSION.test(config.extension)) {
		throw new ArtifactValidationError('extension no cumple el contrato portable.');
	}
	return join(config.rootDir, `${artifactId}${config.extension}`);
}

export async function renameArtifactFile(
	sourcePath: ArtifactPathAuthority,
	destinationPath: ArtifactPathAuthority,
	expectedHash: string
): Promise<ArtifactWriteResult> {
	assertHash(expectedHash, 'expectedHash');
	return runSerialized(async () => {
		await ensureArtifactParent(destinationPath);
		const quarantinePath = sourcePath.sibling(`.${artifactFileName(sourcePath)}.${randomUUID()}.quarantine`);
		try {
			await rename(
				await resolveForMutation(sourcePath, 'existing'),
				await resolveForMutation(quarantinePath, 'create')
			);
		} catch (error) {
			if (isMissingError(error)) throw new ArtifactConflictError();
			throw error;
		}
		const source = await readArtifactFile(quarantinePath);
		if (computeArtifactHash(source) !== expectedHash) {
			await restoreMovedFileWithoutOverwrite(quarantinePath, sourcePath);
			throw new ArtifactConflictError();
		}
		try {
			await link(
				await resolveForMutation(quarantinePath, 'existing'),
				await resolveForMutation(destinationPath, 'create')
			);
		} catch (error) {
			await restoreMovedFileWithoutOverwrite(quarantinePath, sourcePath);
			if (isExistsError(error)) throw new ArtifactConflictError('El destino del rename ya existe.');
			throw error;
		}
		const installed = await readArtifactFile(destinationPath);
		if (computeArtifactHash(installed) !== expectedHash) {
			await restoreMovedFileWithoutOverwrite(quarantinePath, sourcePath);
			// Do not unlink destination here. It may already be an independently
			// installed winner; deleting it would turn a detected conflict into data
			// loss. The destination remains for explicit recovery/rebuild handling.
			throw new ArtifactConflictError('El destino del rename fue reemplazado por un escritor externo.');
		}
		await removeArtifactFile(quarantinePath);
		const sourceDirectory = dirname(await resolveForMutation(sourcePath, 'create'));
		const destinationDirectory = dirname(await resolveForMutation(destinationPath, 'create'));
		await syncDirectoryBestEffort(sourceDirectory);
		if (sourceDirectory !== destinationDirectory) await syncDirectoryBestEffort(destinationDirectory);
		return { byteSize: Buffer.byteLength(source, 'utf8'), contentHash: expectedHash };
	});
}

export async function quarantineArtifactFile(
	filePath: ArtifactPathAuthority,
	expectedHash: string
): Promise<QuarantinedArtifact> {
	assertHash(expectedHash, 'expectedHash');
	return runSerialized(async () => {
		const quarantinePath = filePath.sibling(`.${artifactFileName(filePath)}.${randomUUID()}.quarantine`);
		try {
			await rename(await resolveForMutation(filePath, 'existing'), await resolveForMutation(quarantinePath, 'create'));
		} catch (error) {
			if (isMissingError(error)) throw new ArtifactConflictError();
			throw error;
		}
		const content = await readArtifactFile(quarantinePath);
		if (computeArtifactHash(content) !== expectedHash) {
			await restoreMovedFileWithoutOverwrite(quarantinePath, filePath);
			throw new ArtifactConflictError();
		}
		await syncDirectoryBestEffort(dirname(await resolveForMutation(filePath, 'create')));
		return { contentHash: expectedHash, original: filePath, quarantine: quarantinePath };
	});
}

export async function restoreQuarantinedArtifact(quarantine: QuarantinedArtifact): Promise<void> {
	return runSerialized(async () => {
		const content = await readArtifactFile(quarantine.quarantine);
		if (computeArtifactHash(content) !== quarantine.contentHash) throw new ArtifactConflictError();
		await restoreMovedFileWithoutOverwrite(quarantine.quarantine, quarantine.original);
		await syncDirectoryBestEffort(dirname(await resolveForMutation(quarantine.original, 'create')));
	});
}

export async function commitQuarantinedArtifact(quarantine: QuarantinedArtifact): Promise<void> {
	return runSerialized(async () => {
		const content = await readArtifactFile(quarantine.quarantine);
		if (computeArtifactHash(content) !== quarantine.contentHash) throw new ArtifactConflictError();
		await removeArtifactFile(quarantine.quarantine);
		await syncDirectoryBestEffort(dirname(await resolveForMutation(quarantine.quarantine, 'create')));
	});
}

/**
 * Preserves an interrupted staging file outside the active .tmp name. Rebuild
 * never promotes it automatically because that would publish bytes whose
 * database projection may not have committed.
 */
export async function quarantineTemporaryArtifact(path: ArtifactPathAuthority): Promise<ArtifactPathAuthority> {
	return runSerialized(async () => {
		const quarantine = path.sibling(`.${artifactFileName(path)}.${randomUUID()}.tmp-orphan`);
		try {
			await rename(await resolveForMutation(path, 'existing'), await resolveForMutation(quarantine, 'create'));
		} catch (error) {
			if (isMissingError(error)) throw new ArtifactConflictError('El staging temporal desapareció durante rebuild.');
			if (isExistsError(error)) throw new ArtifactConflictError('La cuarentena temporal ya está ocupada.');
			throw error;
		}
		await syncDirectoryBestEffort(dirname(await resolveForMutation(quarantine, 'create')));
		return quarantine;
	});
}
