/**
 * @file Enums para la entidad File
 * @module types/entities/file/enums
 */

/**
 * Tipos de archivo soportados
 */
export enum FileType {
	DIRECTORY = 'directory',
	FILE = 'file',
	IMAGE = 'image',
	VIDEO = 'video',
	AUDIO = 'audio',
	DOCUMENT = 'document',
	ARCHIVE = 'archive',
	OTHER = 'other',
}

/**
 * Códigos de error para operaciones de archivo
 */
export enum FileErrorCode {
	NOT_FOUND = 'FILE_NOT_FOUND',
	ACCESS_DENIED = 'ACCESS_DENIED',
	ALREADY_EXISTS = 'ALREADY_EXISTS',
	INVALID_PATH = 'INVALID_PATH',
	NOT_A_FILE = 'NOT_A_FILE',
	NOT_A_DIRECTORY = 'NOT_A_DIRECTORY',
	OPERATION_FAILED = 'OPERATION_FAILED',
	VALIDATION_ERROR = 'VALIDATION_ERROR',
	UNKNOWN = 'UNKNOWN_ERROR',
}

/**
 * Tipos de eventos relacionados con archivos
 */
export enum FileEventType {
	CREATED = 'file:created',
	MODIFIED = 'file:modified',
	DELETED = 'file:deleted',
	MOVED = 'file:moved',
	COPIED = 'file:copied',
	RENAMED = 'file:renamed',
	DIRECTORY_CREATED = 'directory:created',
	DIRECTORY_DELETED = 'directory:deleted',
}

/**
 * Permisos de archivo
 */
export enum FilePermission {
	READ = 'read',
	WRITE = 'write',
	EXECUTE = 'execute',
}

/**
 * Opciones de ordenamiento para listado de archivos
 */
export enum FileSortOption {
	NAME_ASC = 'name:asc',
	NAME_DESC = 'name:desc',
	SIZE_ASC = 'size:asc',
	SIZE_DESC = 'size:desc',
	DATE_CREATED_ASC = 'created:asc',
	DATE_CREATED_DESC = 'created:desc',
	DATE_MODIFIED_ASC = 'modified:asc',
	DATE_MODIFIED_DESC = 'modified:desc',
	TYPE_ASC = 'type:asc',
	TYPE_DESC = 'type:desc',
}

/**
 * Tipos MIME comunes
 */
export enum CommonMimeType {
	JPEG = 'image/jpeg',
	PNG = 'image/png',
	GIF = 'image/gif',
	WEBP = 'image/webp',
	SVG = 'image/svg+xml',
	PDF = 'application/pdf',
	JSON = 'application/json',
	TEXT = 'text/plain',
	HTML = 'text/html',
	CSS = 'text/css',
	JAVASCRIPT = 'application/javascript',
	MP4 = 'video/mp4',
	MP3 = 'audio/mpeg',
	ZIP = 'application/zip',
}

/**
 * Grupos de extensiones de archivo por tipo
 */
export const FILE_EXTENSION_GROUPS = {
	IMAGE: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff'],
	VIDEO: ['.mp4', '.webm', '.avi', '.mov', '.mkv', '.flv'],
	AUDIO: ['.mp3', '.wav', '.flac', '.aac', '.ogg'],
	DOCUMENT: ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.xlsx', '.pptx'],
	ARCHIVE: ['.zip', '.rar', '.tar', '.gz', '.7z'],
} as const;
