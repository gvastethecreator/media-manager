/**
 * @file Enhanced File Operations Service
 * @module services/file/enhanced-file-operations.service
 * @description Enhanced file operations service with clipboard operations and batch support
 * Extends existing file operations with new functionality required by file browser improvements
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { createDefaultEntityStats } from '@/lib/utils';
import { getEntityName, getEntityPath } from '@/lib/utils/entity-properties.utils';
import { toastService } from '@/services/toast';
import { undoRedoManager } from '@/services/undo-redo/undo-redo-manager';
import type { AnyEntityWithStats } from '@/types/entities';
import { FileErrorCode } from '@/types/entities/file';
import { copyFile, deleteFile, getFileInfo, moveFile, renameFile } from './file.service';

const logger = serverLogger.withContext('EnhancedFileOperationsService');

// Helpers de path compatibles con navegador
const SEP_WIN = '\\';
const SEP_POSIX = '/';
const detectSep = (p: string): string => (p.includes(SEP_WIN) ? SEP_WIN : SEP_POSIX);
const joinPaths = (a: string, b: string): string => {
	const sep = detectSep(a || b);
	const aTrim = a.endsWith(sep) ? a.slice(0, -1) : a;
	const bTrim = b.startsWith(sep) ? b.slice(1) : b;
	if (!aTrim) {
		return bTrim;
	}
	if (!bTrim) {
		return aTrim;
	}
	return `${aTrim}${sep}${bTrim}`;
};
const dirnameCompat = (p: string): string => {
	if (!p) {
		return '';
	}
	const idxSlash = p.lastIndexOf(SEP_POSIX);
	const idxBack = p.lastIndexOf(SEP_WIN);
	const idx = Math.max(idxSlash, idxBack);
	return idx > 0 ? p.slice(0, idx) : '';
};

// Función creadora de errores (reutilizada del servicio principal)
const createFileError = (
	message: string,
	code: FileErrorCode = FileErrorCode.OPERATION_FAILED,
	cause?: unknown
): Error & { code: FileErrorCode; cause?: unknown } => {
	const error = new Error(message);
	error.name = 'FileError';
	return Object.assign(error, { code, cause });
};

// Clipboard data structure for file operations
interface ClipboardData {
	items: AnyEntityWithStats[];
	operation: 'copy' | 'cut';
	timestamp: number;
	source: string;
}

/**
 * Enhanced clipboard manager for file operations
 */
class ClipboardManager {
	private clipboardData: ClipboardData | null = null;

	/**
	 *y items to clipboard
	 */
	copy(items: AnyEntityWithStats[]): void {
		this.clipboardData = {
			items,
			operation: 'copy',
			timestamp: Date.now(),
			source: 'file-browser',
		};
		logger.info('📋 Items copied to clipboard:', items.length);
	}

	/**
	 * Cut items to clipboard
	 */
	cut(items: AnyEntityWithStats[]): void {
		this.clipboardData = {
			items,
			operation: 'cut',
			timestamp: Date.now(),
			source: 'file-browser',
		};
		logger.info('✂️ Items cut to clipboard:', items.length);
	}

	/**
	 * Check if clipboard has items that can be pasted
	 */
	canPaste(): boolean {
		return this.clipboardData !== null && this.clipboardData.items.length > 0;
	}

	/**
	 * Get clipboard data
	 */
	getClipboardData(): ClipboardData | null {
		return this.clipboardData;
	}

	/**
	 * Clear clipboard
	 */
	clear(): void {
		this.clipboardData = null;
		logger.info('🗑️ Clipboard cleared');
	}
}

// Global clipboard manager instance
const clipboardManager = new ClipboardManager();

/**
 * Helper function to convert FileInfo to AnyEntityWithStats format
 */
function convertFileInfoToEntity(fileInfo: any): AnyEntityWithStats {
	const stats = createDefaultEntityStats({
		size: Number(fileInfo.size) || 0,
		mtime: new Date(fileInfo.modifiedAt ?? Date.now()),
		birthtime: new Date(fileInfo.createdAt ?? fileInfo.modifiedAt ?? Date.now()),
		type: typeof fileInfo.type === 'string' ? fileInfo.type : 'file',
	});

	return {
		...fileInfo,
		entityType: 'file' as const,
		stats,
	} as AnyEntityWithStats;
}

