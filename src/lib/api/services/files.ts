import type { FileInfo } from '@/types/file-entity-mapper';
import type { FileOperationResult } from '@/lib/types';

// TODO: Definir estos tipos correctamente si se usan en la API
type DirectoryReadResult = any;
type FileCopyMoveResult = any;
type FileOperationOptions = any;
import apiClient from '../client';

const API_BASE = '/files';

export const getFileInfo = async (filePath: string): Promise<FileInfo> => {
	const response = await apiClient.get(`${API_BASE}/info`, { params: { path: filePath } });
	return response.data;
};

export const getDirectoryInfo = async (dirPath: string): Promise<DirectoryReadResult> => {
	const response = await apiClient.get(`${API_BASE}/list`, { params: { path: dirPath } });
	return response.data;
};

export const deleteFile = async (filePath: string): Promise<FileOperationResult> => {
	const response = await apiClient.delete(API_BASE, { params: { path: filePath } });
	return response.data;
};

export const createDirectory = async (
	dirPath: string,
	options?: FileOperationOptions
): Promise<FileOperationResult> => {
	const response = await apiClient.post(`${API_BASE}/dir`, { path: dirPath, options });
	return response.data;
};

export const renameFile = async (
	oldPath: string,
	newPath: string,
	options?: FileOperationOptions
): Promise<FileOperationResult> => {
	const response = await apiClient.put(`${API_BASE}/rename`, { oldPath, newPath, options });
	return response.data;
};

export const copyFile = async (
	sourcePath: string,
	destPath: string,
	options?: FileOperationOptions
): Promise<FileCopyMoveResult> => {
	const response = await apiClient.post(`${API_BASE}/copy`, { sourcePath, destPath, options });
	return response.data;
};

export const moveFile = async (
	sourcePath: string,
	destPath: string,
	options?: FileOperationOptions
): Promise<FileCopyMoveResult> => {
	const response = await apiClient.post(`${API_BASE}/move`, { sourcePath, destPath, options });
	return response.data;
};

export const getFileAsDataUrl = async (filePath: string): Promise<{ dataUrl: string; mimeType: string }> => {
	const response = await apiClient.get(`${API_BASE}/data-url`, { params: { path: filePath } });
	return response.data;
};
