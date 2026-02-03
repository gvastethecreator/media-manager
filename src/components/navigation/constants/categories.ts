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
import type { CategoryItem } from '@/components/navigation/types';

/**
 * Definición de las categorías principales del panel de navegación
 * Cada categoría tiene un id, icono, etiqueta y color
 */
export const NAVIGATION_CATEGORIES: CategoryItem[] = [
	{
		id: 'folders',
		icon: FolderIcon,
		label: 'Carpetas',
		color: 'var(--entity-folder)',
	},
	{
		id: 'collections',
		icon: BookImage,
		label: 'Colecciones',
		color: 'var(--entity-collection)',
	},
	{
		id: 'albums',
		icon: Camera,
		label: 'Álbumes',
		color: 'var(--entity-album)',
	},
	{
		id: 'characters',
		icon: User2,
		label: 'Personajes',
		color: 'var(--entity-character)',
	},
	{
		id: 'places',
		icon: MapPin,
		label: 'Lugares',
		color: 'var(--entity-place)',
	},
	{
		id: 'world-items',
		icon: Box,
		label: 'Objetos',
		color: 'var(--entity-world-item)',
	},
	{
		id: 'concepts',
		icon: Lightbulb,
		label: 'Conceptos',
		color: 'var(--entity-concept)',
	},
	{
		id: 'prompts',
		icon: Terminal,
		label: 'Prompts',
		color: 'var(--entity-prompt)',
	},
	{
		id: 'notes',
		icon: StickyNote,
		label: 'Notas',
		color: 'var(--entity-note)',
	},
	{
		id: 'tags',
		icon: TagIcon,
		label: 'Etiquetas',
		color: 'var(--entity-tag)',
	},
	{
		id: 'groups',
		icon: FolderKanban,
		label: 'Grupos',
		color: 'var(--entity-group)',
	},
	{
		id: 'properties',
		icon: Database,
		label: 'Propiedades',
		color: 'var(--entity-property)',
	},
	{
		id: 'wildcards',
		icon: WandSparkles,
		label: 'Comodines',
		color: 'var(--entity-wildcard)',
	},
	{
		id: 'documents',
		icon: BookImage,
		label: 'Documentos',
		color: 'var(--entity-document)',
	},
	{
		id: 'audios',
		icon: WandSparkles,
		label: 'Audio',
		color: 'var(--entity-audio)',
	},
	{
		id: 'json-files',
		icon: Database,
		label: 'JSON',
		color: 'var(--entity-json)',
	},
	{
		id: 'file-3ds',
		icon: Box,
		label: '3D',
		color: 'var(--entity-file-3d)',
	},
];
