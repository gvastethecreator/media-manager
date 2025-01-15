"use client";

import { useNavigationStore } from "@/store/navigation.store";
import { useFileManager } from "@/store/file-manager.store";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ViewBreadcrumbs } from "./breadcrumbs";
import {
	ImageIcon,
	Star,
	Search,
	FolderIcon,
	BookImage,
	TagIcon,
	Camera,
	User2,
	MapPin,
	Box,
	Plus,
	Filter,
	SlidersHorizontal,
	Grid,
	List,
	LayoutGrid,
	GalleryHorizontal,
	Download,
	Share2,
	Trash2,
	Edit,
} from "lucide-react";
import { ViewMode } from "@/components/features/file-grid/types";
import { ViewType } from "@/types/file-item";
import { Separator } from "@/components/ui/separator";

export function ViewToolbar() {
	const { currentView } = useNavigationStore();
	const {
		currentCollection,
		currentFolder,
		currentTag,
		currentAlbum,
		currentCharacter,
		currentPlace,
		currentObject,
		viewMode,
		setViewMode,
	} = useFileManager();

	const getCurrentItem = () => {
		switch (currentView) {
			case "collection-content":
				return currentCollection ?
						{
							name: currentCollection.name,
							path: `/collections/${currentCollection.id}`,
						}
					:	undefined;
			case "folder-content":
				return currentFolder ?
						{
							name: currentFolder.name,
							path: `/folders/${currentFolder.id}`,
						}
					:	undefined;
			case "tag-content":
				return currentTag ?
						{
							name: currentTag.name,
							path: `/tags/${currentTag.name}`,
						}
					:	undefined;
			case "album-content":
				return currentAlbum ?
						{
							name: currentAlbum.name,
							path: `/albums/${currentAlbum.id}`,
						}
					:	undefined;
			case "character-content":
				return currentCharacter ?
						{
							name: currentCharacter.name,
							path: `/characters/${currentCharacter.id}`,
						}
					:	undefined;
			case "place-content":
				return currentPlace ?
						{
							name: currentPlace.name,
							path: `/places/${currentPlace.id}`,
						}
					:	undefined;
			case "object-content":
				return currentObject ?
						{
							name: currentObject.name,
							path: `/objects/${currentObject.id}`,
						}
					:	undefined;
			default:
				return undefined;
		}
	};

	const renderIcon = () => {
		switch (currentView) {
			case "all-images":
				return <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />;
			case "favorites":
				return <Star className="h-3.5 w-3.5 text-muted-foreground" />;
			case "search":
				return <Search className="h-3.5 w-3.5 text-muted-foreground" />;
			case "collections":
			case "collection-content":
				return <BookImage className="h-3.5 w-3.5 text-muted-foreground" />;
			case "folders":
			case "folder-content":
				return <FolderIcon className="h-3.5 w-3.5 text-muted-foreground" />;
			case "tags":
			case "tag-content":
				return <TagIcon className="h-3.5 w-3.5 text-muted-foreground" />;
			case "albums":
			case "album-content":
				return <Camera className="h-3.5 w-3.5 text-muted-foreground" />;
			case "characters":
			case "character-content":
				return <User2 className="h-3.5 w-3.5 text-muted-foreground" />;
			case "places":
			case "place-content":
				return <MapPin className="h-3.5 w-3.5 text-muted-foreground" />;
			case "objects":
			case "object-content":
				return <Box className="h-3.5 w-3.5 text-muted-foreground" />;
			default:
				return null;
		}
	};

	const renderActions = () => {
		const commonActions = (
			<>
				<Separator orientation="vertical" className="h-7 w-px bg-border" />
				<div className="flex items-center gap-1 bg-black/50 rounded-md p-1">
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7"
						onClick={() => setViewMode("grid")}
						title="Vista de cuadrícula"
						data-active={viewMode === "grid"}
					>
						<Grid className="h-3.5 w-3.5" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7"
						onClick={() => setViewMode("masonry")}
						title="Vista de mosaico"
						data-active={viewMode === "masonry"}
					>
						<LayoutGrid className="h-3.5 w-3.5" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7"
						onClick={() => setViewMode("cards")}
						title="Vista de tarjetas"
						data-active={viewMode === "cards"}
					>
						<GalleryHorizontal className="h-3.5 w-3.5" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7"
						onClick={() => setViewMode("list")}
						title="Vista de lista"
						data-active={viewMode === "list"}
					>
						<List className="h-3.5 w-3.5" />
					</Button>
				</div>
			</>
		);

		switch (currentView) {
			case "all-images":
			case "favorites":
			case "search":
				return (
					<div className="flex items-center gap-1">
						<Button variant="ghost" size="icon" className="h-7 w-7">
							<Download className="h-3.5 w-3.5" />
						</Button>
						<Button variant="ghost" size="icon" className="h-7 w-7">
							<Share2 className="h-3.5 w-3.5" />
						</Button>
						{commonActions}
					</div>
				);
			case "collections":
			case "folders":
			case "tags":
			case "albums":
			case "characters":
			case "places":
			case "objects":
				return (
					<div className="flex items-center gap-1">
						<Button variant="ghost" size="sm" className="h-7 text-xs">
							<Plus className="h-3.5 w-3.5 mr-1" />
							Nuevo
						</Button>
						{commonActions}
					</div>
				);
			case "collection-content":
			case "folder-content":
			case "tag-content":
			case "album-content":
			case "character-content":
			case "place-content":
			case "object-content":
				return (
					<div className="flex items-center gap-1">
						<Button variant="ghost" size="icon" className="h-7 w-7">
							<Edit className="h-3.5 w-3.5" />
						</Button>
						<Button variant="ghost" size="icon" className="h-7 w-7">
							<Trash2 className="h-3.5 w-3.5" />
						</Button>
						{commonActions}
					</div>
				);
			default:
				return null;
		}
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			className={cn("flex flex-col bg-primary/5 py-0", "border-b")}
		>
			<div className="flex w-full items-center justify-between gap-2 p-2">
				<div className="flex items-center gap-4 w-full">
					<div className="flex items-center justify-center h-8 w-8 rounded-sm bg-muted">
						{renderIcon()}
					</div>
					<ViewBreadcrumbs
						currentView={currentView as ViewType}
						currentItem={getCurrentItem()}
					/>
				</div>
				<div className="flex items-center gap-2">{renderActions()}</div>
			</div>
		</motion.div>
	);
}
