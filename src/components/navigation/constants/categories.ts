import type { CategoryItem } from '@/components/navigation/types';
import type { ViewType } from '@/components/views/types';
import {
    BookImage,
    Box,
    Camera,
    Database,
    FolderIcon,
    FolderKanban,
    Lightbulb,
    MapPin,
    StickyNote,
    TagIcon,
    Terminal,
    User2,
    WandSparkles,
} from 'lucide-react';

/**
 * Definición de las categorías principales del panel de navegación
 * Cada categoría tiene un id, icono, etiqueta y color
 */
export const NAVIGATION_CATEGORIES: CategoryItem[] = [
	{
		id: 'folders' as ViewType,
		icon: FolderIcon,
		label: 'Carpetas',
		color: '#22c55e',
	},
	{
		id: 'collections' as ViewType,
		icon: BookImage,
		label: 'Colecciones',
		color: '#ef4444',
	},
	{
		id: 'albums' as ViewType,
		icon: Camera,
		label: 'Álbumes',
		color: '#8b5cf6',
	},
	{
		id: 'characters' as ViewType,
		icon: User2,
		label: 'Personajes',
		color: '#ec4899',
	},
	{
		id: 'places' as ViewType,
		icon: MapPin,
		label: 'Lugares',
		color: '#14b8a6',
	},
	{
		id: 'world-items' as ViewType,
		icon: Box,
		label: 'Objetos',
		color: '#f59e0b',
	},
	{
		id: 'concepts' as ViewType,
		icon: Lightbulb,
		label: 'Conceptos',
		color: '#3b82f6',
	},
	{
		id: 'prompts' as ViewType,
		icon: Terminal,
		label: 'Prompts',
		color: '#10b981',
	},
	{
		id: 'notes' as ViewType,
		icon: StickyNote,
		label: 'Notas',
		color: '#a855f7',
	},
	{
		id: 'tags' as ViewType,
		icon: TagIcon,
		label: 'Etiquetas',
		color: '#f59e0b',
	},
	{
		id: 'groups' as ViewType,
		icon: FolderKanban,
		label: 'Grupos',
		color: '#60a5fa',
	},
	{
		id: 'properties' as ViewType,
		icon: Database,
		label: 'Propiedades',
		color: '#3b82f6',
	},
	{
		id: 'wildcards' as ViewType,
		icon: WandSparkles,
		label: 'Comodines',
		color: '#a855f7',
	},
	{
		id: 'document' as ViewType,
		icon: BookImage,
		label: 'Documentos',
		color: '#fbbf24',
	},
	{
		id: 'audio' as ViewType,
		icon: WandSparkles,
		label: 'Audio',
		color: '#38bdf8',
	},
	{
		id: 'json-file' as ViewType,
		icon: Database,
		label: 'JSON',
		color: '#f472b6',
	},
	{
		id: 'workflow' as ViewType,
		icon: Lightbulb,
		label: 'Workflows',
		color: '#a3e635',
	},
	{
		id: 'file3d' as ViewType,
		icon: Box,
		label: '3D',
		color: '#818cf8',
	},
];
