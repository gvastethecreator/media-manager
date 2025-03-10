"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";
import * as React from "react";

import { FoldersSection } from "./folders/folders-section";
import { AlbumsSection } from "./settings-sections/albums-section";
import { AttributesSection } from "./settings-sections/attributes-section";
import { CharactersSection } from "./settings-sections/characters-section";
import { CollectionsSection } from "./settings-sections/collections-section";
import { ConceptsSection } from "./settings-sections/concepts-section";
import { NotesSection } from "./settings-sections/notes-section";
import { ObjectsSection } from "./settings-sections/objects-section";
import { PlacesSection } from "./settings-sections/places-section";
import { ProfilesSection } from "./settings-sections/profiles-section";
import { PromptsSection } from "./settings-sections/prompts-section";
import { ShortcutsSection } from "./settings-sections/shortcuts-section";
import { SystemSection } from "./settings-sections/system-section";
import { TagsSection } from "./settings-sections/tags-section";
import { ThumbnailsSection } from "./settings-sections/thumbnails-section";
import { UploadedImagesSection } from "./settings-sections/uploaded-images-section";

export function SettingsView() {
	const [activeTab, setActiveTab] = React.useState("system");
	return (
		<div className="p-0 m-0 h-full w-full rounded-none">
			<ScrollArea className="h-full">
				<Tabs
					value={activeTab}
					onValueChange={setActiveTab}
					className="w-full rounded-none"
					defaultValue="folders"
				>
					<TabsList className="grid w-full flex justify-between rounded-none">
						<TabsTrigger value="system" className="text-[9px]">
							<SettingsIcon className="h-3 w-3 mr-1" /> Sistema
						</TabsTrigger>

						<TabsTrigger value="albums" className="text-[9px]">
							<AlbumIcon className="h-3 w-3 mr-1" /> Albums
						</TabsTrigger>

						<TabsTrigger value="collections" className="text-[9px]">
							<Grid2X2Icon className="h-3 w-3 mr-1" /> Colecciones
						</TabsTrigger>

						<TabsTrigger value="tags" className="text-[9px]">
							<TagIcon className="h-3 w-3 mr-1" /> Etiquetas
						</TabsTrigger>

						<TabsTrigger value="characters" className="text-[9px]">
							<UserIcon className="h-3 w-3 mr-1" /> Personas
						</TabsTrigger>

						<TabsTrigger value="objects" className="text-[9px]">
							<BoxIcon className="h-3 w-3 mr-1" /> Objetos
						</TabsTrigger>

						<TabsTrigger value="places" className="text-[9px]">
							<MapPinIcon className="h-3 w-3 mr-1" /> Lugares
						</TabsTrigger>

						<TabsTrigger value="concepts" className="text-[9px]">
							<BookIcon className="h-3 w-3 mr-1" /> Conceptos
						</TabsTrigger>

						<TabsTrigger value="prompts" className="text-[9px]">
							<MessageSquareIcon className="h-3 w-3 mr-1" /> Prompts
						</TabsTrigger>

						<TabsTrigger value="notes" className="text-[9px]">
							<StickyNoteIcon className="h-3 w-3 mr-1" /> Notas
						</TabsTrigger>

						<TabsTrigger value="attributes" className="text-[9px]">
							<ListIcon className="h-3 w-3 mr-1" /> Atributos
						</TabsTrigger>

						<TabsTrigger value="thumbnails" className="text-[9px]">
							<Grid2X2Icon className="h-3 w-3 mr-1" /> Miniaturas
						</TabsTrigger>

						<TabsTrigger value="uploaded-images" className="text-[9px]">
							<UploadCloud className="h-3 w-3 mr-1" /> Imágenes Subidas
						</TabsTrigger>

						<TabsTrigger value="shortcuts" className="text-[9px]">
							<KeyboardIcon className="h-3 w-3 mr-1" /> Atajos
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

					<TabsContent value="objects" className="px-2">
						<ObjectsSection />
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

					<TabsContent value="attributes" className="px-2">
						<AttributesSection />
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
				</Tabs>
			</ScrollArea>
		</div>
	);
}
