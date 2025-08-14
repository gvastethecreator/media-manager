// Configuración centralizada para límites de procesamiento de medios
// Previene OOM / cuelgues durante reindex de directorios masivos
export interface MediaProcessingLimits {
	maxImageFileSizeBytes: number; // Límite duro para creación + thumbnail
	maxVideoFileSizeBytes: number; // (Reservado) posible uso futuro para thumbnails de video
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
	maxImageFileSizeBytes: envNumber('MEDIA_MAX_IMAGE_MB', 25) * MB, // por defecto 25MB
	maxVideoFileSizeBytes: envNumber('MEDIA_MAX_VIDEO_MB', 1000) * MB, // 1GB (placeholder)
	enableImageSizeSkip: process.env.MEDIA_ENABLE_IMAGE_SIZE_SKIP !== 'false',
};

export function shouldSkipImageBySize(sizeBytes: number): boolean {
	if (!mediaProcessingLimits.enableImageSizeSkip) {
		return false;
	}
	return sizeBytes > mediaProcessingLimits.maxImageFileSizeBytes;
}
