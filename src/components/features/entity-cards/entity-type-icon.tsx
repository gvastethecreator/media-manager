'use client';

import { cn } from '@/lib/utils';
import {
	AlbumIcon,
	BookText,
	Bookmark,
	FileTextIcon,
	FolderIcon,
	HashIcon,
	LayersIcon,
	MapPinIcon,
	PaletteIcon,
	PersonStandingIcon,
	SparklesIcon,
	TagIcon,
} from 'lucide-react';
import { ReactNode } from 'react';

export interface EntityTypeIconProps {
	type: string;
	size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
	className?: string;
}

/**
 * Componente que muestra un icono según el tipo de entidad
 * Util para mostrar visualmente qué tipo de entidad es en tarjetas, listas, etc.
 */
export function EntityTypeIcon({ type, size = 'md', className }: EntityTypeIconProps) {
	// Mapeo de tipos de entidades a íconos
	const iconMap: Record<string, ReactNode> = {
		folder: <FolderIcon />,
		tag: <TagIcon />,
		collection: <Bookmark />,
		note: <FileTextIcon />,
		album: <AlbumIcon />,
		character: <PersonStandingIcon />,
		place: <MapPinIcon />,
		worldItem: <LayersIcon />,
		concept: <PaletteIcon />,
		prompt: <SparklesIcon />,
		hash: <HashIcon />,
		// Fallback para otros tipos
		default: <BookText />,
	};

	// Mapeo de tamaños a clases de Tailwind
	const sizeClasses = {
		xs: 'h-3 w-3',
		sm: 'h-4 w-4',
		md: 'h-5 w-5',
		lg: 'h-6 w-6',
		xl: 'h-8 w-8',
	};

	// Obtener el icono según el tipo, o usar el default si no existe
	const icon = iconMap[type] || iconMap.default;

	return <div className={cn('text-primary opacity-80', sizeClasses[size], className)}>{icon}</div>;
}
