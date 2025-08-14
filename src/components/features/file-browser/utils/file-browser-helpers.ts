/**
 * @file Helper functions para FileBrowser
 * @module components/features/file-browser/utils/file-browser-helpers
 * @description Funciones utilitarias extraídas del FileBrowser para mejorar la mantenibilidad
 */

import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/lib/ui/toast';
import { clipboardManager } from '@/services/clipboard/clipboard-manager';
import { useImageStore } from '@/store/entities/image';
import { type AnyEntityWithStats, EntityStatsType } from '@/types/migration';

const logger = clientLogger.withContext('FileBrowserHelpers');

// ==================== HELPERS DE PROPIEDADES ====================

export const getItemName = (item: AnyEntityWithStats): string =>
	'name' in item && item.name ? String(item.name) : 'Unknown';

export const getItemSize = (item: AnyEntityWithStats): number => ('size' in item && item.size ? Number(item.size) : 0);

export const getItemPath = (item: AnyEntityWithStats): string => ('path' in item && item.path ? String(item.path) : '');

export const getItemDate = (item: AnyEntityWithStats): Date =>
	new Date('updatedAt' in item && item.updatedAt ? item.updatedAt : Date.now());

export const getItemExtension = (item: AnyEntityWithStats): string =>
	'extension' in item && item.extension ? String(item.extension) : '';

export const getItemMimeType = (item: AnyEntityWithStats): string =>
	'mimeType' in item && item.mimeType ? String(item.mimeType) : 'application/octet-stream';

// ==================== HELPERS DE CARGA DE DATOS ====================

export const loadImagesForType = async (
	filterId: string | undefined,
	filterType: string | undefined,
	loadParamsKey: string,
	lastLoadParamsRef: React.MutableRefObject<string>,
	isLoadingRef: React.MutableRefObject<boolean>
) => {
	const { loadImages: storeLoadImagesFunc, getImagesByFolder: getImagesByFolderFunc } = useImageStore.getState();

	// Verificar si ya existen imágenes para esta carpeta
	if (filterId && filterType === 'folder') {
		const existingImages = getImagesByFolderFunc(filterId);
		if (existingImages.length > 0) {
			lastLoadParamsRef.current = loadParamsKey;
			return;
		}
	}

	const loadParams: Parameters<typeof storeLoadImagesFunc>[0] = {};

	// Si hay filtro de carpeta, incluirlo en los parámetros
	if (filterId && filterType === 'folder') {
		loadParams.folderId = filterId;
	}

	// OPTIMIZACIÓN: Eliminar logs costosos en producción
	if (process.env.NODE_ENV === 'development') {
		logger.debug('🔄 FileBrowser iniciando carga de imágenes', { filterId, filterType, loadParams });
	}

	// Marcar como cargando
	isLoadingRef.current = true;
	lastLoadParamsRef.current = loadParamsKey;

	try {
		await storeLoadImagesFunc(loadParams);
		if (process.env.NODE_ENV === 'development') {
			logger.debug('✅ Carga de imágenes completada');
		}
	} catch (loadError) {
		logger.error('❌ Error al cargar imágenes en FileBrowser:', loadError);
	} finally {
		isLoadingRef.current = false;
	}
};

export const getTypesToLoad = (entityType: EntityStatsType | 'mixed' | string, entityTypes: EntityStatsType[]) => {
	return entityType === 'mixed' ? entityTypes : [entityType as EntityStatsType];
};

export const getItemsByType = (
	type: string,
	filterId: string | undefined,
	filterType: string | undefined,
	getImagesByFolder: (folderId: string) => any[],
	getSortedImages: () => any[]
): AnyEntityWithStats[] => {
	switch (type) {
		case 'image':
			if (filterId && filterType === 'folder') {
				return getImagesByFolder(filterId);
			}
			return getSortedImages();
		default:
			return [];
	}
};

export const getMixedItems = (
	entityTypes: EntityStatsType[],
	filterId: string | undefined,
	filterType: string | undefined,
	getImagesByFolder: (folderId: string) => any[],
	getSortedImages: () => any[]
): AnyEntityWithStats[] => {
	const items: AnyEntityWithStats[] = [];
	for (const type of entityTypes) {
		items.push(...getItemsByType(type, filterId, filterType, getImagesByFolder, getSortedImages));
	}
	return items;
};

// ==================== HELPERS DE EXTRACCIÓN ====================

