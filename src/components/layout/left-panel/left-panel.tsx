"use client";

import { useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useFileManager } from "@/store/file-manager";
import { useUIStore } from "@/store/ui";
import { useStatsStore } from "@/store/stats";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "next-themes";
import { Badge } from "@/components/ui/badge";
import { useSettingsContext } from "@/context/settings-context";
import {
	FolderIcon,
	TagIcon,
	Settings2,
	Sun,
	Moon,
	Star,
	Image as ImageIcon,
	Search,
	RefreshCcw,
	Bug,
	BookImage,
	CornerDownRight,
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
		icon: BookImage,
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
		id: "debug" as ViewType,
		label: "Desarrollo",
		icon: Bug,
		color: "#4ade80",
	},
];

export function LeftPanel() {
	const { stats, initialize: initializeStats } = useStatsStore();
	const { settings } = useSettingsContext();
	const { profiles, activeProfile } = settings;
	const activeProfileData = profiles.find((p) => p.id === activeProfile);
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
			<div className="flex flex-col bg-primary/10 py-2">
				<div className="flex items-center justify-between gap-2">
					<div className="flex gap-2 items-center px-2">
						<div
							className="flex items-center justify-center h-8 w-8 rounded-sm"
							style={{ backgroundColor: activeProfileData?.color }}
						>
							<span className="text-xs font-medium">
								{activeProfileData?.emoji}
							</span>
						</div>
						<div className="flex flex-col">
							<span className="text-xs font-medium truncate">
								{activeProfileData?.name}
							</span>
							<span className="text-[9px] text-muted-foreground">
								{stats?.totalImages || 0} imágenes
							</span>
						</div>
					</div>
					<div className="gap-8 pr-2">
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8"
							onClick={handleResetApp}
						>
							<RefreshCcw className="h-4 w-4" />
						</Button>

						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8"
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
							className="h-8 w-8"
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
					<div className="flex justify-between gap-1">
						{navigationItems.map(({ id, icon: Icon, label }) => (
							<Button
								key={id}
								variant="outline"
								className={cn(
									"gap-2 h-7 px-3 transition-colors rounded-sm flex-1 text-center",
									currentView === id &&
										"bg-gradient-to-r from-white/10 to-white/15"
								)}
								onClick={() => handleItemClick(id)}
							>
								<span className="truncate flex items-center justify-center">
									<Icon className="h-4 w-4 mr-1 mb-0.5" /> {label}
								</span>
							</Button>
						))}
					</div>

					{/* Categorías con Listas */}
					<div className="mt-1">
						{categories.map(({ id, icon: Icon, label, color }) => (
							<div key={id} className="mt-1">
								<Button
									variant="ghost"
									className={cn(
										"w-full justify-start gap-2 h-8 px-2 text-sm transition-colors text-xs rounded-sm bg-white/5 mt-2",
										currentView === id &&
											"bg-gradient-to-r from-white/10 to-white/15"
									)}
									onClick={() => handleItemClick(id)}
								>
									<Icon className="h-4 w-4" style={{ color }} />
									<span className="flex-1 text-left truncate">{label}</span>
									{id === "collections" && stats?.totalCollections ? (
										<span className="ml-2 text-white border-none">
											{stats.totalCollections}
										</span>
									) : null}
									{id === "folders" && stats?.totalFolders ? (
										<span className="ml-2 text-white border-none	">
											{stats.totalFolders}
										</span>
									) : null}
									{id === "tags" && stats?.totalTags ? (
										<span className="ml-2 text-white border-none">
											{stats.totalTags}
										</span>
									) : null}
								</Button>

								<div className="mt-1 flex flex-col gap-1">
									{id === "collections" &&
										collections?.map((collection) => (
											<Button
												key={collection.id}
												variant="ghost"
												className={cn(
													"justify-start gap-2 h-6 px-2 text-sm transition-colors text-xs rounded-sm text-left",
													currentView === "collection-content" &&
														currentCollectionId === collection.id &&
														"bg-gradient-to-r from-white/10 to-white/15"
												)}
												onClick={() => handleCollectionClick(collection.id)}
											>
												<CornerDownRight className="h-2 w-2 text-white/20" />
												<span className="text-base">{collection.emoji}</span>
												<span className="flex-1 text-left truncate">
													{collection.name}
												</span>
												<span className="ml-2 text-white border-none">
													{collection.count}
												</span>
											</Button>
										))}
									{id === "folders" &&
										folders?.map((folder) => (
											<Button
												key={folder.id}
												variant="ghost"
												className={cn(
													"w-full justify-start gap-2 h-6 px-2 text-sm transition-colors text-xs",
													currentView === "folder-content" &&
														currentFolderId === folder.id &&
														"bg-gradient-to-r from-white/10 to-white/15"
												)}
												onClick={() => handleFolderClick(folder.id)}
											>
												<CornerDownRight className="h-2 w-2 text-white/20" />
												<FolderIcon className="h-4 w-4" />
												<span className="flex-1 text-left truncate">
													{folder.name}
												</span>
												<span className="ml-2 text-white border-none">
													{folder.count}
												</span>
											</Button>
										))}
									{id === "tags" && (
										<div className="flex flex-col-4 gap-2 mt-1">
											{tags?.map((tag) => (
												<Button
													variant="ghost"
													key={tag.id}
													style={{ backgroundColor: tag.color }}
													className={cn(
														"justify-start gap-2 h-5 px-3 text-[10px] transition-colors rounded-xl",
														currentView === "tag-content" &&
															currentTagId === tag.name &&
															"bg-gradient-to-r from-black/30 to-black/35"
													)}
													onClick={() => handleTagClick(tag.name)}
												>
													<span className="flex-1 text-left  text-[10px] truncate shadow-sm">
														{tag.name}
													</span>
													<span className="text-[10px] h-4 text-white border-none">
														{tag.count}
													</span>
												</Button>
											))}
										</div>
									)}
								</div>
							</div>
						))}
					</div>
				</div>
			</ScrollArea>
		</div>
	);
}
