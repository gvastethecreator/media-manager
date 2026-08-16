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
	IdCard,
	Image,
	Keyboard,
	LayoutGrid,
	List,
	Tag,
	UploadCloud,
	UserCog,
	Users,
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
		label: 'System',
		icon: <Cog className="h-5 w-5" />,
		color: 'var(--entity-system)',
		items: [
			{
				id: 'general',
				label: 'General',
				icon: <Cog className="h-4 w-4" />,
				color: 'var(--entity-system)',
				description: 'General system settings',
			},
			{
				id: 'storage',
				label: 'Storage',
				icon: <HardDrive className="h-4 w-4" />,
				color: 'var(--entity-system)',
				description: 'Manage storage space and paths',
			},
			{
				id: 'database',
				label: 'Database',
				icon: <LayoutGrid className="h-4 w-4" />,
				color: 'var(--entity-system)',
				description: 'Database settings and maintenance',
			},
			{
				id: 'profiles',
				label: 'Profiles',
				icon: <UserCog className="h-4 w-4" />,
				color: 'var(--entity-profile)',
				description: 'Manage user profiles',
			},
		],
	},
	{
		id: 'interface',
		label: 'Interface',
		icon: <LayoutGrid className="h-5 w-5" />,
		color: 'var(--primary)',
		items: [
			{
				id: 'appearance',
				label: 'Appearance',
				icon: <List className="h-4 w-4" />,
				color: 'var(--primary)',
				description: 'Themes, fonts, and colors',
			},
			{
				id: 'shortcuts',
				label: 'Keyboard shortcuts',
				icon: <Keyboard className="h-4 w-4" />,
				color: 'var(--primary)',
				description: 'Customize key combinations',
			},
			{
				id: 'panels',
				label: 'Panels',
				icon: <LayoutGrid className="h-4 w-4" />,
				color: 'var(--primary)',
				description: 'Side panel layout',
			},
			{
				id: 'entities-cards',
				label: 'Cards',
				icon: <IdCard className="h-4 w-4" />,
				color: 'var(--entity-file)',
				description: 'Customize entity cards',
			},
		],
	},
	{
		id: 'files',
		label: 'Files',
		icon: <Folder className="h-5 w-5" />,
		color: 'var(--entity-folder)',
		items: [
			{
				id: 'folders',
				label: 'Folders',
				icon: <Folder className="h-4 w-4" />,
				color: 'var(--entity-folder)',
				description: 'Manage file paths',
			},
			{
				id: 'thumbnails',
				label: 'Thumbnails',
				icon: <Image className="h-4 w-4" />,
				color: 'var(--entity-image)',
				description: 'Thumbnail generation and cache',
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
				label: 'Images',
				icon: <Image className="h-4 w-4" />,
				color: 'var(--entity-image)',
				description: 'Image display settings',
			},
			{
				id: 'videos',
				label: 'Videos',
				icon: <Box className="h-4 w-4" />,
				color: 'var(--entity-video)',
				description: 'Video player and codecs',
			},
			{
				id: 'audio',
				label: 'Audio',
				icon: <AudioWaveform className="h-4 w-4" />,
				color: 'var(--entity-audio)',
				description: 'Audio player and formats',
			},
			{
				id: 'documents',
				label: 'Documents',
				icon: <FileText className="h-4 w-4" />,
				color: 'var(--entity-document)',
				description: 'View and manage documents',
			},
			{
				id: '3d-files',
				label: '3D files',
				icon: <Box className="h-4 w-4" />,
				color: 'var(--entity-file-3d)',
				description: '3D model viewer',
			},
			{
				id: 'json-files',
				label: 'JSON files',
				icon: <FileText className="h-4 w-4" />,
				color: 'var(--entity-json)',
				description: 'JSON editor and validator',
			},
			{
				id: 'uploaded-images',
				label: 'Direct uploads retired',
				icon: <UploadCloud className="h-4 w-4" />,
				color: 'var(--entity-image)',
				description: 'Use an authorized media root and reindex its folder',
			},
		],
	},
	{
		id: 'organization',
		label: 'Organization',
		icon: <AlbumIcon className="h-5 w-5" />,
		color: 'var(--entity-album)',
		items: [
			{
				id: 'albums',
				label: 'Albums',
				icon: <AlbumIcon className="h-4 w-4" />,
				color: 'var(--entity-album)',
				description: 'Image collections',
			},
			{
				id: 'collections',
				label: 'Collections',
				icon: <LayoutGrid className="h-4 w-4" />,
				color: 'var(--entity-collection)',
				description: 'Media groupings',
			},
			{
				id: 'groups',
				label: 'Groups',
				icon: <Users className="h-4 w-4" />,
				color: 'var(--entity-group)',
				description: 'Flexible group organization',
			},
		],
	},
	{
		id: 'taxonomy',
		label: 'Taxonomy',
		icon: <Tag className="h-5 w-5" />,
		color: 'var(--entity-tag)',
		items: [
			{
				id: 'tags',
				label: 'Tags',
				icon: <Tag className="h-4 w-4" />,
				color: 'var(--entity-tag)',
				description: 'Manage tags and categories',
			},
			{
				id: 'properties',
				label: 'Properties',
				icon: <Tag className="h-4 w-4" />,
				color: 'var(--entity-property)',
				description: 'Custom metadata',
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
				label: 'Characters',
				icon: <Users className="h-4 w-4" />,
				color: 'var(--entity-character)',
				description: 'Manage characters',
			},
			{
				id: 'places',
				label: 'Places',
				icon: <Globe className="h-4 w-4" />,
				color: 'var(--entity-place)',
				description: 'Locations and settings',
			},
			{
				id: 'world-items',
				label: 'Items',
				icon: <Box className="h-4 w-4" />,
				color: 'var(--entity-world-item)',
				description: 'Items and world objects',
			},
			{
				id: 'concepts',
				label: 'Concepts',
				icon: <Book className="h-4 w-4" />,
				color: 'var(--entity-concept)',
				description: 'Ideas and concepts',
			},
			{
				id: 'prompts',
				label: 'Prompts',
				icon: <FileAudio className="h-4 w-4" />,
				color: 'var(--entity-prompt)',
				description: 'Generation templates',
			},
			{
				id: 'notes',
				label: 'Notes',
				icon: <FileText className="h-4 w-4" />,
				color: 'var(--entity-note)',
				description: 'Documentation and notes',
			},
			{
				id: 'wildcards',
				label: 'Wildcards',
				icon: <Box className="h-4 w-4" />,
				color: 'var(--entity-wildcard)',
				description: 'Dynamic variables',
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
