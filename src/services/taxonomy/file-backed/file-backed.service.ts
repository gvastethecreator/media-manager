/**
 * Durable filesystem primitives for ADR-0007 taxonomy artifacts.
 *
 * The caller owns root authorization and DB coordination. This module owns the
 * portable UTF-8 representation, optimistic conflict checks, serialized writes,
 * same-directory atomic replacement and reversible rename/delete staging.
 */

import { createHash, randomUUID } from "node:crypto";
import { open, mkdir, readFile, rename, rm, stat } from "node:fs/promises";
import { basename, dirname, isAbsolute, join } from "node:path";
import { serverLogger } from "@/lib/logger/server-logger";

const logger = serverLogger.withContext("FileBackedService");
const MAX_ARTIFACT_BYTES = 2 * 1024 * 1024;
const ARTIFACT_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
const ARTIFACT_EXTENSION = /^\.[A-Za-z0-9]{1,10}$/;
const HASH = /^[0-9a-f]{64}$/;
const AUTHORED_KEYS = new Set([
	"id",
	"kind",
	"schemaVersion",
	"title",
	"summary",
	"category",
	"emoji",
	"color",
	"purpose",
	"parameters",
]);
const PARAMETER_KEYS = new Set([
	"canonicalKey",
	"custom",
	"default",
	"description",
	"enumTokens",
	"example",
	"key",
	"multiple",
	"required",
	"type",
]);

export type ArtifactFamily = "note" | "prompt" | "wildcard";
export type ArtifactSyncStatus = "external_change" | "missing" | "synced";
export const CANONICAL_PROMPT_PARAMETER_KEYS = ["subject", "context", "tone", "style", "constraints"] as const;
export const PROMPT_PARAMETER_TYPES = ["text", "number", "boolean", "date", "enum_token"] as const;

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
	originalPath: string;
	quarantinePath: string;
}

export class ArtifactConflictError extends Error {
	constructor(message = "El artefacto cambió desde la última lectura.") {
		super(message);
		this.name = "ArtifactConflictError";
	}
}

export class ArtifactValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ArtifactValidationError";
	}
}

let mutationQueue: Promise<void> = Promise.resolve();

function runSerialized<T>(operation: () => Promise<T>): Promise<T> {
	const result = mutationQueue.then(operation, operation);
	mutationQueue = result.then(
		() => undefined,
		() => undefined,
	);
	return result;
}

function isMissingError(error: unknown): boolean {
	return (error as NodeJS.ErrnoException).code === "ENOENT";
}

function assertHash(hash: string, label: string): void {
	if (!HASH.test(hash)) throw new ArtifactValidationError(`${label} no es un SHA-256 canónico.`);
}

function validateText(value: unknown, label: string, maxLength: number): asserts value is string | undefined {
	if (value === undefined) return;
	if (typeof value !== "string" || value.includes("\0") || value.length > maxLength) {
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
			case "boolean":
				return typeof entry === "boolean";
			case "number":
				return typeof entry === "number" && Number.isFinite(entry);
			case "date":
				return typeof entry === "string" && /^\d{4}-\d{2}-\d{2}$/.test(entry);
			case "enum_token":
				return typeof entry === "string" && (parameter.enumTokens?.includes(entry) ?? false);
			case "text":
				return typeof entry === "string";
		}
	});
	if (!valid) throw new ArtifactValidationError(`${label} de ${parameter.key} no coincide con ${parameter.type}.`);
}

