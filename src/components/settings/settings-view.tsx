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

import { EntitiesCardsSection } from '../features/entity-cards/settings/entities-cards-section';
import { AlbumsSection } from './albums/albums-section';
import { CharactersSection } from './characters/characters-section';
import { CollectionsSection } from './collections/collections-section';
import { ConceptsSection } from './concepts/concepts-section';
import { FoldersSection } from './folders/folders-section';
import { NotesSection } from './notes/notes-section';
import { PlacesSection } from './places/places-section';
import { ProfilesSection } from './profiles/profiles-section';
import { PromptsSection } from './prompts/prompts-section';
import { ShortcutsSection } from './shortcuts/shortcuts-section';
import { SystemSection } from './system/system-section';
import { TagsSection } from './tags/tags-section';
import { ThumbnailsSection } from './thumbnails/thumbnails-section';
import { UploadedImagesSection } from './uploaded-images/uploaded-images-section';
import { WorldItemsSection } from './world-items/world-items-section';

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

export function SettingsView() {
	const [activeTab, setActiveTab] = React.useState('system');

	return (
		<div className="p-0 m-0 h-full w-full rounded-none">
			<ScrollArea className="h-full">
				<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full rounded-none" defaultValue="folders">
					<TabsList className="grid grid-cols-14 w-full rounded-none p-0 bg-background justify-start border-b border-border">
						<TabsTrigger
							value="system"
							className="flex items-center gap-1 px-0 h-9 text-[10px] data-[state=active]:font-medium
							border-b-2 cursor-pointer rounded-none
							hover:bg-secondary/20 data-[state=active]:bg-secondary/30 transition-all duration-150"
						>
							<SettingsIcon
								className="h-3 w-3 transition-transform duration-150 group-hover:rotate-12"
								style={{ color: tabColors.system }}
							/>
							Sistema
						</TabsTrigger>

						<TabsTrigger
							value="albums"
							className="flex items-center gap-1 px-0 h-9 text-[10px] data-[state=active]:font-medium border-b-2 cursor-pointer rounded-none
							hover:bg-secondary/20 data-[state=active]:bg-secondary/30 transition-all duration-150
							hover:scale-105 active:scale-95 data-[state=active]:scale-100"
						>
							<AlbumIcon
								className="h-3 w-3 transition-transform duration-150 group-hover:rotate-12"
								style={{ color: tabColors.albums }}
							/>
							Albums
						</TabsTrigger>

						<TabsTrigger
							value="collections"
							className="flex items-center gap-1 px-0 h-9 text-[10px] data-[state=active]:font-medium border-b-2 cursor-pointer rounded-none
							hover:bg-secondary/20 data-[state=active]:bg-secondary/30 transition-all duration-150
							hover:scale-105 active:scale-95 data-[state=active]:scale-100"
						>
							<Grid2X2Icon
								className="h-3 w-3 transition-transform duration-150 group-hover:rotate-12"
								style={{ color: tabColors.collections }}
							/>
							Colecciones
						</TabsTrigger>

						<TabsTrigger
							value="tags"
							className="flex items-center gap-1 px-0 h-9 text-[10px] data-[state=active]:font-medium border-b-2 cursor-pointer rounded-none
							hover:bg-secondary/20 data-[state=active]:bg-secondary/30 transition-all duration-150
							hover:scale-105 active:scale-95 data-[state=active]:scale-100"
						>
							<TagIcon
								className="h-3 w-3 transition-transform duration-150 group-hover:rotate-12"
								style={{ color: tabColors.tags }}
							/>
							Etiquetas
						</TabsTrigger>

						<TabsTrigger
							value="characters"
							className="flex items-center gap-1 px-0 h-9 text-[10px] data-[state=active]:font-medium border-b-2 cursor-pointer rounded-none
							hover:bg-secondary/20 data-[state=active]:bg-secondary/30 transition-all duration-150
							hover:scale-105 active:scale-95 data-[state=active]:scale-100"
						>
							<UserIcon
								className="h-3 w-3 transition-transform duration-150 group-hover:rotate-12"
								style={{ color: tabColors.characters }}
							/>
							Personas
						</TabsTrigger>

						<TabsTrigger
							value="world-items"
							className="flex items-center gap-1 px-0 h-9 text-[10px] data-[state=active]:font-medium border-b-2 cursor-pointer rounded-none
							hover:bg-secondary/20 data-[state=active]:bg-secondary/30 transition-all duration-150
							hover:scale-105 active:scale-95 data-[state=active]:scale-100"
						>
							<BoxIcon
								className="h-3 w-3 transition-transform duration-150 group-hover:rotate-12"
								style={{ color: tabColors['world-items'] }}
							/>
							Objetos
						</TabsTrigger>

						<TabsTrigger
							value="places"
							className="flex items-center gap-1 px-0 h-9 text-[10px] data-[state=active]:font-medium border-b-2 cursor-pointer rounded-none
							hover:bg-secondary/20 data-[state=active]:bg-secondary/30 transition-all duration-150
							hover:scale-105 active:scale-95 data-[state=active]:scale-100"
						>
							<MapPinIcon
								className="h-3 w-3 transition-transform duration-150 group-hover:rotate-12"
								style={{ color: tabColors.places }}
							/>
							Lugares
						</TabsTrigger>

						<TabsTrigger
							value="concepts"
							className="flex items-center gap-1 px-0 h-9 text-[10px] data-[state=active]:font-medium border-b-2 cursor-pointer rounded-none
							hover:bg-secondary/20 data-[state=active]:bg-secondary/30 transition-all duration-150
							hover:scale-105 active:scale-95 data-[state=active]:scale-100"
						>
							<BookIcon
								className="h-3 w-3 transition-transform duration-150 group-hover:rotate-12"
								style={{ color: tabColors.concepts }}
							/>
							Conceptos
						</TabsTrigger>

						<TabsTrigger
							value="prompts"
							className="flex items-center gap-1 px-0 h-9 text-[10px] data-[state=active]:font-medium border-b-2 cursor-pointer rounded-none
							hover:bg-secondary/20 data-[state=active]:bg-secondary/30 transition-all duration-150
							hover:scale-105 active:scale-95 data-[state=active]:scale-100"
						>
							<MessageSquareIcon
								className="h-3 w-3 transition-transform duration-150 group-hover:rotate-12"
								style={{ color: tabColors.prompts }}
							/>
							Prompts
						</TabsTrigger>

						<TabsTrigger
							value="notes"
							className="flex items-center gap-1 px-0 h-9 text-[10px] data-[state=active]:font-medium border-b-2 cursor-pointer rounded-none
							hover:bg-secondary/20 data-[state=active]:bg-secondary/30 transition-all duration-150
							hover:scale-105 active:scale-95 data-[state=active]:scale-100"
						>
							<StickyNoteIcon
								className="h-3 w-3 transition-transform duration-150 group-hover:rotate-12"
								style={{ color: tabColors.notes }}
							/>
							Notas
						</TabsTrigger>

						<TabsTrigger
							value="thumbnails"
							className="flex items-center gap-1 px-0 h-9 text-[10px] data-[state=active]:font-medium border-b-2 cursor-pointer rounded-none
							hover:bg-secondary/20 data-[state=active]:bg-secondary/30 transition-all duration-150
							hover:scale-105 active:scale-95 data-[state=active]:scale-100"
						>
							<Grid2X2Icon
								className="h-3 w-3 transition-transform duration-150 group-hover:rotate-12"
								style={{ color: tabColors.thumbnails }}
							/>
							Miniaturas
						</TabsTrigger>

						<TabsTrigger
							value="uploaded-images"
							className="flex items-center gap-1 px-0 h-9 text-[10px] data-[state=active]:font-medium border-b-2 cursor-pointer rounded-none
							hover:bg-secondary/20 data-[state=active]:bg-secondary/30 transition-all duration-150
							hover:scale-105 active:scale-95 data-[state=active]:scale-100"
						>
							<UploadCloud
								className="h-3 w-3 transition-transform duration-150 group-hover:rotate-12"
								style={{ color: tabColors['uploaded-images'] }}
							/>
							Imágenes Subidas
						</TabsTrigger>

						<TabsTrigger
							value="shortcuts"
							className="flex items-center gap-1 px-0 h-9 text-[10px] data-[state=active]:font-medium border-b-2 cursor-pointer rounded-none
							hover:bg-secondary/20 data-[state=active]:bg-secondary/30 transition-all duration-150
							hover:scale-105 active:scale-95 data-[state=active]:scale-100"
						>
							<KeyboardIcon
								className="h-3 w-3 transition-transform duration-150 group-hover:rotate-12"
								style={{ color: tabColors.shortcuts }}
							/>
							Atajos
						</TabsTrigger>

						<TabsTrigger
							value="entities-cards"
							className="flex items-center gap-1 px-0 h-9 text-[10px] data-[state=active]:font-medium border-b-2 cursor-pointer rounded-none
							hover:bg-secondary/20 data-[state=active]:bg-secondary/30 transition-all duration-150
							hover:scale-105 active:scale-95 data-[state=active]:scale-100"
						>
							<ListIcon
								className="h-3 w-3 transition-transform duration-150 group-hover:rotate-12"
								style={{ color: tabColors['entities-cards'] }}
							/>
							Tarjetas
						</TabsTrigger>
					</TabsList>

					<TabsContent value="system" className="gap-2 px-2">
						<div className="grid grid-cols-2 gap-2 w-full">
							<ProfilesSection />
							<FoldersSection />
							<ThumbnailsSection />
							<SystemSection />
						</div>
					</TabsContent>

					<TabsContent value="albums" className="px-2">
						<AlbumsSection />
					</TabsContent>

					<TabsContent value="collections" className="px-2">
						<CollectionsSection />
					</TabsContent>

					<TabsContent value="tags" className="px-2">
						<TagsSection />
					</TabsContent>

					<TabsContent value="characters" className="px-2">
						<CharactersSection />
					</TabsContent>

					<TabsContent value="world-items" className="px-2">
						<WorldItemsSection />
					</TabsContent>

					<TabsContent value="places" className="px-2">
						<PlacesSection />
					</TabsContent>

					<TabsContent value="concepts" className="px-2">
						<ConceptsSection />
					</TabsContent>

					<TabsContent value="prompts" className="px-2">
						<PromptsSection />
					</TabsContent>

					<TabsContent value="notes" className="px-2">
						<NotesSection />
					</TabsContent>

					<TabsContent value="thumbnails" className="space-y-4 px-1 pt-1">
						<ThumbnailsSection />
					</TabsContent>

					<TabsContent value="uploaded-images" className="space-y-4 px-1 pt-1">
						<UploadedImagesSection />
					</TabsContent>

					<TabsContent value="shortcuts" className="space-y-4 px-1 pt-1">
						<ShortcutsSection />
					</TabsContent>

					<TabsContent value="entities-cards" className="space-y-4 px-1 pt-1">
						<EntitiesCardsSection />
					</TabsContent>

					<TabsContent value="objects" className="px-2">
						<div className="text-sm text-muted-foreground text-center py-4">
							Esta sección ha sido migrada a "Objetos". Por favor, utilice la nueva sección.
						</div>
					</TabsContent>
				</Tabs>
			</ScrollArea>
		</div>
	);
}
