import { File, FileText, Folder, Image, Music, Video } from 'lucide-react';
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
	type: keyof typeof FILE_TYPE_ICONS;
	count: number;
	variant?: 'default' | 'outline' | 'secondary';
	size?: 'micro' | 'small' | 'normal';
}

interface FolderBadgeProps {
	count: number;
	variant?: 'default' | 'outline' | 'secondary';
	size?: 'micro' | 'small' | 'normal';
}

interface SizeBadgeProps {
	bytes: number;
	variant?: 'default' | 'outline' | 'secondary';
	size?: 'micro' | 'small' | 'normal';
}

interface TotalFilesBadgeProps {
	folderStats?: FolderStatsResponse;
	variant?: 'default' | 'outline' | 'secondary';
	size?: 'micro' | 'small' | 'normal';
}

// ===== COMPONENTES DE BADGE =====

/**
 * Badge para mostrar conteos por tipo de archivo
 */
export function FileTypeBadge({ type, count, variant = 'outline', size = 'micro' }: FileTypeBadgeProps) {
	const Icon = FILE_TYPE_ICONS[type];
	const sizeClass = COMPONENT_SIZES.badge[size];

	return (
		<Badge className={cn('flex items-center gap-1 px-1', sizeClass)} variant={variant}>
			<Icon className={COMPONENT_SIZES.icon.micro} />
			{count}
		</Badge>
	);
}

/**
 * Badge para mostrar conteo de subcarpetas
 */
export function FolderBadge({ count, variant = 'outline', size = 'micro' }: FolderBadgeProps) {
	const sizeClass = COMPONENT_SIZES.badge[size];

	return (
		<Badge className={cn('flex items-center gap-1 px-1', sizeClass)} variant={variant}>
			<Folder className={COMPONENT_SIZES.icon.micro} />
			{count}
		</Badge>
	);
}

/**
 * Badge para mostrar tamaño en bytes
 */
export function SizeBadge({ bytes, variant = 'secondary', size = 'micro' }: SizeBadgeProps) {
	const sizeClass = COMPONENT_SIZES.badge[size];

	return (
		<Badge className={cn('px-1', sizeClass)} variant={variant}>
			{formatBytes(bytes)}
		</Badge>
	);
}

/**
 * Badge que muestra el total de archivos (suma de todos los tipos)
 */
export function TotalFilesBadge({ folderStats, variant = 'outline', size = 'micro' }: TotalFilesBadgeProps) {
	const totalFiles = getTotalFilesCount(folderStats);
	const sizeClass = COMPONENT_SIZES.badge[size];

	if (totalFiles === 0) return null;

	return (
		<Badge className={cn('flex items-center gap-1 px-1', sizeClass)} variant={variant}>
			<File className={COMPONENT_SIZES.icon.micro} />
			{totalFiles} archivos
		</Badge>
	);
}
