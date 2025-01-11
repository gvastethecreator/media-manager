"use client";

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import {
	DatabaseIcon,
	BookmarkIcon,
	CatIcon,
	Album,
	Box,
	MapPin,
} from "lucide-react";

// Importar las secciones
import { FoldersSection } from "./settings-sections/folders-section";
import { ThumbnailsSection } from "./settings-sections/thumbnails-section";
import { CollectionsSection } from "./settings-sections/collections-section";
import { TagsSection } from "./settings-sections/tags-section";
import { ShortcutsSection } from "./settings-sections/shortcuts-section";
import { ProfilesSection } from "./settings-sections/profiles-section";
import { SystemSection } from "./settings-sections/system-section";
import { AlbumsSection } from "./settings-sections/albums-section";
import { ObjectsSection } from "./settings-sections/objects-section";
import { PlacesSection } from "./settings-sections/places-section";
import { CharactersSection } from "./settings-sections/characters-section";

export function SettingsView() {
	return (
		<div className="p-0 m-0 h-full w-full rounded-none">
			<ScrollArea className="h-full">
				<div className="grid grid-cols-2 gap-2 w-full p-2">
					<FoldersSection />
					<ThumbnailsSection />
					<CollectionsSection />
					<TagsSection />
					<ProfilesSection />
					<SystemSection />
					<AlbumsSection />
					<ObjectsSection />
					<PlacesSection />
					<CharactersSection />
				</div>
			</ScrollArea>
		</div>
	);
}
