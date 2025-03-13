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
import { AlbumsSection } from './albums/albums-section';
import { CharactersSection } from './characters/characters-section';
import { CollectionsSection } from './collections/collections-section';
import { ConceptsSection } from './concepts/concepts-section';
import { FoldersSection } from './folders/folders-section';
import { NotesSection } from './notes/notes-section';
import { PlacesSection } from './places/places-section';
import { ProfilesSection } from './profiles/profiles-settings';
import { PromptsSection } from './prompts/prompts-section';
import { ShortcutsSection } from './shortcuts/shortcuts-section';
import { SystemSection } from './system/system-section';
import { TagsSection } from './tags/tags-section';
import { ThumbnailsSection } from './thumbnails/thumbnails-section';
import { UploadedImagesSection } from './uploaded-images/uploaded-images-section';
import { WorldItemsSection } from './world-items/world-items-section';

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
		id: 'thumbnails',
		label: 'Miniaturas',
		icon: <Grid2X2Icon className="h-4 w-4 transition-transform duration-150 group-hover:rotate-12" />,
		color: tabColors.thumbnails,
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
		id: 'entities-cards',
		label: 'Tarjetas',
		icon: <ListIcon className="h-4 w-4 transition-transform duration-150 group-hover:rotate-12" />,
		color: tabColors['entities-cards'],
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
					<TabsList className="flex w-full h-9 bg-transparent rounded-none justify-start border-b-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
					<TabsContent value="system" className="gap-0 px-1 h-full overflow-auto">
						<div className="grid grid-cols-2 gap-1 w-full">
							<ProfilesSection />
							<FoldersSection />
							<ThumbnailsSection />
							<SystemSection />
						</div>
					</TabsContent>

					<TabsContent value="albums" className="px-1 h-full overflow-auto">
						<AlbumsSection />
					</TabsContent>

					<TabsContent value="collections" className="px-1 h-full overflow-auto">
						<CollectionsSection />
					</TabsContent>

					<TabsContent value="tags" className="px-1 h-full overflow-auto">
						<TagsSection />
					</TabsContent>

					<TabsContent value="characters" className="px-1 h-full overflow-auto">
						<CharactersSection />
					</TabsContent>

					<TabsContent value="world-items" className="px-1 h-full overflow-auto">
						<WorldItemsSection />
					</TabsContent>

					<TabsContent value="places" className="px-1 h-full overflow-auto">
						<PlacesSection />
					</TabsContent>

					<TabsContent value="concepts" className="px-1 h-full overflow-auto">
						<ConceptsSection />
					</TabsContent>

					<TabsContent value="prompts" className="px-1 h-full overflow-auto">
						<PromptsSection />
					</TabsContent>

					<TabsContent value="notes" className="px-1 h-full overflow-auto">
						<NotesSection />
					</TabsContent>

					<TabsContent value="thumbnails" className="space-y-4 px-1 pt-1 h-full overflow-auto">
						<ThumbnailsSection />
					</TabsContent>

					<TabsContent value="uploaded-images" className="space-y-4 px-1 pt-1 h-full overflow-auto">
						<UploadedImagesSection />
					</TabsContent>

					<TabsContent value="shortcuts" className="space-y-4 px-1 pt-1 h-full overflow-auto">
						<ShortcutsSection />
					</TabsContent>

					<TabsContent value="entities-cards" className="space-y-4 px-1 pt-1 h-full overflow-auto">
						<EntitiesCardsSection />
					</TabsContent>

					<TabsContent value="objects" className="px-1 h-full overflow-auto">
						<div className="text-sm text-muted-foreground text-center py-4">
							Esta sección ha sido migrada a "Objetos". Por favor, utilice la nueva sección.
						</div>
					</TabsContent>
				</div>
			</Tabs>
		</div>
	);
}
