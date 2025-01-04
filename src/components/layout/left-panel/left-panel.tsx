"use client";

import { useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useFileManager } from "@/store/file-manager";
import { useUIStore } from "@/store/ui";
import { useStatsStore } from "@/store/stats";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "next-themes";
import { Badge } from "@/components/ui/badge";
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
	ChartLine,
	RefreshCcw,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useNavigationStore } from "@/store/navigation";
import { ViewType } from "@/types/file-item";
import { cn } from "@/lib/utils";

const navigationItems = [
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
	{
		id: "dashboard" as ViewType,
		label: "Estadísticas",
		icon: ChartLine,
		color: "#3b82f6",
	},
];

export function LeftPanel() {
	const { stats, initialize: initializeStats } = useStatsStore();
	const { currentView, setCurrentView } = useNavigationStore();
	const {
		collections,
		folders,
		tags,
		setCurrentCollection,
		setCurrentFolder,
		setCurrentTag,
		currentCollectionId,
		currentFolderId,
		currentTagId,
		initialize,
	} = useFileManager();

	const { toggleSettings } = useUIStore();
	const { theme, setTheme } = useTheme();

	useEffect(() => {
		Promise.all([initialize(), initializeStats()]).catch((error) => {
			console.error("Error initializing:", error);
		});
	}, [initialize, initializeStats]);

	const handleThemeToggle = useCallback(() => {
		setTheme(theme === "light" ? "dark" : "light");
	}, [theme, setTheme]);

	const handleOpenSettings = useCallback(() => {
		setCurrentView("settings");
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
			setCurrentCollection(collectionId);
		},
		[setCurrentView, setCurrentCollection]
	);

	const handleFolderClick = useCallback(
		(folderId: string) => {
			setCurrentView("folder-content");
			setCurrentFolder(folderId);
		},
		[setCurrentView, setCurrentFolder]
	);

	const handleTagClick = useCallback(
		(tagName: string) => {
			setCurrentView("tag-content");
			setCurrentTag(tagName);
		},
		[setCurrentView, setCurrentTag]
	);

	const handleResetApp = useCallback(() => {
		Promise.all([initialize(), initializeStats()]).catch((error) => {
			console.error("Error resetting app:", error);
		});
	}, [initialize, initializeStats]);

	return (
		<div className="flex flex-col h-full">
			<div className="flex flex-col bg-primary/10 py-1">
				<div className="flex items-center justify-between gap-2">
					<div className="flex gap-2 items-center px-2">
						<div className="flex items-center justify-center h-5 w-5 rounded-sm bg-white/10">
							<span className="text-xs font-medium">🧃</span>
						</div>
						<span className="text-[10px] text-muted-foreground">
							{stats?.totalImages || 0} imágenes
						</span>
					</div>
					<div className="gap-8 pr-2">
						<Button
							variant="ghost"
							size="icon"
							className="h-7 w-7"
							onClick={handleResetApp}
						>
							<RefreshCcw className="h-4 w-4" />
						</Button>

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
			<ScrollArea className="flex-1">
				<div className="p-2">
					{/* Navegación Principal */}
					<div className="flex flex-col gap-1">
						{navigationItems.map(({ id, icon: Icon, label }) => (
							<Button
								key={id}
								variant={currentView === id ? "secondary" : "ghost"}
								className="w-full justify-start gap-2 h-9 px-2 transition-colors"
								onClick={() => handleItemClick(id)}
							>
								<Icon className="h-4 w-4" />
								<span className="flex-1 text-left truncate">{label}</span>
							</Button>
						))}
					</div>

					{/* Categorías con Listas */}
					<div className="mt-2">
						{categories.map(({ id, icon: Icon, label, color }) => (
							<div key={id} className="mb-1">
								<Button
									variant={currentView === id ? "secondary" : "ghost"}
									className={cn(
										"w-full justify-start gap-2 h-9 px-2 font-medium transition-colors",
										currentView === id && "bg-accent"
									)}
									onClick={() => handleItemClick(id)}
								>
									<Icon className="h-4 w-4" style={{ color }} />
									<span className="flex-1 text-left truncate">{label}</span>
									{id === "collections" && stats?.totalCollections ? (
										<Badge variant="secondary" className="ml-2">
											{stats.totalCollections}
										</Badge>
									) : null}
									{id === "folders" && stats?.totalFolders ? (
										<Badge variant="secondary" className="ml-2">
											{stats.totalFolders}
										</Badge>
									) : null}
									{id === "tags" && stats?.totalTags ? (
										<Badge variant="secondary" className="ml-2">
											{stats.totalTags}
										</Badge>
									) : null}
								</Button>

								<div className="mt-1 pl-1 flex flex-col gap-1">
									{id === "collections" &&
										collections?.map((collection) => (
											<Button
												key={collection.id}
												variant={
													currentView === "collection-content" &&
													currentCollectionId === collection.id
														? "secondary"
														: "ghost"
												}
												className="w-full justify-start gap-2 h-8 px-2 text-sm transition-colors text-xs"
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
												variant={
													currentView === "folder-content" &&
													currentFolderId === folder.id
														? "secondary"
														: "ghost"
												}
												className="w-full justify-start gap-2 h-8 px-2 text-sm transition-colors text-xs"
												onClick={() => handleFolderClick(folder.id)}
											>
												<FolderIcon className="h-4 w-4" style={{ color }} />
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
												variant={
													currentView === "tag-content" &&
													currentTagId === tag.name
														? "secondary"
														: "ghost"
												}
												className="w-full justify-start gap-2 h-8 px-2 text-sm transition-colors text-xs"
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