/**
 * Enhanced file operations service with clipboard and batch operations
 */
export class EnhancedFileOperationsService {
	/**
	 * Copy items to clipboard
	 */
	async copyToClipboard(items: AnyEntityWithStats[]): Promise<void> {
		try {
			logger.info('📋 Copying items to clipboard:', items.length);

			clipboardManager.copy(items);

			// Show success toast
			const message =
				items.length === 1
					? `"${getEntityName(items[0])}" copiado al portapapeles`
					: `${items.length} elementos copiados al portapapeles`;
			toastService.success(message);
			await Promise.resolve();
		} catch (error) {
			logger.error('❌ Error copying to clipboard:', error);
			toastService.error('Error al copiar al portapapeles');
			throw createFileError('No se pudo copiar al portapapeles', FileErrorCode.OPERATION_FAILED, error);
		}
	}

	/**
	 * Cut items to clipboard
	 */
	async cutToClipboard(items: AnyEntityWithStats[]): Promise<void> {
		try {
			logger.info('✂️ Cutting items to clipboard:', items.length);

			clipboardManager.cut(items);

			// Show success toast
			const message =
				items.length === 1
					? `"${getEntityName(items[0])}" cortado al portapapeles`
					: `${items.length} elementos cortados al portapapeles`;
			toastService.success(message);
			await Promise.resolve();
		} catch (error) {
			logger.error('❌ Error cutting to clipboard:', error);
			toastService.error('Error al cortar al portapapeles');
			throw createFileError('No se pudo cortar al portapapeles', FileErrorCode.OPERATION_FAILED, error);
		}
	}

	/**
	 * Paste items from clipboard to target path with undo support
	 */
	async pasteFromClipboard(targetPath: string, enableUndo = true): Promise<AnyEntityWithStats[]> {
		try {
			logger.info('📋 Pasting from clipboard to:', targetPath);

			const clipboardData = clipboardManager.getClipboardData();
			if (!clipboardData) {
				throw createFileError('No hay elementos en el portapapeles', FileErrorCode.OPERATION_FAILED);
			}

			const operation = clipboardData.operation;

			if (enableUndo) {
				// Create and execute undoable action
				const action =
					operation === 'copy'
						? undoRedoManager.createCopyAction(clipboardData.items, targetPath)
						: undoRedoManager.createMoveAction(clipboardData.items, targetPath);

				await undoRedoManager.execute(action);

				// Clear clipboard if cut operation was successful
				if (operation === 'cut') {
					clipboardManager.clear();
				}

				// Return the target data from the action
				return action.targetData?.copiedItems || [];
			}
			// Legacy implementation without undo support
			return await this.legacyPasteWithoutUndo(clipboardData.items, targetPath, operation);
		} catch (error) {
			logger.error('❌ Error pasting from clipboard:', error);
			toastService.error('Error al pegar desde el portapapeles');
			throw createFileError('No se pudo pegar desde el portapapeles', FileErrorCode.OPERATION_FAILED, error);
		}
	}

	private async legacyPasteWithoutUndo(
		items: AnyEntityWithStats[],
		targetPath: string,
		operation: 'copy' | 'cut'
	): Promise<AnyEntityWithStats[]> {
		const results: AnyEntityWithStats[] = [];

		if (items.length > 1) {
			const opText = operation === 'copy' ? 'Copiando' : 'Moviendo';
			toastService.info(`${opText} ${items.length} elementos...`);
		}

		const processed = await Promise.all(
			items.map(async (item) => {
				const sourcePath = getEntityPath(item);
				const fileName = getEntityName(item);
				const destPath = joinPaths(targetPath, fileName);
				try {
					if (operation === 'copy') {
						const result = await copyFile(sourcePath, destPath);
						if (result.success && result.destInfo) {
							return convertFileInfoToEntity(result.destInfo);
						}
					} else {
						const result = await moveFile(sourcePath, destPath);
						if (result.success && result.destInfo) {
							return convertFileInfoToEntity(result.destInfo);
						}
					}
				} catch (itemError) {
					logger.error(`❌ Error processing item ${fileName}:`, itemError);
				}
				return null;
			})
		);

		for (const ent of processed) {
			if (ent) {
				results.push(ent);
			}
		}

		if (operation === 'cut' && results.length > 0) {
			clipboardManager.clear();
		}

		const operationText = operation === 'copy' ? 'copiados' : 'movidos';
		const message =
			results.length === 1
				? `"${getEntityName(results[0])}" ${operationText.slice(0, -1)} correctamente`
				: `${results.length} elementos ${operationText} correctamente`;
		toastService.success(message);

		logger.info('✅ Paste operation completed:', results.length);
		return results;
	}

