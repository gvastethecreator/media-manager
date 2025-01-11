"use client";

import { useNavigationStore } from "@/store/navigation";
import { useFileManager } from "@/store/file-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Icons } from "@/components/core/icons";
import { Meteors } from "@/components/ui/meteors";
import { CircleIcon } from "lucide-react";
import { AllImagesInfo } from "./views/all-images-info";
import { FavoritesInfo } from "./views/favorites-info";
import { SearchInfo } from "./views/search-info";
import { CollectionContentInfo } from "./views/collection-content-info";
import { FolderContentInfo } from "./views/folder-content-info";
import { TagContentInfo } from "./views/tag-content-info";
import { AlbumContentInfo } from "./views/album-content-info";
import { CharacterContentInfo } from "./views/character-content-info";
import { PlaceContentInfo } from "./views/place-content-info";
import { ObjectContentInfo } from "./views/object-content-info";
import { SettingsInfo } from "./views/settings-info";

export function InfoPanel() {
	const { currentView } = useNavigationStore();
	const {
		currentCollection,
		currentFolder,
		currentTag,
		currentAlbum,
		currentCharacter,
		currentPlace,
		currentObject,
	} = useFileManager();

	const renderInfoContent = () => {
		switch (currentView) {
			case "all-images":
				return <AllImagesInfo />;
			case "favorites":
				return <FavoritesInfo />;
			case "search":
				return <SearchInfo />;
			case "collections":
				return null;
			case "collection-content":
				return <CollectionContentInfo />;
			case "folders":
				return null;
			case "folder-content":
				return <FolderContentInfo />;
			case "tags":
				return null;
			case "tag-content":
				return <TagContentInfo />;
			case "albums":
				return null;
			case "album-content":
				return <AlbumContentInfo />;
			case "characters":
				return null;
			case "character-content":
				return <CharacterContentInfo />;
			case "places":
				return null;
			case "place-content":
				return <PlaceContentInfo />;
			case "objects":
				return null;
			case "object-content":
				return <ObjectContentInfo />;
			case "settings":
				return <SettingsInfo />;
			default:
				return null;
		}
	};

	return (
		<ScrollArea className="h-full w-full p-0">
			<div className="p-0 w-full h-full">
				<Meteors />
				<Card className="border-none rounded-none">
					<CardContent className="p-0">{renderInfoContent()}</CardContent>
				</Card>
			</div>
		</ScrollArea>
	);
}
