"use client";

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	DatabaseIcon,
	BookmarkIcon,
	CatIcon,
	TagIcon,
	AlbumIcon,
	BoxIcon,
	UserIcon,
	Grid2X2Icon,
	MapPinIcon,
	KeyIcon,
} from "lucide-react";

// Importar las secciones
import { FoldersSection } from "./settings-sections/folders-section";
import { ThumbnailsSection } from "./settings-sections/thumbnails-section";
import { CollectionsSection } from "./settings-sections/collections-section";
import { TagsSection } from "./settings-sections/tags-section";
import { ShortcutsSection } from "./settings-sections/shortcuts-section";
import { ProfilesSection } from "./settings-sections/profiles-section";
import { SystemSection } from "./settings-sections/general-section";
import { AlbumsSection } from "./settings-sections/albums-section";
import { ObjectsSection } from "./settings-sections/objects-section";
import { PlacesSection } from "./settings-sections/places-section";
import { CharactersSection } from "./settings-sections/characters-section";

export function SettingsView() {
	const [activeTab, setActiveTab] = React.useState("folders");
	return (
		<div className="p-0 m-0 h-full w-full rounded-none">
			<ScrollArea className="h-full">
				<Tabs
					value={activeTab}
					onValueChange={setActiveTab}
					className="w-full rounded-none"
					defaultValue="folders"
				>
					<TabsList className="grid w-full grid-cols-10 h-9 py-0 px-2 m-0 rounded-none">
						<TabsTrigger value="folders">
							<DatabaseIcon className="h-4 w-4 mr-2" /> Sistema
						</TabsTrigger>

						<TabsTrigger value="albums">
							<AlbumIcon className="h-4 w-4 mr-2" /> Albums
						</TabsTrigger>

						<TabsTrigger value="collections">
							<Grid2X2Icon className="h-4 w-4 mr-2" /> Colecciones
						</TabsTrigger>

						<TabsTrigger value="tags">
							<TagIcon className="h-4 w-4 mr-2" /> Etiquetas
						</TabsTrigger>

						<TabsTrigger value="characters">
							<UserIcon className="h-4 w-4 mr-2" /> Personas
						</TabsTrigger>

						<TabsTrigger value="objects">
							<BoxIcon className="h-4 w-4 mr-2" /> Objetos
						</TabsTrigger>

						<TabsTrigger value="places">
							<MapPinIcon className="h-4 w-4 mr-2" /> Lugares
						</TabsTrigger>

						<TabsTrigger value="shortcuts">
							<KeyIcon className="h-4 w-4 mr-2" /> Atajos
						</TabsTrigger>
					</TabsList>
					<TabsContent value="folders" className="gap-2 px-2">
						<div className="grid grid-cols-2 gap-2 w-full">
							<ProfilesSection />
							<FoldersSection />
							<ThumbnailsSection />
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
					<TabsContent value="shortcuts" className="px-2">
						<ShortcutsSection />
					</TabsContent>
				</Tabs>
			</ScrollArea>
		</div>
	);
}
