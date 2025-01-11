"use client";

import { useNavigationStore } from "@/store/navigation";
import { useFileManager } from "@/store/file-manager";
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
					<BreadcrumbLink href="/">Inicio</BreadcrumbLink>
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
							<BreadcrumbPage>Galería</BreadcrumbPage>
						</BreadcrumbItem>
					</Breadcrumb>
				);
			case "favorites":
				return (
					<Breadcrumb>
						{basePath}
						<BreadcrumbItem>
							<BreadcrumbPage>Favoritos</BreadcrumbPage>
						</BreadcrumbItem>
					</Breadcrumb>
				);
			case "search":
				return (
					<Breadcrumb>
						{basePath}
						<BreadcrumbItem>
							<BreadcrumbPage>Búsqueda</BreadcrumbPage>
						</BreadcrumbItem>
					</Breadcrumb>
				);
			case "collections":
				return (
					<Breadcrumb>
						{basePath}
						<BreadcrumbItem>
							<BreadcrumbPage>Colecciones</BreadcrumbPage>
						</BreadcrumbItem>
					</Breadcrumb>
				);
			case "collection-content":
				return (
					<Breadcrumb>
						{basePath}
						<BreadcrumbItem>
							<BreadcrumbLink href="/collections">Colecciones</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>{currentCollection?.name}</BreadcrumbPage>
						</BreadcrumbItem>
					</Breadcrumb>
				);
			case "folders":
				return (
					<Breadcrumb>
						{basePath}
						<BreadcrumbItem>
							<BreadcrumbPage>Carpetas</BreadcrumbPage>
						</BreadcrumbItem>
					</Breadcrumb>
				);
			case "folder-content":
				return (
					<Breadcrumb>
						{basePath}
						<BreadcrumbItem>
							<BreadcrumbLink href="/folders">Carpetas</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>{currentFolder?.name}</BreadcrumbPage>
						</BreadcrumbItem>
					</Breadcrumb>
				);
			case "tags":
				return (
					<Breadcrumb>
						{basePath}
						<BreadcrumbItem>
							<BreadcrumbPage>Etiquetas</BreadcrumbPage>
						</BreadcrumbItem>
					</Breadcrumb>
				);
			case "tag-content":
				return (
					<Breadcrumb>
						{basePath}
						<BreadcrumbItem>
							<BreadcrumbLink href="/tags">Etiquetas</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>{currentTag}</BreadcrumbPage>
						</BreadcrumbItem>
					</Breadcrumb>
				);
			case "albums":
				return (
					<Breadcrumb>
						{basePath}
						<BreadcrumbItem>
							<BreadcrumbPage>Álbumes</BreadcrumbPage>
						</BreadcrumbItem>
					</Breadcrumb>
				);
			case "album-content":
				return (
					<Breadcrumb>
						{basePath}
						<BreadcrumbItem>
							<BreadcrumbLink href="/albums">Álbumes</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>{currentAlbum?.name}</BreadcrumbPage>
						</BreadcrumbItem>
					</Breadcrumb>
				);
			case "characters":
				return (
					<Breadcrumb>
						{basePath}
						<BreadcrumbItem>
							<BreadcrumbPage>Personajes</BreadcrumbPage>
						</BreadcrumbItem>
					</Breadcrumb>
				);
			case "character-content":
				return (
					<Breadcrumb>
						{basePath}
						<BreadcrumbItem>
							<BreadcrumbLink href="/characters">Personajes</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>{currentCharacter?.name}</BreadcrumbPage>
						</BreadcrumbItem>
					</Breadcrumb>
				);
			case "places":
				return (
					<Breadcrumb>
						{basePath}
						<BreadcrumbItem>
							<BreadcrumbPage>Lugares</BreadcrumbPage>
						</BreadcrumbItem>
					</Breadcrumb>
				);
			case "place-content":
				return (
					<Breadcrumb>
						{basePath}
						<BreadcrumbItem>
							<BreadcrumbLink href="/places">Lugares</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>{currentPlace?.name}</BreadcrumbPage>
						</BreadcrumbItem>
					</Breadcrumb>
				);
			case "objects":
				return (
					<Breadcrumb>
						{basePath}
						<BreadcrumbItem>
							<BreadcrumbPage>Objetos</BreadcrumbPage>
						</BreadcrumbItem>
					</Breadcrumb>
				);
			case "object-content":
				return (
					<Breadcrumb>
						{basePath}
						<BreadcrumbItem>
							<BreadcrumbLink href="/objects">Objetos</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>{currentObject?.name}</BreadcrumbPage>
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
				<Button variant="ghost" size="icon" className="h-8 w-8">
					<Filter className="h-4 w-4" />
				</Button>
				<Button variant="ghost" size="icon" className="h-8 w-8">
					<SlidersHorizontal className="h-4 w-4" />
				</Button>
				<Button variant="ghost" size="icon" className="h-8 w-8">
					<Grid className="h-4 w-4" />
				</Button>
			</>
		);

		switch (currentView) {
			case "all-images":
			case "favorites":
			case "search":
				return (
					<div className="flex items-center gap-2">
						{commonActions}
						<Button variant="ghost" size="icon" className="h-8 w-8">
							<Download className="h-4 w-4" />
						</Button>
						<Button variant="ghost" size="icon" className="h-8 w-8">
							<Share2 className="h-4 w-4" />
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
					<div className="flex items-center gap-2">
						<Button variant="ghost" size="sm" className="h-8">
							<Plus className="h-4 w-4 mr-2" />
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
					<div className="flex items-center gap-2">
						{commonActions}
						<Button variant="ghost" size="icon" className="h-8 w-8">
							<Edit className="h-4 w-4" />
						</Button>
						<Button variant="ghost" size="icon" className="h-8 w-8">
							<Trash2 className="h-4 w-4" />
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
				return <ImageIcon className="h-4 w-4 text-muted-foreground" />;
			case "favorites":
				return <Star className="h-4 w-4 text-muted-foreground" />;
			case "search":
				return <Search className="h-4 w-4 text-muted-foreground" />;
			case "collections":
			case "collection-content":
				return <BookImage className="h-4 w-4 text-muted-foreground" />;
			case "folders":
			case "folder-content":
				return <FolderIcon className="h-4 w-4 text-muted-foreground" />;
			case "tags":
			case "tag-content":
				return <TagIcon className="h-4 w-4 text-muted-foreground" />;
			case "albums":
			case "album-content":
				return <Camera className="h-4 w-4 text-muted-foreground" />;
			case "characters":
			case "character-content":
				return <User2 className="h-4 w-4 text-muted-foreground" />;
			case "places":
			case "place-content":
				return <MapPin className="h-4 w-4 text-muted-foreground" />;
			case "objects":
			case "object-content":
				return <Box className="h-4 w-4 text-muted-foreground" />;
			default:
				return null;
		}
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			className={cn(
				"w-full h-12 px-4",
				"border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
				"flex items-center justify-between"
			)}
		>
			<div className="flex items-center gap-4">
				{renderIcon()}
				{renderBreadcrumb()}
			</div>
			{renderActions()}
		</motion.div>
	);
}
