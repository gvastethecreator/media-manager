"use client";

import { useNavigationStore } from "@/store/navigation.store";
import { useFileManager } from "@/store/file-manager.store";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
	Download,
	Share2,
	Trash2,
	Edit,
} from "lucide-react";

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
	} = useFileManager();

	const renderBreadcrumb = () => {
		const basePath = (
			<BreadcrumbList>
				<BreadcrumbItem>
					<BreadcrumbLink
						href="/"
						className="text-sm font-medium hover:text-foreground"
					>
						Inicio
					</BreadcrumbLink>
				</BreadcrumbItem>
				<BreadcrumbSeparator />
			</BreadcrumbList>
		);

		switch (currentView) {
			case "all-images":
				return (
					<Breadcrumb>
						{basePath}
						<BreadcrumbItem>
							<BreadcrumbPage className="text-sm font-medium text-muted-foreground">
								Galería
							</BreadcrumbPage>
						</BreadcrumbItem>
					</Breadcrumb>
				);
			case "favorites":
				return (
					<Breadcrumb>
						{basePath}
						<BreadcrumbItem>
							<BreadcrumbPage className="text-sm font-medium text-muted-foreground">
								Favoritos
							</BreadcrumbPage>
						</BreadcrumbItem>
					</Breadcrumb>
				);
			case "search":
				return (
					<Breadcrumb>
						{basePath}
						<BreadcrumbItem>
							<BreadcrumbPage className="text-sm font-medium text-muted-foreground">
								Búsqueda
							</BreadcrumbPage>
						</BreadcrumbItem>
					</Breadcrumb>
				);
			case "collections":
				return (
					<Breadcrumb>
						{basePath}
						<BreadcrumbItem>
							<BreadcrumbPage className="text-sm font-medium text-muted-foreground">
								Colecciones
							</BreadcrumbPage>
						</BreadcrumbItem>
					</Breadcrumb>
				);
			case "collection-content":
				return (
					<Breadcrumb>
						{basePath}
						<BreadcrumbItem>
							<BreadcrumbLink
								href="/collections"
								className="text-sm font-medium hover:text-foreground"
							>
								Colecciones
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage className="text-sm font-medium text-muted-foreground">
								{currentCollection?.name}
							</BreadcrumbPage>
						</BreadcrumbItem>
					</Breadcrumb>
				);
			case "folders":
				return (
					<Breadcrumb>
						{basePath}
						<BreadcrumbItem>
							<BreadcrumbPage className="text-sm font-medium text-muted-foreground">
								Carpetas
							</BreadcrumbPage>
						</BreadcrumbItem>
					</Breadcrumb>
				);
			case "folder-content":
				return (
					<Breadcrumb>
						{basePath}
						<BreadcrumbItem>
							<BreadcrumbLink
								href="/folders"
								className="text-sm font-medium hover:text-foreground"
							>
								Carpetas
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage className="text-sm font-medium text-muted-foreground">
								{currentFolder?.name}
							</BreadcrumbPage>
						</BreadcrumbItem>
					</Breadcrumb>
				);
			case "tags":
				return (
					<Breadcrumb>
						{basePath}
						<BreadcrumbItem>
							<BreadcrumbPage className="text-sm font-medium text-muted-foreground">
								Etiquetas
							</BreadcrumbPage>
						</BreadcrumbItem>
					</Breadcrumb>
				);
			case "tag-content":
				return (
					<Breadcrumb>
						{basePath}
						<BreadcrumbItem>
							<BreadcrumbLink
								href="/tags"
								className="text-sm font-medium hover:text-foreground"
							>
								Etiquetas
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage className="text-sm font-medium text-muted-foreground">
								{currentTag}
							</BreadcrumbPage>
						</BreadcrumbItem>
					</Breadcrumb>
				);
			case "albums":
				return (
					<Breadcrumb>
						{basePath}
						<BreadcrumbItem>
							<BreadcrumbPage className="text-sm font-medium text-muted-foreground">
								Álbumes
							</BreadcrumbPage>
						</BreadcrumbItem>
					</Breadcrumb>
				);
			case "album-content":
				return (
					<Breadcrumb>
						{basePath}
						<BreadcrumbItem>
							<BreadcrumbLink
								href="/albums"
								className="text-sm font-medium hover:text-foreground"
							>
								Álbumes
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage className="text-sm font-medium text-muted-foreground">
								{currentAlbum?.name}
							</BreadcrumbPage>
						</BreadcrumbItem>
					</Breadcrumb>
				);
			case "characters":
				return (
					<Breadcrumb>
						{basePath}
						<BreadcrumbItem>
							<BreadcrumbPage className="text-sm font-medium text-muted-foreground">
								Personajes
							</BreadcrumbPage>
						</BreadcrumbItem>
					</Breadcrumb>
				);
			case "character-content":
				return (
					<Breadcrumb>
						{basePath}
						<BreadcrumbItem>
							<BreadcrumbLink
								href="/characters"
								className="text-sm font-medium hover:text-foreground"
							>
								Personajes
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage className="text-sm font-medium text-muted-foreground">
								{currentCharacter?.name}
							</BreadcrumbPage>
						</BreadcrumbItem>
					</Breadcrumb>
				);
			case "places":
				return (
					<Breadcrumb>
						{basePath}
						<BreadcrumbItem>
							<BreadcrumbPage className="text-sm font-medium text-muted-foreground">
								Lugares
							</BreadcrumbPage>
						</BreadcrumbItem>
					</Breadcrumb>
				);
			case "place-content":
				return (
					<Breadcrumb>
						{basePath}
						<BreadcrumbItem>
							<BreadcrumbLink
								href="/places"
								className="text-sm font-medium hover:text-foreground"
							>
								Lugares
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage className="text-sm font-medium text-muted-foreground">
								{currentPlace?.name}
							</BreadcrumbPage>
						</BreadcrumbItem>
					</Breadcrumb>
				);
			case "objects":
				return (
					<Breadcrumb>
						{basePath}
						<BreadcrumbItem>
							<BreadcrumbPage className="text-sm font-medium text-muted-foreground">
								Objetos
							</BreadcrumbPage>
						</BreadcrumbItem>
					</Breadcrumb>
				);
			case "object-content":
				return (
					<Breadcrumb>
						{basePath}
						<BreadcrumbItem>
							<BreadcrumbLink
								href="/objects"
								className="text-sm font-medium hover:text-foreground"
							>
								Objetos
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage className="text-sm font-medium text-muted-foreground">
								{currentObject?.name}
							</BreadcrumbPage>
						</BreadcrumbItem>
					</Breadcrumb>
				);
			default:
				return basePath;
		}
	};

	const renderActions = () => {
		const commonActions = (
			<>
				<Button variant="ghost" size="icon" className="h-7 w-7">
					<Filter className="h-3.5 w-3.5" />
				</Button>
				<Button variant="ghost" size="icon" className="h-7 w-7">
					<SlidersHorizontal className="h-3.5 w-3.5" />
				</Button>
				<Button variant="ghost" size="icon" className="h-7 w-7">
					<Grid className="h-3.5 w-3.5" />
				</Button>
			</>
		);

		switch (currentView) {
			case "all-images":
			case "favorites":
			case "search":
				return (
					<div className="flex items-center gap-1">
						{commonActions}
						<Button variant="ghost" size="icon" className="h-7 w-7">
							<Download className="h-3.5 w-3.5" />
						</Button>
						<Button variant="ghost" size="icon" className="h-7 w-7">
							<Share2 className="h-3.5 w-3.5" />
						</Button>
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
						{commonActions}
						<Button variant="ghost" size="icon" className="h-7 w-7">
							<Edit className="h-3.5 w-3.5" />
						</Button>
						<Button variant="ghost" size="icon" className="h-7 w-7">
							<Trash2 className="h-3.5 w-3.5" />
						</Button>
					</div>
				);
			default:
				return null;
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

	return (
		<motion.div
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			className={cn("flex flex-col bg-primary/10 py-2 h-12", "border-b")}
		>
			<div className="flex w-full items-center justify-between gap-2 px-2">
				<div className="flex items-center gap-4 w-full">
					<div className="flex items-center justify-center h-8 w-8 rounded-sm bg-muted">
						{renderIcon()}
					</div>
					{renderBreadcrumb()}
				</div>
				<div className="flex items-center gap-2">{renderActions()}</div>
			</div>
		</motion.div>
	);
}
