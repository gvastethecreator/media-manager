import type { CategoryItem } from '@/components/navigation/types';
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
		id: 'folders',
		icon: FolderIcon,
		label: 'Carpetas',
		color: '#22c55e',
	},
	{
		id: 'collections',
		icon: BookImage,
		label: 'Colecciones',
		color: '#ef4444',
	},
	{
		id: 'albums',
		icon: Camera,
		label: 'Álbumes',
		color: '#8b5cf6',
	},
	{
		id: 'characters',
		icon: User2,
		label: 'Personajes',
		color: '#ec4899',
	},
	{
		id: 'places',
		icon: MapPin,
		label: 'Lugares',
		color: '#14b8a6',
	},
	{
		id: 'world-items',
		icon: Box,
		label: 'Objetos',
		color: '#f59e0b',
	},
	{
		id: 'concepts',
		icon: Lightbulb,
		label: 'Conceptos',
		color: '#3b82f6',
	},
	{
		id: 'prompts',
		icon: Terminal,
		label: 'Prompts',
		color: '#10b981',
	},
	{
		id: 'notes',
		icon: StickyNote,
		label: 'Notas',
		color: '#a855f7',
	},
	{
		id: 'tags',
		icon: TagIcon,
		label: 'Etiquetas',
		color: '#f59e0b',
	},
	{
		id: 'groups',
		icon: FolderKanban,
		label: 'Grupos',
		color: '#60a5fa',
	},
	{
		id: 'properties',
		icon: Database,
		label: 'Propiedades',
		color: '#3b82f6',
	},
	{
		id: 'wildcards',
		icon: WandSparkles,
		label: 'Comodines',
		color: '#a855f7',
	},
	{
		id: 'documents',
		icon: BookImage,
		label: 'Documentos',
		color: '#fbbf24',
	},
	{
		id: 'audios',
		icon: WandSparkles,
		label: 'Audio',
		color: '#38bdf8',
	},
	{
		id: 'json-files',
		icon: Database,
		label: 'JSON',
		color: '#f472b6',
	},
	{
		id: 'workflows',
		icon: Lightbulb,
		label: 'Workflows',
		color: '#a3e635',
	},
	{
		id: 'file-3d',
		icon: Box,
		label: '3D',
		color: '#818cf8',
	},
];