	/**
	 * Rename item with inline editing support and undo support
	 */
	async renameItem(item: AnyEntityWithStats, newName: string, enableUndo = true): Promise<AnyEntityWithStats> {
		try {
			logger.info('📝 Renaming item:', { from: getEntityName(item), to: newName });

			const oldPath = getEntityPath(item);
			const newPath = joinPaths(dirnameCompat(oldPath), newName);

			if (enableUndo) {
				// Create and execute undoable action
				const action = undoRedoManager.createRenameAction(item, newName);
				await undoRedoManager.execute(action);

				// Return the renamed item data from the action
				if (action.targetData?.renamedItem) {
					return action.targetData.renamedItem;
				}

				// Fallback: get the file info directly
				const fileInfo = await getFileInfo(newPath);
				return convertFileInfoToEntity(fileInfo);
			}
			// Legacy implementation without undo support
			const result = await renameFile(oldPath, newPath);

			if (result.success) {
				// Get updated file info
				const updatedFileInfo = await getFileInfo(newPath);
				const updatedEntity = convertFileInfoToEntity(updatedFileInfo);

				toastService.success(`"${getEntityName(item)}" renombrado a "${newName}"`);
				logger.info('✅ Item renamed successfully');
				return updatedEntity;
			}

			throw createFileError('Error en la operación de renombrado', FileErrorCode.OPERATION_FAILED);
		} catch (error) {
			logger.error('❌ Error renaming item:', error);
			toastService.error(`Error al renombrar "${getEntityName(item)}"`);
			throw createFileError('No se pudo renombrar el elemento', FileErrorCode.OPERATION_FAILED, error);
		}
	}

	/**
	 * Move multiple items to target path with undo support (batch operation)
	 */
	async moveItems(items: AnyEntityWithStats[], targetPath: string, enableUndo = true): Promise<AnyEntityWithStats[]> {
		try {
			logger.info('🚚 Moving items:', { count: items.length, target: targetPath });

			if (enableUndo) {
				// Create and execute undoable action
				const action = undoRedoManager.createMoveAction(items, targetPath);
				await undoRedoManager.execute(action);

				// Return the moved items data from the action
				return action.targetData?.movedItems || [];
			}
			// Legacy implementation without undo support
			// Show progress toast for multiple items
			if (items.length > 1) {
				toastService.info(`Moviendo ${items.length} elementos...`);
			}

			const results: AnyEntityWithStats[] = [];
			const errors: string[] = [];

			const moveResults = await Promise.all(
				items.map(async (item) => {
					try {
						const sourcePath = getEntityPath(item);
						const fileName = getEntityName(item);
						const destPath = joinPaths(targetPath, fileName);

						const result = await moveFile(sourcePath, destPath);

						if (result.success && result.destInfo) {
							return convertFileInfoToEntity(result.destInfo);
						}
					} catch (itemError) {
						logger.error(`❌ Error moving item ${getEntityName(item)}:`, itemError);
						errors.push(`Error moviendo "${getEntityName(item)}"`);
					}
					return null;
				})
			);

			for (const ent of moveResults) {
				if (ent) {
					results.push(ent);
				}
			}

			// Show results
			if (results.length > 0) {
				const message =
					results.length === 1
						? `"${getEntityName(results[0])}" movido correctamente`
						: `${results.length} elementos movidos correctamente`;
				toastService.success(message);
			}

			if (errors.length > 0) {
				toastService.error(`${errors.length} elementos no pudieron ser movidos`);
			}

			logger.info('✅ Move operation completed:', { success: results.length, errors: errors.length });
			return results;
		} catch (error) {
			logger.error('❌ Error moving items:', error);
			toastService.error('Error al mover elementos');
			throw createFileError('No se pudieron mover los elementos', FileErrorCode.OPERATION_FAILED, error);
		}
	}

