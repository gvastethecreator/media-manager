/**
 * @file Mappers para la entidad File
 * @module transformers/file/mappers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type {
	DirectoryInfo,
	EnhancedDirectory,
	EnhancedImageFile,
	FileBase,
	FileFilterOptions,
	FileInfo,
	ImageFileInfo,
} from '@/types/entities/file';
import { FILE_EXTENSION_GROUPS, FileType } from '@/types/entities/file/enums';
import type { Stats } from 'fs';
import path from 'path';

const mappersLogger = serverLogger.withContext('File:Mappers');

export function generateFileId(filePath: string): string {
	const normalizedPath = path.normalize(filePath).replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
	return Buffer.from(normalizedPath).toString('base64');
}

export function determineFileType(extension: string): FileType {
	if (!extension) return FileType.OTHER;
	const ext = extension.toLowerCase();
	if (FILE_EXTENSION_GROUPS.IMAGE.includes(ext as any)) return FileType.IMAGE;
	if (FILE_EXTENSION_GROUPS.VIDEO.includes(ext as any)) return FileType.VIDEO;
	if (FILE_EXTENSION_GROUPS.AUDIO.includes(ext as any)) return FileType.AUDIO;
	if (FILE_EXTENSION_GROUPS.DOCUMENT.includes(ext as any)) return FileType.DOCUMENT;
	if (FILE_EXTENSION_GROUPS.ARCHIVE.includes(ext as any)) return FileType.ARCHIVE;
	return FileType.FILE;
}

export function determineMimeType(extension: string): string {
	const mimeTypes: Record<string, string> = {
		'.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif',
		'.webp': 'image/webp', '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.doc': 'application/msword',
		'.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.xls': 'application/vnd.ms-excel',
		'.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.ppt': 'application/vnd.ms-powerpoint',
		'.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation', '.txt': 'text/plain',
		'.md': 'text/markdown', '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
		'.json': 'application/json', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.mp4': 'video/mp4',
		'.avi': 'video/x-msvideo', '.mov': 'video/quicktime', '.zip': 'application/zip', '.rar': 'application/vnd.rar',
		'.tar': 'application/x-tar', '.gz': 'application/gzip',
	};
	return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}

export function mapStatsToFileInfo(filePath: string, stats: Stats): FileInfo {
	const isDirectory = stats.isDirectory();
	const name = path.basename(filePath);
	const extension = isDirectory ? '' : path.extname(filePath);
	return {
		id: generateFileId(filePath),
		name,
		path: filePath,
		type: isDirectory ? FileType.DIRECTORY : determineFileType(extension),
		extension,
		mimeType: isDirectory ? 'directory' : determineMimeType(extension),
		size: stats.size,
		createdAt: stats.birthtime || stats.ctime,
		updatedAt: stats.mtime,
		modifiedAt: stats.mtime,
		accessedAt: stats.atime,
		isDirectory,
		parentPath: path.dirname(filePath),
		absolutePath: path.resolve(filePath),
		relativePath: path.relative(process.cwd(), filePath),
	};
}

export function toFileListItem(fileInfo: FileInfo): FileListItem {
	return {
		id: fileInfo.id,
		path: fileInfo.path,
		name: fileInfo.name,
		type: fileInfo.type,
		size: fileInfo.size,
		isDirectory: fileInfo.isDirectory,
		extension: fileInfo.extension,
		modifiedAt: fileInfo.modifiedAt,
		createdAt: fileInfo.createdAt,
		icon: getIconForFileType(fileInfo.type, fileInfo.extension),
		iconColor: getColorForFileType(fileInfo.type),
	};
}

export function getIconForFileType(fileType: string, extension: string = ''): string {
	const iconMap: Record<string, string> = {
		[FileType.DIRECTORY]: '📁', [FileType.FILE]: '📄', [FileType.IMAGE]: '🖼️',
		[FileType.VIDEO]: '🎬', [FileType.AUDIO]: '🎵', [FileType.DOCUMENT]: '📝',
		[FileType.ARCHIVE]: '🗄️', [FileType.OTHER]: '❓',
	};
	const extensionIconMap: Record<string, string> = {
		'.pdf': '📑', '.doc': '📘', '.docx': '📘', '.xls': '📊', '.xlsx': '📊', '.ppt': '📽️',
		'.pptx': '📽️', '.txt': '📃', '.md': '📝', '.json': '🔍', '.zip': '📦', '.rar': '📦',
	};
	return extensionIconMap[extension] || iconMap[fileType] || iconMap[FileType.OTHER];
}

export function getColorForFileType(fileType: string): string {
	const colorMap: Record<string, string> = {
		[FileType.DIRECTORY]: '#3b82f6', [FileType.FILE]: '#64748b', [FileType.IMAGE]: '#10b981',
		[FileType.VIDEO]: '#f97316', [FileType.AUDIO]: '#8b5cf6', [FileType.DOCUMENT]: '#0ea5e9',
		[FileType.ARCHIVE]: '#f59e0b', [FileType.OTHER]: '#6b7280',
	};
	return colorMap[fileType] || colorMap[FileType.OTHER];
}

export function toEnhancedDirectory(fileInfo: FileInfo, childItems: FileBase[] = []): EnhancedDirectory | null {
	if (!fileInfo.isDirectory) return null;
	const stats = {
		fileTypes: {} as Record<string, number>,
		totalSize: 0,
		lastModified: fileInfo.modifiedAt,
		averageFileSize: 0,
	};
	const contentSummary = { images: 0, videos: 0, documents: 0, others: 0 };
	let fileCount = 0;
	for (const item of childItems) {
		if (!item.isDirectory) {
			stats.totalSize += item.size;
			const typeKey = item.type || 'others';
			stats.fileTypes[typeKey] = (stats.fileTypes[typeKey] || 0) + 1;
			if (item.type === FileType.IMAGE) contentSummary.images++;
			else if (item.type === FileType.VIDEO) contentSummary.videos++;
			else if (item.type === FileType.DOCUMENT) contentSummary.documents++;
			else contentSummary.others++;
			fileCount++;
		}
	}
	if (fileCount > 0) stats.averageFileSize = stats.totalSize / fileCount;
	return {
		...(fileInfo as DirectoryInfo),
		stats,
		contentSummary,
		childCount: childItems.length,
		level: fileInfo.path.split('/').length,
	};
}

export function toEnhancedImageFile(fileInfo: FileInfo, imageMetadata: ImageMetadata = {}): EnhancedImageFile | null {
	if (fileInfo.type !== FileType.IMAGE) return null;
	return {
		...(fileInfo as ImageFileInfo),
		width: imageMetadata.width,
		height: imageMetadata.height,
		metadata: imageMetadata,
	};
}

export function applyFileFilters(files: FileBase[], options: FileFilterOptions): FileBase[] {
	let filteredFiles = files;
	if (options.searchTerm) {
		const searchTerm = options.searchTerm.toLowerCase();
		filteredFiles = filteredFiles.filter(f => f.name.toLowerCase().includes(searchTerm));
	}
	if (options.fileTypes?.length) {
		filteredFiles = filteredFiles.filter(f => options.fileTypes!.includes(f.type as FileType));
	}
	if (options.extensions?.length) {
		filteredFiles = filteredFiles.filter(f => f.extension && options.extensions!.includes(f.extension.toLowerCase()));
	}
	if (options.minSize) {
		filteredFiles = filteredFiles.filter(f => f.size >= options.minSize!);
	}
	if (options.maxSize) {
		filteredFiles = filteredFiles.filter(f => f.size <= options.maxSize!);
	}
	if (options.modifiedAfter) {
		filteredFiles = filteredFiles.filter(f => new Date(f.modifiedAt) > new Date(options.modifiedAfter!));
	}
	if (options.modifiedBefore) {
		filteredFiles = filteredFiles.filter(f => new Date(f.modifiedAt) < new Date(options.modifiedBefore!));
	}
	if (options.sortBy) {
		filteredFiles.sort((a, b) => {
			const fieldA = (a as any)[options.sortBy!];
			const fieldB = (b as any)[options.sortBy!];
			const order = options.sortOrder === 'asc' ? 1 : -1;
			if (fieldA < fieldB) return -1 * order;
			if (fieldA > fieldB) return 1 * order;
			return 0;
		});
	}
	return filteredFiles;
}