function validateParameter(parameter: ArtifactParameter): void {
	if (!(parameter && typeof parameter === "object" && !Array.isArray(parameter))) {
		throw new ArtifactValidationError("Un parameter authored no es un objeto gobernado.");
	}
	for (const key of Object.keys(parameter)) {
		if (!PARAMETER_KEYS.has(key)) throw new ArtifactValidationError(`Campo de parameter no gobernado: ${key}.`);
	}
	if (
		typeof parameter.key !== "string" ||
		!PARAMETER_KEY.test(parameter.key) ||
		typeof parameter.custom !== "boolean"
	) {
		throw new ArtifactValidationError("Un parameter authored tiene una identidad inválida.");
	}
	if (typeof parameter.type !== "string" || !PROMPT_PARAMETER_TYPES.includes(parameter.type)) {
		throw new ArtifactValidationError(`Parameter ${parameter.key} usa un tipo no gobernado.`);
	}
	if (parameter.multiple !== undefined && typeof parameter.multiple !== "boolean") {
		throw new ArtifactValidationError(`multiple de ${parameter.key} debe ser boolean.`);
	}
	if (parameter.required !== undefined && typeof parameter.required !== "boolean") {
		throw new ArtifactValidationError(`required de ${parameter.key} debe ser boolean.`);
	}
	const isCanonical = CANONICAL_PARAMETER_KEYS.has(parameter.key);
	if (parameter.custom === isCanonical) {
		throw new ArtifactValidationError(
			isCanonical
				? `Parameter ${parameter.key} pertenece al vocabulario canónico y no puede marcarse custom.`
				: `Parameter ${parameter.key} debe declararse custom.`,
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
			parameter.type !== "enum_token" ||
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
	} else if (parameter.type === "enum_token") {
		throw new ArtifactValidationError(`Parameter enum_token ${parameter.key} requiere enumTokens.`);
	}
	if (parameter.default !== undefined) validateParameterValue(parameter, parameter.default, "default");
	if (parameter.example !== undefined) validateParameterValue(parameter, parameter.example, "example");
}

function validatePromptBody(metadata: AuthoredMetadata, body: string): void {
	if (!metadata.purpose?.trim()) throw new ArtifactValidationError("Prompt portable requiere purpose authored.");
	if (!body.trim()) throw new ArtifactValidationError("Prompt portable requiere contenido authored.");
	const parameters = new Map((metadata.parameters ?? []).map((parameter) => [parameter.key, parameter]));
	const placeholders = new Set<string>();
	const placeholderPattern = /\{\{\s*([^{}]+?)\s*\}\}/g;
	for (const match of body.matchAll(placeholderPattern)) {
		const key = match[1];
		if (!PARAMETER_KEY.test(key)) throw new ArtifactValidationError(`Placeholder inválido: ${key}.`);
		if (!parameters.has(key)) throw new ArtifactValidationError(`Placeholder sin parameter declarado: ${key}.`);
		placeholders.add(key);
	}
	if (body.replace(placeholderPattern, "").includes("{{") || body.replace(placeholderPattern, "").includes("}}")) {
		throw new ArtifactValidationError("Prompt contiene un placeholder mal formado.");
	}
	for (const parameter of parameters.values()) {
		if (parameter.required && !placeholders.has(parameter.key)) {
			throw new ArtifactValidationError(`Parameter requerido no usado en el Prompt: ${parameter.key}.`);
		}
	}
}

function normalizeWildcardBody(body: string): string {
	const entries = normalizeArtifactContent(body)
		.split("\n")
		.map((entry) => entry.trim())
		.filter(Boolean);
	if (entries.length === 0) throw new ArtifactValidationError("Wildcard portable requiere al menos una entrada.");
	if (new Set(entries).size !== entries.length) {
		throw new ArtifactValidationError("Wildcard portable no admite entradas duplicadas.");
	}
	return entries.join("\n");
}

function normalizeAuthoredBody(metadata: AuthoredMetadata, body: string): string {
	const normalized = normalizeArtifactContent(body);
	if (metadata.kind === "prompt") validatePromptBody(metadata, normalized);
	if (metadata.kind === "wildcard") return normalizeWildcardBody(normalized);
	return normalized;
}

function validateMetadata(metadata: AuthoredMetadata): void {
	validateText(metadata.title, "title", 512);
	if (!metadata.title.trim()) throw new ArtifactValidationError("title es obligatorio.");
	validateText(metadata.summary, "summary", 4_096);
	validateText(metadata.category, "category", 128);
	validateText(metadata.emoji, "emoji", 32);
	validateText(metadata.color, "color", 128);
	validateText(metadata.purpose, "purpose", 4_096);

	const identityFields = [metadata.id, metadata.kind, metadata.schemaVersion];
	if (identityFields.some((value) => value !== undefined)) {
		if (!(metadata.id && ARTIFACT_ID.test(metadata.id))) {
			throw new ArtifactValidationError("id no cumple el contrato portable.");
		}
		if (!(metadata.kind && ["note", "prompt", "wildcard"].includes(metadata.kind))) {
			throw new ArtifactValidationError("kind no pertenece a una familia file-backed.");
		}
		if (metadata.schemaVersion !== 1) throw new ArtifactValidationError("schemaVersion no está soportado.");
	}

	if (metadata.kind !== "prompt" && (metadata.purpose !== undefined || metadata.parameters !== undefined)) {
		throw new ArtifactValidationError("purpose y parameters sólo pertenecen a Prompt.");
	}
	if (metadata.parameters !== undefined) {
		if (!Array.isArray(metadata.parameters))
			throw new ArtifactValidationError("parameters debe ser una lista gobernada.");
		if (metadata.parameters.length > 100) throw new ArtifactValidationError("parameters excede el límite gobernado.");
		const keys = new Set<string>();
		for (const parameter of metadata.parameters) {
			validateParameter(parameter);
			if (keys.has(parameter.key)) throw new ArtifactValidationError(`Parameter duplicado: ${parameter.key}.`);
			keys.add(parameter.key);
		}
	}
}

export function normalizeArtifactContent(content: string): string {
	if (typeof content !== "string") throw new ArtifactValidationError("El contenido authored debe ser texto UTF-8.");
	const normalized = content
		.replace(/^\uFEFF/, "")
		.replaceAll("\r\n", "\n")
		.replaceAll("\r", "\n");
	if (normalized.includes("\0")) throw new ArtifactValidationError("El contenido authored contiene bytes nulos.");
	if (Buffer.byteLength(normalized, "utf8") > MAX_ARTIFACT_BYTES) {
		throw new ArtifactValidationError(`El contenido authored excede ${MAX_ARTIFACT_BYTES} bytes.`);
	}
	return normalized;
}

async function readArtifactFileIfPresent(filePath: string): Promise<string | null> {
	try {
		return await readArtifactFile(filePath);
	} catch (error) {
		if (isMissingError(error)) return null;
		throw error;
	}
}

async function syncDirectoryBestEffort(directoryPath: string): Promise<void> {
	let handle: Awaited<ReturnType<typeof open>> | undefined;
	try {
		handle = await open(directoryPath, "r");
		await handle.sync();
	} catch (error) {
		const code = (error as NodeJS.ErrnoException).code;
		if (!["EACCES", "EISDIR", "EINVAL", "ENOTSUP", "EPERM", "UNKNOWN"].includes(code ?? "")) throw error;
	} finally {
		await handle?.close();
	}
}

export async function readArtifactFile(filePath: string): Promise<string> {
	const fileStat = await stat(filePath);
	if (!fileStat.isFile()) throw new ArtifactValidationError("La referencia taxonomy no apunta a un archivo regular.");
	if (fileStat.size > MAX_ARTIFACT_BYTES) {
		throw new ArtifactValidationError(`El archivo authored excede ${MAX_ARTIFACT_BYTES} bytes.`);
	}
	const bytes = await readFile(filePath);
	let content: string;
	try {
		content = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
	} catch {
		throw new ArtifactValidationError("El archivo authored no contiene UTF-8 válido.");
	}
	return normalizeArtifactContent(content);
}

export async function writeArtifactFile(
	filePath: string,
	content: string,
	options: ArtifactWriteOptions = {},
): Promise<ArtifactWriteResult> {
	const normalized = normalizeArtifactContent(content);
	if (options.expectedHash !== undefined) assertHash(options.expectedHash, "expectedHash");

	return runSerialized(async () => {
		const current = await readArtifactFileIfPresent(filePath);
		if (options.createOnly && current !== null) throw new ArtifactConflictError("El artefacto ya existe.");
		if (options.expectedHash !== undefined) {
			if (current === null || computeArtifactHash(current) !== options.expectedHash) throw new ArtifactConflictError();
		}

		const directoryPath = dirname(filePath);
		await mkdir(directoryPath, { recursive: true });
		const temporaryPath = join(directoryPath, `.${basename(filePath)}.${randomUUID()}.tmp`);
		let handle: Awaited<ReturnType<typeof open>> | undefined;
		try {
			handle = await open(temporaryPath, "wx", 0o600);
			await handle.writeFile(normalized, { encoding: "utf8" });
			await handle.sync();
			await handle.close();
			handle = undefined;
			const latest = await readArtifactFileIfPresent(filePath);
			if (options.createOnly && latest !== null) {
				throw new ArtifactConflictError("El artefacto apareció durante la escritura.");
			}
			if (options.expectedHash !== undefined) {
				if (latest === null || computeArtifactHash(latest) !== options.expectedHash) throw new ArtifactConflictError();
			}
			await rename(temporaryPath, filePath);
			await syncDirectoryBestEffort(directoryPath);
		} catch (error) {
			await handle?.close();
			await rm(temporaryPath, { force: true });
			throw error;
		}

		const result = {
			byteSize: Buffer.byteLength(normalized, "utf8"),
			contentHash: computeArtifactHash(normalized),
		};
		logger.info("Artifact file committed", result);
		return result;
	});
}

export function computeArtifactHash(content: string): string {
	return createHash("sha256").update(normalizeArtifactContent(content), "utf8").digest("hex");
}

export async function checkArtifactChanged(filePath: string, storedHash: string | null): Promise<SyncResult> {
	if (storedHash !== null) assertHash(storedHash, "storedHash");
	const content = await readArtifactFileIfPresent(filePath);
	if (content === null) {
		return { content: null, currentHash: null, needsReindex: false, status: "missing", storedHash };
	}
	const currentHash = computeArtifactHash(content);
	const needsReindex = currentHash !== storedHash;
	return {
		content,
		currentHash,
		needsReindex,
		status: needsReindex ? "external_change" : "synced",
		storedHash,
	};
}

function parseScalar(rawValue: string, key: string): unknown {
	if (key === "schemaVersion") {
		if (!/^\d+$/.test(rawValue)) throw new ArtifactValidationError("schemaVersion debe ser entero.");
		return Number(rawValue);
	}
	if (key === "parameters") {
		try {
			return JSON.parse(rawValue);
		} catch {
			throw new ArtifactValidationError("parameters debe ser JSON gobernado válido.");
		}
	}
	if (rawValue.startsWith('"')) {
		try {
			const parsed: unknown = JSON.parse(rawValue);
			if (typeof parsed !== "string") throw new Error("not-string");
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
	if (!frontmatterMatch) return { metadata: { title: "" }, body: normalized };

	const [, rawMetadata, rawBody] = frontmatterMatch;
	const values: Record<string, unknown> = {};
	for (const line of rawMetadata.split("\n")) {
		if (!line.trim()) continue;
		const colonIndex = line.indexOf(":");
		if (colonIndex < 1) throw new ArtifactValidationError("Frontmatter authored inválido.");
		const key = line.slice(0, colonIndex).trim();
		if (!AUTHORED_KEYS.has(key)) throw new ArtifactValidationError(`Campo authored no gobernado: ${key}.`);
		if (Object.hasOwn(values, key)) throw new ArtifactValidationError(`Campo authored duplicado: ${key}.`);
		values[key] = parseScalar(line.slice(colonIndex + 1).trim(), key);
	}

	const metadata = values as unknown as AuthoredMetadata;
	if (typeof metadata.title !== "string") throw new ArtifactValidationError("title es obligatorio.");
	validateMetadata(metadata);
	const body = rawBody.startsWith("\n") ? rawBody.slice(1) : rawBody;
	return { metadata, body: normalizeAuthoredBody(metadata, body) };
}

function appendString(lines: string[], key: string, value: string | undefined): void {
	if (value !== undefined) lines.push(`${key}: ${JSON.stringify(value)}`);
}

export function generateFrontmatter(metadata: AuthoredMetadata, body: string): string {
	validateMetadata(metadata);
	const normalizedBody = normalizeAuthoredBody(metadata, body);
	const lines = ["---"];
	appendString(lines, "id", metadata.id);
	appendString(lines, "kind", metadata.kind);
	if (metadata.schemaVersion !== undefined) lines.push(`schemaVersion: ${metadata.schemaVersion}`);
	appendString(lines, "title", metadata.title);
	appendString(lines, "summary", metadata.summary);
	appendString(lines, "category", metadata.category);
	appendString(lines, "emoji", metadata.emoji);
	appendString(lines, "color", metadata.color);
	appendString(lines, "purpose", metadata.purpose);
	if (metadata.parameters !== undefined) lines.push(`parameters: ${JSON.stringify(metadata.parameters)}`);
	lines.push("---", "", normalizedBody);
	return lines.join("\n");
}

export function buildArtifactPath(config: FileBackedConfig, artifactId: string): string {
	if (!isAbsolute(config.rootDir)) throw new ArtifactValidationError("rootDir debe ser absoluto.");
	if (!ARTIFACT_ID.test(artifactId)) throw new ArtifactValidationError("artifactId no cumple el contrato portable.");
	if (!ARTIFACT_EXTENSION.test(config.extension)) {
		throw new ArtifactValidationError("extension no cumple el contrato portable.");
	}
	return join(config.rootDir, `${artifactId}${config.extension}`);
}

export async function renameArtifactFile(
	sourcePath: string,
	destinationPath: string,
	expectedHash: string,
): Promise<ArtifactWriteResult> {
	assertHash(expectedHash, "expectedHash");
	return runSerialized(async () => {
		const source = await readArtifactFile(sourcePath);
		if (computeArtifactHash(source) !== expectedHash) throw new ArtifactConflictError();
		if ((await readArtifactFileIfPresent(destinationPath)) !== null) {
			throw new ArtifactConflictError("El destino del rename ya existe.");
		}
		await mkdir(dirname(destinationPath), { recursive: true });
		await rename(sourcePath, destinationPath);
		await syncDirectoryBestEffort(dirname(sourcePath));
		if (dirname(sourcePath) !== dirname(destinationPath)) await syncDirectoryBestEffort(dirname(destinationPath));
		return { byteSize: Buffer.byteLength(source, "utf8"), contentHash: expectedHash };
	});
}

export async function quarantineArtifactFile(filePath: string, expectedHash: string): Promise<QuarantinedArtifact> {
	assertHash(expectedHash, "expectedHash");
	return runSerialized(async () => {
		const content = await readArtifactFile(filePath);
		if (computeArtifactHash(content) !== expectedHash) throw new ArtifactConflictError();
		const quarantinePath = join(dirname(filePath), `.${basename(filePath)}.${randomUUID()}.quarantine`);
		await rename(filePath, quarantinePath);
		await syncDirectoryBestEffort(dirname(filePath));
		return { contentHash: expectedHash, originalPath: filePath, quarantinePath };
	});
}

export async function restoreQuarantinedArtifact(quarantine: QuarantinedArtifact): Promise<void> {
	return runSerialized(async () => {
		if ((await readArtifactFileIfPresent(quarantine.originalPath)) !== null) {
			throw new ArtifactConflictError("No se puede restaurar: el path original está ocupado.");
		}
		const content = await readArtifactFile(quarantine.quarantinePath);
		if (computeArtifactHash(content) !== quarantine.contentHash) throw new ArtifactConflictError();
		await rename(quarantine.quarantinePath, quarantine.originalPath);
		await syncDirectoryBestEffort(dirname(quarantine.originalPath));
	});
}

export async function commitQuarantinedArtifact(quarantine: QuarantinedArtifact): Promise<void> {
	return runSerialized(async () => {
		const content = await readArtifactFile(quarantine.quarantinePath);
		if (computeArtifactHash(content) !== quarantine.contentHash) throw new ArtifactConflictError();
		await rm(quarantine.quarantinePath);
		await syncDirectoryBestEffort(dirname(quarantine.quarantinePath));
	});
}