	/**
	 * Delete multiple items with undo support
	 */
	async deleteItems(items: AnyEntityWithStats[], enableUndo = true): Promise<void> {
		try {
			logger.info('🗑️ Deleting items:', items.length);

			if (enableUndo) {
				// Create and execute undoable action
				const action = undoRedoManager.createDeleteAction(items);
				await undoRedoManager.execute(action);
			} else {
				// Legacy implementation without undo support
				// Show progress toast for multiple items
				if (items.length > 1) {
					toastService.info(`Eliminando ${items.length} elementos...`);
				}

				const errors: string[] = [];
				let successCount = 0;

				const deletions = await Promise.all(
					items.map(async (item) => {
						try {
							const itemPath = getEntityPath(item);
							await deleteFile(itemPath);
							return true;
						} catch (itemError) {
							logger.error(`❌ Error deleting item ${getEntityName(item)}:`, itemError);
							errors.push(`Error eliminando "${getEntityName(item)}"`);
							return false;
						}
					})
				);

				successCount = deletions.filter(Boolean).length;

				// Show results
				if (successCount > 0) {
					const message =
						successCount === 1
							? '1 elemento eliminado correctamente'
							: `${successCount} elementos eliminados correctamente`;
					toastService.success(message);
				}

				if (errors.length > 0) {
					toastService.error(`${errors.length} elementos no pudieron ser eliminados`);
				}

				logger.info('✅ Delete operation completed:', { success: successCount, errors: errors.length });
			}
		} catch (error) {
			logger.error('❌ Error deleting items:', error);
			toastService.error('Error al eliminar elementos');
			throw createFileError('No se pudieron eliminar los elementos', FileErrorCode.OPERATION_FAILED, error);
		}
	}

	/**
	 * Copy multiple items to a target directory with undo support
	 */
	async copyItems(items: AnyEntityWithStats[], targetPath: string, enableUndo = true): Promise<AnyEntityWithStats[]> {
		try {
			logger.info('📋 Copying items:', { count: items.length, targetPath });

			if (enableUndo) {
				// Create and execute undoable action
				const action = undoRedoManager.createCopyAction(items, targetPath);
				await undoRedoManager.execute(action);

				// Return the copied items data from the action
				return action.targetData?.copiedItems || [];
			}
			// Legacy implementation without undo support
			const results: AnyEntityWithStats[] = [];

			// Show progress toast for multiple items
			if (items.length > 1) {
				toastService.info(`Copiando ${items.length} elementos...`);
			}

			const copyResults = await Promise.all(
				items.map(async (item) => {
					const sourcePath = getEntityPath(item);
					const destPath = joinPaths(targetPath, getEntityName(item));

					try {
						const result = await copyFile(sourcePath, destPath);
						if (result.success && result.destInfo) {
							return convertFileInfoToEntity(result.destInfo);
						}
					} catch (itemError) {
						logger.error(`❌ Error copying item ${getEntityName(item)}:`, itemError);
					}
					return null;
				})
			);

			for (const ent of copyResults) {
				if (ent) {
					results.push(ent);
				}
			}

			// Show success toast
			const message =
				results.length === 1
					? `"${getEntityName(results[0])}" copiado correctamente`
					: `${results.length} elementos copiados correctamente`;
			toastService.success(message);

			logger.info('✅ Copy operation completed:', results.length);
			return results;
		} catch (error) {
			logger.error('❌ Error copying items:', error);
			toastService.error('Error al copiar los elementos');
			throw createFileError('No se pudieron copiar los elementos', FileErrorCode.OPERATION_FAILED, error);
		}
	}

	/**
	 * Check if clipboard has items that can be pasted
	 */
	canPaste(): boolean {
		return clipboardManager.canPaste();
	}

	/**
	 * Get clipboard data for UI state
	 */
	getClipboardData(): ClipboardData | null {
		return clipboardManager.getClipboardData();
	}

	/**
	 * Clear clipboard
	 */
	clearClipboard(): void {
		clipboardManager.clear();
	}
}

// Create and export enhanced service instance
export const enhancedFileOperationsService = new EnhancedFileOperationsService();

// Nota: ClipboardData es interno a este módulo para evitar colisiones con
// el tipo homónimo exportado por services/clipboard. No exportar aquí ni re-exportar clipboardManager.
