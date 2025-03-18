'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
	AlbumIcon,
	BlocksIcon,
	BookIcon,
	BoxIcon,
	Grid2X2Icon,
	KeyboardIcon,
	ListIcon,
	MapPinIcon,
	MessageSquareIcon,
	SettingsIcon,
	StickyNoteIcon,
	TagIcon,
	UploadCloud,
	UserIcon,
} from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';
import { EntitiesCardsSection } from '../features/entity-cards/settings/entities-cards-settings';
import { AlbumsSettings } from './albums/albums-settings';
import { CharactersSettings } from './characters/characters-settings';
import { CollectionsSettings } from './collections/collections-settings';
import { ConceptsSettings } from './concepts/concepts-settings';
import { FoldersSettings } from './folders/folders-settings';
import { NotesSettings } from './notes/notes-settings';
import { PlacesSettings } from './places/places-settings';
import { ProfilesSettings } from './profiles/profiles-settings';
import { PromptsSettings } from './prompts/prompts-settings';
import { ShortcutsSettings } from './shortcuts/shortcuts-settings';
import { SystemSettings } from './system/system-settings';
import { TagsSettings } from './tags/tags-settings';
import { ThumbnailsSettings } from './thumbnails/thumbnails-settings';
import { UploadedImagesSettings } from './uploaded-images/uploaded-images-settings';
import { WorldItemsSettings } from './world-items/world-items-settings';

// Definición de tipos para estructurar los tabs
interface TabItem {
	id: string;
	label: string;
	icon: React.ReactNode;
	color: string;
}

// Colores para cada tab
const tabColors = {
	system: '#64748b', // Slate
	albums: '#8b5cf6', // Violet
	collections: '#ef4444', // Red
	tags: '#f59e0b', // Amber
	characters: '#ec4899', // Pink
	'world-items': '#f59e0b', // Amber
	places: '#14b8a6', // Teal
	concepts: '#3b82f6', // Blue
	prompts: '#10b981', // Emerald
	notes: '#a855f7', // Purple
	thumbnails: '#0ea5e9', // Sky
	'uploaded-images': '#22c55e', // Green
	shortcuts: '#475569', // Slate
	'entities-cards': '#6366f1', // Indigo
	profiles: '#6366f1', // Indigo
};

// Definición de todos los tabs para evitar la duplicación de código
const tabsData: TabItem[] = [
	{
		id: 'system',
		label: 'Sistema',
		icon: <SettingsIcon className="h-4 w-4 transition-transform duration-150 group-hover:rotate-12" />,
		color: tabColors.system,
	},
	{
		id: 'entities-cards',
		label: 'Tarjetas',
		icon: <ListIcon className="h-4 w-4 transition-transform duration-150 group-hover:rotate-12" />,
		color: tabColors['entities-cards'],
	},
	{
		id: 'albums',
		label: 'Albums',
		icon: <AlbumIcon className="h-4 w-4 transition-transform duration-150 group-hover:rotate-12" />,
		color: tabColors.albums,
	},
	{
		id: 'collections',
		label: 'Colecciones',
		icon: <Grid2X2Icon className="h-4 w-4 transition-transform duration-150 group-hover:rotate-12" />,
		color: tabColors.collections,
	},
	{
		id: 'tags',
		label: 'Etiquetas',
		icon: <TagIcon className="h-4 w-4 transition-transform duration-150 group-hover:rotate-12" />,
		color: tabColors.tags,
	},
	{
		id: 'characters',
		label: 'Personas',
		icon: <UserIcon className="h-4 w-4 transition-transform duration-150 group-hover:rotate-12" />,
		color: tabColors.characters,
	},
	{
		id: 'world-items',
		label: 'Objetos',
		icon: <BoxIcon className="h-4 w-4 transition-transform duration-150 group-hover:rotate-12" />,
		color: tabColors['world-items'],
	},
	{
		id: 'places',
		label: 'Lugares',
		icon: <MapPinIcon className="h-4 w-4 transition-transform duration-150 group-hover:rotate-12" />,
		color: tabColors.places,
	},
	{
		id: 'concepts',
		label: 'Conceptos',
		icon: <BookIcon className="h-4 w-4 transition-transform duration-150 group-hover:rotate-12" />,
		color: tabColors.concepts,
	},
	{
		id: 'prompts',
		label: 'Prompts',
		icon: <MessageSquareIcon className="h-4 w-4 transition-transform duration-150 group-hover:rotate-12" />,
		color: tabColors.prompts,
	},
	{
		id: 'notes',
		label: 'Notas',
		icon: <StickyNoteIcon className="h-4 w-4 transition-transform duration-150 group-hover:rotate-12" />,
		color: tabColors.notes,
	},
	{
		id: 'uploaded-images',
		label: 'Imágenes Subidas',
		icon: <UploadCloud className="h-4 w-4 transition-transform duration-150 group-hover:rotate-12" />,
		color: tabColors['uploaded-images'],
	},
	{
		id: 'shortcuts',
		label: 'Atajos',
		icon: <KeyboardIcon className="h-4 w-4 transition-transform duration-150 group-hover:rotate-12" />,
		color: tabColors.shortcuts,
	},
	{
		id: 'profiles',
		label: 'Perfiles',
		icon: <UserIcon className="h-4 w-4 transition-transform duration-150 group-hover:scale-105" />,
		color: tabColors.profiles,
	},
];

