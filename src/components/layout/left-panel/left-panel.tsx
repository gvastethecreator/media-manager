"use client";

import { useCallback, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useFilesStore } from "@/store/files";
import { useUIStore } from "@/store/ui";
import { useStatsStore } from "@/store/stats";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "next-themes";
import { Badge } from "@/components/ui/badge";
import { SidebarItem } from "@/components/ui/sidebar-item";
import {
	FolderIcon,
	TagIcon,
	Settings2,
	Sun,
	Moon,
	Home,
	Star,
	Image as ImageIcon,
	LibraryBig,
	Search,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useNavigationStore } from "@/store/navigation";
import { ViewType } from "@/types/file-item";

const navigationItems = [
	{ id: "dashboard" as ViewType, label: "Dashboard", icon: Home },
	{ id: "all-images" as ViewType, label: "Galería", icon: ImageIcon },
	{ id: "favorites" as ViewType, label: "Favoritos", icon: Star },
	{ id: "search" as ViewType, label: "Buscar", icon: Search },
];

const categories = [
	{
		id: "collections" as ViewType,
		icon: LibraryBig,
		label: "Colecciones",
		color: "#ef4444",
	},
	{
		id: "folders" as ViewType,
		icon: FolderIcon,
		label: "Carpetas",
		color: "#22c55e",
	},
	{
		id: "tags" as ViewType,
		icon: TagIcon,
		label: "Etiquetas",
		color: "#f59e0b",
	},
];

export function LeftPanel() {
	const { stats, initialize: initializeStats } = useStatsStore();
	const { currentView, setCurrentView } = useNavigationStore();
	const {
		collections,
		folders,
		tags,
		handleSelectCollection,
		handleSelectFolder,
		handleSelectTag,
		initialize,
	} = useFilesStore();

	const { toggleSettings } = useUIStore();
	const { theme, setTheme } = useTheme();

	useEffect(() => {
		Promise.all([
			initialize(),
			initializeStats()
		]).catch(error => {
			console.error('Error initializing:', error);
		});
	}, [initialize, initializeStats]);

	const handleThemeToggle = useCallback(() => {
		setTheme(theme === "light" ? "dark" : "light");
	}, [theme, setTheme]);

	const handleOpenSettings = useCallback(() => {
		setCurrentView('settings');
		toggleSettings();
	}, [toggleSettings, setCurrentView]);

	const handleItemClick = useCallback(
		(id: ViewType) => {
			setCurrentView(id);
		},
		[setCurrentView]
	);

	const handleCollectionClick = useCallback(
		(collectionId: string) => {
			setCurrentView("collection-content");
			handleSelectCollection(collectionId);
		},
		[setCurrentView, handleSelectCollection]
	);

	const handleFolderClick = useCallback(
		(folderId: string) => {
			setCurrentView("folder-content");
			handleSelectFolder(folderId);
		},
		[setCurrentView, handleSelectFolder]
	);

	const handleTagClick = useCallback(
		(tagName: string) => {
			setCurrentView("tag-content");
			handleSelectTag(tagName);
		},
		[setCurrentView, handleSelectTag]
	);

	return (
		<div className="flex flex-col h-full">
			<div className="flex flex-col">
				<div className="flex items-center justify-between gap-2">
					<div className="flex flex-col items-start px-2">
						<span className="text-sm font-medium">Image Manager</span>
						<span className="text-xs text-muted-foreground">
							{stats?.totalImages || 0} imágenes
						</span>
					</div>
					<div className="gap-4 px-2">
						<Button
							variant="ghost"
							size="icon"
							className="h-7 w-7"
							onClick={handleThemeToggle}
						>
							{theme === "light" ? (
								<Moon className="h-4 w-4" />
							) : (
								<Sun className="h-4 w-4" />
							)}
						</Button>

						<Button
							variant="ghost"
							size="icon"
							className="h-7 w-7"
							onClick={handleOpenSettings}
						>
							<Settings2 className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>
			<Separator className="my-1" />
			<ScrollArea className="flex-1">
				<div className="">
					{/* Navegación Principal */}
					<div className="rounded-none">
						{navigationItems.map(({ id, icon: Icon, label }) => (
							<SidebarItem
								key={id}
								icon={Icon}
								label={label}
								isActive={currentView === id}
								onClick={() => handleItemClick(id)}
							/>
						))}
					</div>
					{/* Categorías con Listas */}
					<div className="">
						{categories.map(({ id, icon: Icon, label, color }) => (
							<div key={id} className="">
								<SidebarItem
									icon={Icon}
									label={label}
									count={
										id === "collections"
											? stats?.totalCollections
											: id === "folders"
											? stats?.totalFolders
											: id === "tags"
											? stats?.totalTags
											: undefined
									}
									isActive={
										currentView === id ||
										(id === "collections" &&
											currentView === "collection-content") ||
										(id === "folders" && currentView === "folder-content") ||
										(id === "tags" && currentView === "tag-content")
									}
									onClick={() => handleItemClick(id)}
								/>
								<div className="mt-1 space-y-0.5">
									{id === "collections" &&
										collections?.map((collection) => (
											<Button
												key={collection.id}
												variant="ghost"
												className="w-full justify-start gap-2 h-6 text-xs px-2 rounded-none"
												onClick={() => handleCollectionClick(collection.id)}
											>
												<span className="text-base">{collection.emoji}</span>
												<span className="flex-1 text-left truncate">
													{collection.name}
												</span>
												<Badge variant="secondary" className="ml-2">
													{collection.count}
												</Badge>
											</Button>
										))}
									{id === "folders" &&
										folders?.map((folder) => (
											<Button
												key={folder.id}
												variant="ghost"
												className="w-full justify-start h-6 text-xs px-2 rounded-none"
												onClick={() => handleFolderClick(folder.id)}
											>
												<FolderIcon className="h-2 w-2" />
												<span className="flex-1 text-left truncate">
													{folder.name}
												</span>
												<Badge variant="secondary" className="ml-2">
													{folder.count}
												</Badge>
											</Button>
										))}
									{id === "tags" &&
										tags?.map((tag) => (
											<Button
												key={tag.id}
												variant="ghost"
												className="justify-start h-6 text-xs px-2 rounded-none gap-2"
												style={{ color: tag.color }}
												onClick={() => handleTagClick(tag.name)}
											>
												<span
													className="w-3 h-3 rounded-full"
													style={{ backgroundColor: tag.color }}
												/>
												<span className="flex-1 text-left truncate">
													{tag.name}
												</span>
												<Badge variant="outline">{tag.count}</Badge>
											</Button>
										))}
								</div>
							</div>
						))}
					</div>
				</div>
			</ScrollArea>
		</div>
	);
}
