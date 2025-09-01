import { formatBytes } from '@/lib/utils/format.utils';

/**
 * 🔧 UTILIDADES ESPECÍFICAS PARA COMPONENTES DE CARPETAS
 * Funciones helpers reutilizables
 */

// ===== FORMATEO DE DATOS =====

/**
 * Formatea una fecha relativa (ej: "Hace 2 días")
 */
export function formatRelativeDate(date: Date): string {
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	if (diffDays === 0) return 'Hoy';
	if (diffDays === 1) return 'Ayer';
	if (diffDays < 7) return `Hace ${diffDays} días`;

	return date.toLocaleDateString();
}

/**
 * Calcula el total de archivos de todos los tipos
 */
export function getTotalFilesCount(stats?: {
	totalImages?: number;
	totalVideos?: number;
	totalAudio?: number;
	totalDocuments?: number;
	totalOthers?: number;
}): number {
	if (!stats) return 0;

	return (
		(stats.totalImages ?? 0) +
		(stats.totalVideos ?? 0) +
		(stats.totalAudio ?? 0) +
		(stats.totalDocuments ?? 0) +
		(stats.totalOthers ?? 0)
	);
}

/**
 * Normaliza URL de thumbnail (maneja base64 sin prefijo)
 */
export function normalizeThumbailUrl(rawThumb?: string): string | null {
	if (!rawThumb) return null;

	if (rawThumb.startsWith('data:') || rawThumb.startsWith('http') || rawThumb.startsWith('/')) {
		return rawThumb;
	}

	return `data:image/webp;base64,${rawThumb}`;
}

/**
 * Obtiene estadísticas de tipos de archivo como array para badges
 */
export function getFileTypeStats(folderStats?: {
	totalImages?: number;
	totalVideos?: number;
	totalAudio?: number;
	totalDocuments?: number;
	totalOthers?: number;
}) {
	if (!folderStats) return [];

	const stats = [
		{
			count: folderStats.totalImages ?? 0,
			label: 'imágenes',
			key: 'images' as const,
		},
		{
			count: folderStats.totalVideos ?? 0,
			label: 'videos',
			key: 'videos' as const,
		},
		{
			count: folderStats.totalAudio ?? 0,
			label: 'audio',
			key: 'audio' as const,
		},
		{
			count: folderStats.totalDocuments ?? 0,
			label: 'documentos',
			key: 'documents' as const,
		},
		{
			count: folderStats.totalOthers ?? 0,
			label: 'otros',
			key: 'others' as const,
		},
	];

	return stats.filter((stat) => stat.count > 0);
}

// ===== VALIDACIONES =====

/**
 * Verifica si una carpeta tiene archivos
 */
export function hasFiles(folderStats?: { totalFiles?: number }): boolean {
	return (folderStats?.totalFiles ?? 0) > 0;
}

/**
 * Verifica si una carpeta tiene subcarpetas
 */
export function hasSubfolders(folder: { children?: any[] }): boolean {
	return Boolean(folder.children?.length);
}

// ===== CÁLCULOS DE PROGRESO =====

/**
 * Calcula el progreso de una etapa específica basado en el progreso total
 */
export function calculateStageProgress(stageNumber: number, totalProgress: number, totalStages = 3): number {
	const baseProgress = ((stageNumber - 1) / totalStages) * 100;
	const nextProgress = (stageNumber / totalStages) * 100;

	if (totalProgress < baseProgress) return 0;
	if (totalProgress >= nextProgress) return 100;

	return ((totalProgress - baseProgress) / (nextProgress - baseProgress)) * 100;
}

// ===== RE-EXPORTACIONES ÚTILES =====
export { formatBytes };
