"use client";

import { useNavigationStore } from "@/store/navigation.store";
import { ViewContainerProps } from "./types";
import { SettingsView } from "./settings/settings-view";
import { AllImagesView } from "./all-images/all-images-view";
import { FavoritesView } from "./favorites/favorites-view";
import { SearchView } from "./search/search-view";
import { FoldersView } from "./folders/folders-view";
import { FolderContentView } from "./folders/folder-content-view";
import { CollectionsView } from "./collections/collections-view";
import { CollectionContentView } from "./collections/collection-content-view";
import { TagsView } from "./tags/tags-view";
import { TagContentView } from "./tags/tag-content-view";
import { AlbumsView } from "./albums/albums-view";
import { AlbumContentView } from "./albums/album-content-view";
import { CharactersView } from "./characters/characters-view";
import { CharacterContentView } from "./characters/character-content-view";
import { PlacesView } from "./places/places-view";
import { PlaceContentView } from "./places/place-content-view";
import { ObjectsView } from "./objects/objects-view";
import { ObjectContentView } from "./objects/object-content-view";
import { AnimatePresence, motion } from "motion/react";
import { DevelopmentView } from "./development/development-view";
import { cn } from "@/lib/utils";
import { DotPattern } from "../ui/dot-pattern";
import { X } from "lucide-react";

const variants = {
	enter: (direction: number) => ({
		x: direction > 0 ? 800 : -800,
		opacity: 0,
		scale: 0.98,
	}),
	center: {
		zIndex: 1,
		x: 0,
		opacity: 1,
		scale: 1,
	},
	exit: (direction: number) => ({
		zIndex: 0,
		x: direction < 0 ? 800 : -800,
		opacity: 0,
		scale: 0.98,
	}),
};

export function ViewContainer({ isResizing }: ViewContainerProps) {
	const { currentView, navigationDirection } = useNavigationStore();

	const renderView = () => {
		switch (currentView) {
			case "settings":
				return <SettingsView />;
			case "all-images":
				return <AllImagesView />;
			case "favorites":
				return <FavoritesView />;
			case "search":
				return <SearchView />;
			case "collections":
				return <CollectionsView />;
			case "collection-content":
				return <CollectionContentView />;
			case "folders":
				return <FoldersView />;
			case "folder-content":
				return <FolderContentView />;
			case "tags":
				return <TagsView />;
			case "tag-content":
				return <TagContentView />;
			case "albums":
				return <AlbumsView />;
			case "album-content":
				return <AlbumContentView />;
			case "characters":
				return <CharactersView />;
			case "character-content":
				return <CharacterContentView />;
			case "places":
				return <PlacesView />;
			case "place-content":
				return <PlaceContentView />;
			case "objects":
				return <ObjectsView />;
			case "object-content":
				return <ObjectContentView />;
			default:
			case "development":
				return <DevelopmentView />;
		}
	};

	return (
		<div className="relative w-full h-full overflow-hidden">
			<DotPattern
				x={6}
				y={6}
				width={8}
				height={8}
				className={cn(
					"opacity-10",
					"[mask-image:radial-gradient(750px_circle_at_center,white,transparent)]",
					isResizing && "opacity-20 transition-opacity duration-150"
				)}
			/>
			<AnimatePresence initial={false} custom={navigationDirection}>
				<motion.div
					key={currentView}
					custom={navigationDirection}
					variants={variants}
					initial="enter"
					animate="center"
					exit="exit"
					transition={{
						x: { type: "spring", stiffness: 400, damping: 35 },
						opacity: { duration: 0.15 },
						scale: { duration: 0.2 },
					}}
					style={{
						opacity: isResizing ? 0 : 1,
						filter: isResizing ? "blur(1px)" : "none",
						transition: "all 0.12s ease-out",
					}}
					className="absolute w-full h-full"
				>
					{renderView()}
				</motion.div>
			</AnimatePresence>
		</div>
	);
}
