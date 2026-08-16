import { File, FileText, Folder, Image, Music, Video } from 'lucide-react';
import { memo, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { FolderStatsResponse } from '@/types/folders';
import { COMPONENT_SIZES } from '../utils/common-styles';
import { formatBytes, getTotalFilesCount } from '../utils/folder-helpers';

// ===== ICONOS POR TIPO =====
const FILE_TYPE_ICONS = {
	images: Image,
	videos: Video,
	audio: Music,
	documents: FileText,
	others: File,
} as const;

// ===== TIPOS =====
interface FileTypeBadgeProps {
	count: number;
	size?: 'micro' | 'small' | 'normal';
	type: keyof typeof FILE_TYPE_ICONS;
	variant?: 'default' | 'outline' | 'secondary';
}

interface FolderBadgeProps {
	count: number;
	size?: 'micro' | 'small' | 'normal';
	variant?: 'default' | 'outline' | 'secondary';
}

interface SizeBadgeProps {
	bytes: number;
	size?: 'micro' | 'small' | 'normal';
	variant?: 'default' | 'outline' | 'secondary';
}

interface TotalFilesBadgeProps {
	folderStats?: FolderStatsResponse;
	size?: 'micro' | 'small' | 'normal';
	variant?: 'default' | 'outline' | 'secondary';
}

// ===== COMPONENTES DE BADGE MEMOIZADOS =====

/**
 * Badge para mostrar conteos por tipo de archivo
 */
export const FileTypeBadge = memo(function FileTypeBadge({
	type,
	count,
	variant = 'secondary',
	size = 'micro',
}: FileTypeBadgeProps) {
	const Icon = FILE_TYPE_ICONS[type];
	const sizeClass = COMPONENT_SIZES.badge[size];

	return (
		<Badge className={cn('flex items-center gap-1 px-2', sizeClass)} variant={variant}>
			<Icon className={COMPONENT_SIZES.icon.micro} />
			{count}
		</Badge>
	);
});

/**
 * Badge para mostrar conteo de subcarpetas
 */
export const FolderBadge = memo(function FolderBadge({
	count,
	variant = 'secondary',
	size = 'micro',
}: FolderBadgeProps) {
	const sizeClass = COMPONENT_SIZES.badge[size];

	return (
		<Badge className={cn('flex items-center gap-1 px-2', sizeClass)} variant={variant}>
			<Folder className={COMPONENT_SIZES.icon.micro} />
			{count}
		</Badge>
	);
});

/**
 * Badge para mostrar tamaño en bytes
 */
export const SizeBadge = memo(function SizeBadge({ bytes, variant = 'secondary', size = 'micro' }: SizeBadgeProps) {
	const sizeClass = COMPONENT_SIZES.badge[size];

	// Memoizar el formateo de bytes para evitar recálculos
	const formattedSize = useMemo(() => formatBytes(bytes), [bytes]);

	return (
		<Badge className={cn('px-1', sizeClass)} variant={variant}>
			{formattedSize}
		</Badge>
	);
});

/**
 * Badge que muestra el total de files (suma de todos los tipos)
 */
export const TotalFilesBadge = memo(function TotalFilesBadge({
	folderStats,
	variant = 'secondary',
	size = 'micro',
}: TotalFilesBadgeProps) {
	const sizeClass = COMPONENT_SIZES.badge[size];

	// Memoizar el cálculo del total de files
	const totalFiles = useMemo(() => getTotalFilesCount(folderStats), [folderStats]);

	if (totalFiles === 0) return null;

	return (
		<Badge className={cn('flex items-center gap-1 px-2', sizeClass)} variant={variant}>
			<File className={COMPONENT_SIZES.icon.micro} />
			{totalFiles} files
		</Badge>
	);
});
