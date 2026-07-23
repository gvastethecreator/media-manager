import type { ImageItem } from './file-viewer.types';

type ViewerEntity = Record<string, unknown>;

function textValue(value: unknown, fallback = ''): string {
	return typeof value === 'string' ? value : fallback;
}

function numberValue(value: unknown): number | null {
	return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * Reduce un DTO de entidad al contrato estable del visor global.
 * El visor no recibe rutas físicas ni necesita conocer el DTO completo.
 */
export function toFileViewerItem(entity: ViewerEntity, type: ImageItem['type']): ImageItem {
	const thumbnail = textValue(entity.thumbnail) || null;
	const thumbnailUrl = textValue(entity.thumbnailUrl) || undefined;

	return {
		alt: textValue(entity.alt) || undefined,
		duration: numberValue(entity.duration),
		height: numberValue(entity.height),
		id: textValue(entity.id),
		metadata: typeof entity.metadata === 'string' ? entity.metadata : null,
		mimeType: textValue(entity.mimeType) || undefined,
		name: textValue(entity.name, 'Archivo sin nombre'),
		size: numberValue(entity.size) ?? 0,
		thumbnail,
		thumbnailUrl,
		type,
		width: numberValue(entity.width),
	};
}