export const extractEntityName = (entity: AnyEntityWithStats): string => {
	if ('name' in entity && typeof entity.name === 'string') {
		return entity.name;
	}
	if ('title' in entity && typeof entity.title === 'string') {
		return entity.title;
	}
	return '';
};

export const extractEntityPath = (entity: AnyEntityWithStats): string => {
	if ('path' in entity && typeof entity.path === 'string') {
		return entity.path;
	}
	if ('category' in entity && typeof entity.category === 'string') {
		return entity.category;
	}
	return '';
};

// ==================== HELPERS DE COMPARACIÓN ====================

export const compareByField = (aValues: any, bValues: any, field: string): number => {
	switch (field) {
		case 'name':
			return aValues.name.localeCompare(bValues.name);
		case 'modifiedAt':
			return aValues.modifiedTime - bValues.modifiedTime;
		case 'createdAt':
			return aValues.createdTime - bValues.createdTime;
		case 'modifiedTime':
			return aValues.modifiedTime - bValues.modifiedTime;
		case 'createdTime':
			return aValues.createdTime - bValues.createdTime;
		case 'updatedAt': // alias adicional para claridad (frontend puede usar updatedAt)
			return aValues.modifiedTime - bValues.modifiedTime;
		default:
			return 0;
	}
};

// ==================== HELPERS DE ERROR ====================

export const getMixedModeError = (entityTypes: EntityStatsType[], imagesError: any): any => {
	for (const type of entityTypes) {
		if (type === 'image' && imagesError) {
			return imagesError;
		}
	}
	return null;
};

export const getSpecificModeError = (entityType: string, imagesError: any): any => {
	switch (entityType) {
		case 'image':
			return imagesError;
		default:
			return null;
	}
};

// ==================== HELPERS DE ACCIONES ====================

export const handleCopyAction = async (effectiveSelectedIds: string[], items: AnyEntityWithStats[]) => {
	if (effectiveSelectedIds.length > 0) {
		const selectedItems = items.filter((item) => effectiveSelectedIds.includes(item.id));
		try {
			await clipboardManager.copy(selectedItems);
			toastService.success(`${selectedItems.length} elemento(s) copiado(s)`);
		} catch (err) {
			console.error('Error al copiar:', err);
			toastService.error('Error al copiar elementos');
		}
	}
};

export const handleCutAction = async (effectiveSelectedIds: string[], items: AnyEntityWithStats[]) => {
	if (effectiveSelectedIds.length > 0) {
		const selectedItems = items.filter((item) => effectiveSelectedIds.includes(item.id));
		try {
			await clipboardManager.cut(selectedItems);
			toastService.success(`${selectedItems.length} elemento(s) cortado(s)`);
		} catch (err) {
			console.error('Error al cortar:', err);
			toastService.error('Error al cortar elementos');
		}
	}
};

export const handleOtherActions = (action: string, effectiveSelectedIds: string[]) => {
	switch (action) {
		case 'paste':
			toastService.info('Funcionalidad de pegar en desarrollo');
			break;
		case 'delete':
			if (effectiveSelectedIds.length > 0) {
				toastService.info('Funcionalidad de eliminación en desarrollo');
			}
			break;
		case 'download':
			if (effectiveSelectedIds.length > 0) {
				toastService.info('Funcionalidad de descarga en desarrollo');
			}
			break;
		default:
			toastService.info(`Funcionalidad "${action}" en desarrollo`);
			break;
	}
};

// ==================== HELPERS DE CONVERSIÓN ====================

export const convertItemToViewerFormat = (item: AnyEntityWithStats) => {
	const name = ('name' in item ? item.name : 'Untitled') as string;
	const path = ('path' in item ? item.path : '') as string;

	return {
		id: item.id,
		name,
		type: 'image' as const,
		path,
		size: ('size' in item ? item.size : 0) as number,
		width: ('width' in item ? item.width : 0) as number,
		height: ('height' in item ? item.height : 0) as number,
		thumbnail: ('thumbnail' in item ? item.thumbnail : '') as string,
		metadata: '',
		src: path,
		alt: name,
	};
};

export const convertToFileItem = (item: AnyEntityWithStats) => {
	return {
		id: item.id,
		name: getItemName(item),
		type: 'file' as const,
		size: getItemSize(item),
		modifiedAt: getItemDate(item),
		path: getItemPath(item),
		isDirectory: false,
		extension: getItemExtension(item),
		mimeType: getItemMimeType(item),
	};
};
