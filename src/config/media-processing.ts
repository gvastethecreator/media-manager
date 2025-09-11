// Configuración centralizada para límites de procesamiento de medios
// Previene OOM / cuelgues durante reindex de directorios masivos
export interface MediaProcessingLimits {
	maxImageFileSizeBytes: number; // Límite duro para creación + thumbnail
	maxVideoFileSizeBytes: number; // Límite para procesamiento de videos
	max3DFileSizeBytes: number; // Límite para archivos 3D (obj, fbx, blend, etc.)
	maxDocumentFileSizeBytes: number; // Límite para documentos (pdf, etc.)
	enableImageSizeSkip: boolean; // Activar/Desactivar skip
}

const MB = 1024 * 1024;

function envNumber(name: string, fallback: number): number {
	const raw = process.env[name];
	if (!raw) {
		return fallback;
	}
	const n = Number(raw);
	return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const mediaProcessingLimits: MediaProcessingLimits = {
	maxImageFileSizeBytes: envNumber('MEDIA_MAX_IMAGE_MB', 200) * MB, // por defecto 200MB para imágenes grandes/complejas
	maxVideoFileSizeBytes: envNumber('MEDIA_MAX_VIDEO_MB', 1000) * MB, // 1GB para videos
	max3DFileSizeBytes: envNumber('MEDIA_MAX_3D_MB', 500) * MB, // 500MB para archivos 3D
	maxDocumentFileSizeBytes: envNumber('MEDIA_MAX_DOC_MB', 100) * MB, // 100MB para documentos
	enableImageSizeSkip: process.env.MEDIA_ENABLE_IMAGE_SIZE_SKIP !== 'false',
};

export function shouldSkipImageBySize(sizeBytes: number): boolean {
	if (!mediaProcessingLimits.enableImageSizeSkip) {
		return false;
	}
	return sizeBytes > mediaProcessingLimits.maxImageFileSizeBytes;
}

export function shouldSkipVideoBySize(sizeBytes: number): boolean {
	return sizeBytes > mediaProcessingLimits.maxVideoFileSizeBytes;
}

export function shouldSkip3DFileBySize(sizeBytes: number): boolean {
	return sizeBytes > mediaProcessingLimits.max3DFileSizeBytes;
}

export function shouldSkipDocumentBySize(sizeBytes: number): boolean {
	return sizeBytes > mediaProcessingLimits.maxDocumentFileSizeBytes;
}

export function shouldSkipFileByTypeAndSize(filePath: string, sizeBytes: number): boolean {
	const ext = filePath.toLowerCase().split('.').pop() || '';

	// Imágenes
	if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'svg'].includes(ext)) {
		return shouldSkipImageBySize(sizeBytes);
	}

	// Videos
	if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v'].includes(ext)) {
		return shouldSkipVideoBySize(sizeBytes);
	}

	// Archivos 3D
	if (['obj', 'fbx', 'blend', 'dae', '3ds', 'max', 'ma', 'mb', 'c4d', 'stl', 'ply'].includes(ext)) {
		return shouldSkip3DFileBySize(sizeBytes);
	}

	// Documentos
	if (['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext)) {
		return shouldSkipDocumentBySize(sizeBytes);
	}

	// Por defecto, usar límite de imagen (más restrictivo)
	return shouldSkipImageBySize(sizeBytes);
}
