"use client";

import { useNavigationStore } from "@/store/navigation";
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
import { AnimatePresence, motion } from "motion/react";
import { DevelopmentView } from "./development/development-view";
import { cn } from "@/lib/utils";
import { GridPattern } from "@/components/ui/grid-pattern";
import { DotPattern } from "../ui/dot-pattern";

const variants = {
	enter: (direction: number) => ({
		x: direction > 0 ? 1000 : -1000,
		opacity: 0,
	}),
	center: {
		zIndex: 1,
		x: 0,
		opacity: 1,
	},
	exit: (direction: number) => ({
		zIndex: 0,
		x: direction < 0 ? 1000 : -1000,
		opacity: 0,
		delay: 0.2,
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
			default:
			case "development":
				return <DevelopmentView />;
		}
	};

	return (
		<div className="relative w-full h-full overflow-hidden">
			<DotPattern
				className={cn(
					"opacity-40",
					"[mask-image:radial-gradient(500px_circle_at_center,white,transparent)]",
					isResizing && "opacity-60 transition-opacity duration-150"
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
						x: { type: "spring", stiffness: 300, damping: 30 },
						opacity: { duration: 0.2 },
					}}
					style={{
						opacity: isResizing ? 0.3 : 1,
						filter: isResizing ? "blur(2px)" : "none",
						transition: "all 0.15s ease-in-out",
						transform: isResizing ? "scale(0.99)" : "scale(1)",
					}}
					className="absolute w-full h-full"
				>
					{renderView()}
				</motion.div>
			</AnimatePresence>
		</div>
	);
}
