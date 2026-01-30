import type { FileOperationResult } from '@/lib/types';
import type { FileInfo } from '@/types/file-entity-mapper';

// Tipos definidos para las operaciones de archivos
interface DirectoryReadResult {
	files: FileInfo[];
	total: number;
	path: string;
}

interface FileCopyMoveResult {
	success: boolean;
	sourcePath: string;
	destPath: string;
	message?: string;
}

interface FileOperationOptions {
	overwrite?: boolean;
	recursive?: boolean;
	preserveTimestamps?: boolean;
}

import apiClient from '../client';

const API_BASE = '/files';

export const getFileInfo = async (filePath: string): Promise<FileInfo> => {
	const response = await apiClient.get<{ data: FileInfo }>(`${API_BASE}/info?path=${encodeURIComponent(filePath)}`);
	return response.data;
};

export const getDirectoryInfo = async (dirPath: string): Promise<DirectoryReadResult> => {
	const response = await apiClient.get<{ data: DirectoryReadResult }>(
		`${API_BASE}/list?path=${encodeURIComponent(dirPath)}`
	);
	return response.data;
};

export const deleteFile = async (filePath: string): Promise<FileOperationResult> => {
	const response = await apiClient.delete<{ data: FileOperationResult }>(
		`${API_BASE}?path=${encodeURIComponent(filePath)}`
	);
	return response.data;
};

export const createDirectory = async (
	dirPath: string,
	options?: FileOperationOptions
): Promise<FileOperationResult> => {
	const response = await apiClient.post<{ data: FileOperationResult }>(`${API_BASE}/dir`, { path: dirPath, options });
	return response.data;
};

export const renameFile = async (
	oldPath: string,
	newPath: string,
	options?: FileOperationOptions
): Promise<FileOperationResult> => {
	const response = await apiClient.put<{ data: FileOperationResult }>(`${API_BASE}/rename`, {
		oldPath,
		newPath,
		options,
	});
	return response.data;
};

export const copyFile = async (
	sourcePath: string,
	destPath: string,
	options?: FileOperationOptions
): Promise<FileCopyMoveResult> => {
	const response = await apiClient.post<{ data: FileCopyMoveResult }>(`${API_BASE}/copy`, {
		sourcePath,
		destPath,
		options,
	});
	return response.data;
};

export const moveFile = async (
	sourcePath: string,
	destPath: string,
	options?: FileOperationOptions
): Promise<FileCopyMoveResult> => {
	const response = await apiClient.post<{ data: FileCopyMoveResult }>(`${API_BASE}/move`, {
		sourcePath,
		destPath,
		options,
	});
	return response.data;
};

export const getFileAsDataUrl = async (filePath: string): Promise<{ dataUrl: string; mimeType: string }> => {
	const response = await apiClient.get<{ data: { dataUrl: string; mimeType: string } }>(
		`${API_BASE}/data-url?path=${encodeURIComponent(filePath)}`
	);
	return response.data;
};