export function SettingsView() {
	const [activeTab, setActiveTab] = React.useState('system');

	// Estilos base comunes para todos los tabs
	const tabBaseStyles = cn(
		'flex items-center justify-center gap-2 px-3 h-9',
		'text-[9px] border-b-2 border-transparent',
		'cursor-pointer rounded-none group',
		'hover:bg-secondary/20 data-[state=active]:bg-secondary/30',
		'data-[state=active]:border-white/10 data-[state=active]:text-primary',
		'transition-all duration-150 hover:scale-105 active:scale-95 data-[state=active]:scale-100'
	);

	return (
		<div className="p-0 m-0 h-full w-full rounded-none flex flex-col">
			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full rounded-none flex flex-col flex-1">
				{/* TabsList con posición sticky */}
				<div className="sticky top-0 z-7 backdrop-blur-sm shadow-sm">
					<TabsList className="flex w-full h-8 bg-transparent rounded-none justify-start border-b-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
						{tabsData.map((tab) => (
							<TabsTrigger key={tab.id} value={tab.id} className={tabBaseStyles}>
								<span style={{ color: tab.color }} className="flex items-center justify-center">
									{tab.icon}
								</span>
								{tab.label}
							</TabsTrigger>
						))}
					</TabsList>
				</div>

				{/* Contenido de los tabs */}
				<div className="flex-1 overflow-hidden">
					<TabsContent value="entities-cards" className="px-1 h-full overflow-auto">
						<EntitiesCardsSection />
					</TabsContent>

					<TabsContent value="system" className="gap-0 px-1 h-full overflow-auto">
						<div className="grid grid-cols-2 gap-1 w-full">
							<FoldersSettings />
							<ThumbnailsSettings />
							<SystemSettings />
						</div>
					</TabsContent>

					<TabsContent value="albums" className="px-1 h-full overflow-auto">
						<AlbumsSettings />
					</TabsContent>

					<TabsContent value="collections" className="px-1 h-full overflow-auto">
						<CollectionsSettings />
					</TabsContent>

					<TabsContent value="tags" className="px-1 h-full overflow-auto">
						<TagsSettings />
					</TabsContent>

					<TabsContent value="characters" className="px-1 h-full overflow-auto">
						<CharactersSettings />
					</TabsContent>

					<TabsContent value="world-items" className="px-1 h-full overflow-auto">
						<WorldItemsSettings />
					</TabsContent>

					<TabsContent value="places" className="px-1 h-full overflow-auto">
						<PlacesSettings />
					</TabsContent>

					<TabsContent value="concepts" className="px-1 h-full overflow-auto">
						<ConceptsSettings />
					</TabsContent>

					<TabsContent value="prompts" className="px-1 h-full overflow-auto">
						<PromptsSettings />
					</TabsContent>

					<TabsContent value="notes" className="px-1 h-full overflow-auto">
						<NotesSettings />
					</TabsContent>

					<TabsContent value="uploaded-images" className="px-1 h-full overflow-auto">
						<UploadedImagesSettings />
					</TabsContent>

					<TabsContent value="shortcuts" className="px-1 h-full overflow-auto">
						<ShortcutsSettings />
					</TabsContent>

					<TabsContent value="profiles" className="px-1 h-full overflow-auto">
						<ProfilesSettings />
					</TabsContent>
				</div>
			</Tabs>
		</div>
	);
}
