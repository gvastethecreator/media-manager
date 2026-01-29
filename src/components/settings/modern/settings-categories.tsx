/**
 * @file Categorías de Settings Moderno
 * @module components/settings/modern/settings-categories
 * @description Definición de categorías y items de navegación para Settings
 */

import {
	AlbumIcon,
	AudioWaveform,
	Book,
	Box,
	Cog,
	FileAudio,
	FileText,
	Folder,
	Globe,
	HardDrive,
	Image,
	Keyboard,
	LayoutGrid,
	List,
	Tag,
	Users,
	Eye,
	Server,
	Zap,
} from 'lucide-react';
import type { SettingsCategory, SettingsNavItem } from '../modern/modern-settings-layout';

/**
 * Categorías organizadas de Settings
 * - Categorías principales (8)
 * - Items por categoría (29 total)
 */
export const SETTINGS_CATEGORIES: SettingsCategory[] = [
	{
		id: 'system',
		label: 'Sistema',
		icon: <Cog className="h-5 w-5" />,
		color: 'var(--entity-system)',
		items: [
			{
				id: 'general',
				label: 'General',
				icon: <Cog className="h-4 w-4" />,
				color: 'var(--entity-system)',
				description: 'Configuración general del sistema',
			},
			{
				id: 'storage',
				label: 'Almacenamiento',
				icon: <HardDrive className="h-4 w-4" />,
				color: 'var(--entity-system)',
				description: 'Gestión de espacio y rutas',
			},
			{
				id: 'database',
				label: 'Base de Datos',
				icon: <LayoutGrid className="h-4 w-4" />,
				color: 'var(--entity-system)',
				description: 'Configuración y mantenimiento de BD',
			},
		],
	},
	{
		id: 'interface',
		label: 'Interfaz',
		icon: <LayoutGrid className="h-5 w-5" />,
		color: 'var(--primary)',
		items: [
			{
				id: 'appearance',
				label: 'Apariencia',
				icon: <List className="h-4 w-4" />,
				color: 'var(--primary)',
				description: 'Temas, fuentes y colores',
			},
			{
				id: 'shortcuts',
				label: 'Atajos de Teclado',
				icon: <Keyboard className="h-4 w-4" />,
				color: 'var(--primary)',
				description: 'Personalizar combinaciones de teclas',
			},
			{
				id: 'panels',
				label: 'Paneles',
				icon: <LayoutGrid className="h-4 w-4" />,
				color: 'var(--primary)',
				description: 'Layout de paneles laterales',
			},
		],
	},
	{
		id: 'files',
		label: 'Archivos',
		icon: <Folder className="h-5 w-5" />,
		color: 'var(--entity-folder)',
		items: [
			{
				id: 'folders',
				label: 'Carpetas',
				icon: <Folder className="h-4 w-4" />,
				color: 'var(--entity-folder)',
				description: 'Gestión de rutas de archivos',
			},
			{
				id: 'thumbnails',
				label: 'Miniaturas',
				icon: <Image className="h-4 w-4" />,
				color: 'var(--entity-image)',
				description: 'Generación y caché de thumbnails',
			},
		],
	},
	{
		id: 'media',
		label: 'Media',
		icon: <Image className="h-5 w-5" />,
		color: 'var(--entity-image)',
		items: [
			{
				id: 'images',
				label: 'Imágenes',
				icon: <Image className="h-4 w-4" />,
				color: 'var(--entity-image)',
				description: 'Configuración de visualización de imágenes',
			},
			{
				id: 'videos',
				label: 'Videos',
				icon: <Box className="h-4 w-4" />,
				color: 'var(--entity-video)',
				description: 'Reproductor y codecs de video',
			},
			{
				id: 'audio',
				label: 'Audio',
				icon: <AudioWaveform className="h-4 w-4" />,
				color: 'var(--entity-audio)',
				description: 'Player y formatos de audio',
			},
			{
				id: 'documents',
				label: 'Documentos',
				icon: <FileText className="h-4 w-4" />,
				color: 'var(--entity-document)',
				description: 'Visor y gestión de documentos',
			},
			{
				id: '3d-files',
				label: 'Archivos 3D',
				icon: <Box className="h-4 w-4" />,
				color: 'var(--entity-file-3d)',
				description: 'Visor de modelos 3D',
			},
			{
				id: 'json-files',
				label: 'Archivos JSON',
				icon: <FileText className="h-4 w-4" />,
				color: 'var(--entity-json)',
				description: 'Editor y validador de JSON',
			},
		],
	},
	{
		id: 'organization',
		label: 'Organización',
		icon: <AlbumIcon className="h-5 w-5" />,
		color: 'var(--entity-album)',
		items: [
			{
				id: 'albums',
				label: 'Albums',
				icon: <AlbumIcon className="h-4 w-4" />,
				color: 'var(--entity-album)',
				description: 'Colecciones de imágenes',
			},
			{
				id: 'collections',
				label: 'Colecciones',
				icon: <LayoutGrid className="h-4 w-4" />,
				color: 'var(--entity-collection)',
				description: 'Agrupaciones de media',
			},
			{
				id: 'groups',
				label: 'Grupos',
				icon: <Users className="h-4 w-4" />,
				color: 'var(--entity-group)',
				description: 'Organización flexible por grupos',
			},
		],
	},
	{
		id: 'taxonomy',
		label: 'Taxonomía',
		icon: <Tag className="h-5 w-5" />,
		color: 'var(--entity-tag)',
		items: [
			{
				id: 'tags',
				label: 'Etiquetas',
				icon: <Tag className="h-4 w-4" />,
				color: 'var(--entity-tag)',
				description: 'Gestión de tags y categorías',
			},
			{
				id: 'properties',
				label: 'Propiedades',
				icon: <Tag className="h-4 w-4" />,
				color: 'var(--entity-property)',
				description: 'Metadatos personalizados',
			},
		],
	},
	{
		id: 'worldbuilding',
		label: 'Worldbuilding',
		icon: <Globe className="h-5 w-5" />,
		color: 'var(--entity-world-item)',
		items: [
			{
				id: 'characters',
				label: 'Personajes',
				icon: <Users className="h-4 w-4" />,
				color: 'var(--entity-character)',
				description: 'Gestión de personajes',
			},
			{
				id: 'places',
				label: 'Lugares',
				icon: <Globe className="h-4 w-4" />,
				color: 'var(--entity-place)',
				description: 'Ubicaciones y escenarios',
			},
			{
				id: 'world-items',
				label: 'Objetos',
				icon: <Box className="h-4 w-4" />,
				color: 'var(--entity-world-item)',
				description: 'Items y objetos del mundo',
			},
			{
				id: 'concepts',
				label: 'Conceptos',
				icon: <Book className="h-4 w-4" />,
				color: 'var(--entity-concept)',
				description: 'Ideas y conceptos',
			},
			{
				id: 'prompts',
				label: 'Prompts',
				icon: <FileAudio className="h-4 w-4" />,
				color: 'var(--entity-prompt)',
				description: 'Plantillas de generación',
			},
			{
				id: 'notes',
				label: 'Notas',
				icon: <FileText className="h-4 w-4" />,
				color: 'var(--entity-note)',
				description: 'Documentación y notas',
			},
			{
				id: 'wildcards',
				label: 'Comodines',
				icon: <Box className="h-4 w-4" />,
				color: 'var(--entity-wildcard)',
				description: 'Variables dinámicas',
			},
		],
	},
];

/**
 * Helper para encontrar categoría por ID
 */
export function findCategoryById(categoryId: string): SettingsCategory | undefined {
	return SETTINGS_CATEGORIES.find((cat) => cat.id === categoryId);
}

/**
 * Helper para encontrar item por ID (búsqueda en todas las categorías)
 */
export function findItemById(itemId: string): { category: SettingsCategory; item: SettingsNavItem } | undefined {
	for (const category of SETTINGS_CATEGORIES) {
		const item = category.items.find((i) => i.id === itemId);
		if (item) {
			return { category, item };
		}
	}
	return undefined;
}
