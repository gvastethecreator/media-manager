"use client";

import { memo } from "react";
import { FileItem } from "@/types/file-item";
import { cn } from "@/lib/utils";
import { ImageRenderer } from "../image-renderer";
import { FileContextMenu } from "../context-menu";
import { Badge } from "@/components/ui/badge";
import type { ContextMenuAction } from "../context-menu";
import {
	Heart,
	Share2,
	Wand2,
	HardDrive,
	Calendar,
	Maximize2,
	Palette,
	BookImage,
	Camera,
	User2,
	MapPin,
	Box,
	ImageIcon,
} from "lucide-react";

interface CardsViewProps {
	item: FileItem;
	itemSize: number;
	isSelected?: boolean;
	isScrolling?: boolean;
	shouldLoad?: boolean;
	thumbnail?: string | null;
	isLoading?: boolean;
	error?: string | null;
	onClick?: (item: FileItem) => void;
	onDoubleClick?: (item: FileItem) => void;
	onContextAction?: (
		action: ContextMenuAction,
		item: FileItem,
		data?: any
	) => void;
	style?: React.CSSProperties;
}

const getMetadata = (metadata: string | null) => {
	if (!metadata) return null;
	try {
		return JSON.parse(metadata);
	} catch {
		return null;
	}
};

function formatBytes(bytes: number): string {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB", "TB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export const CardsView = memo(function CardsView({
	item,
	itemSize,
	isSelected,
	isScrolling,
	shouldLoad,
	thumbnail,
	isLoading,
	error,
	onClick,
	onDoubleClick,
	onContextAction,
	style,
}: CardsViewProps) {
	const metadata = getMetadata(item.metadata);

	return (
		<FileContextMenu file={item} onAction={onContextAction || (() => {})}>
			<div
				className={cn(
					"relative w-full h-full bg-card rounded-lg border shadow-sm overflow-hidden group hover:shadow-md transition-all duration-200",
					isSelected && "ring-2 ring-primary",
					isScrolling && "opacity-50"
				)}
				style={style}
				onClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					onClick?.(item);
				}}
				onDoubleClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					onDoubleClick?.(item);
				}}
			>
				<div className="flex flex-col h-full">
					<div
						className="relative overflow-hidden"
						style={{
							height:
								metadata?.dimensions ?
									Math.min(
										itemSize /
											(metadata.dimensions.width / metadata.dimensions.height),
										itemSize * 0.6
									)
								:	itemSize * 0.5,
						}}
					>
						{shouldLoad && thumbnail ?
							<div className="relative w-full h-full">
								<div
									className="absolute inset-0 bg-cover bg-center blur-sm opacity-30 brightness-50"
									style={{
										backgroundImage: `url(${thumbnail})`,
									}}
								/>
								<ImageRenderer
									src={thumbnail}
									alt={item.name}
									width={metadata?.dimensions?.width}
									height={metadata?.dimensions?.height}
									className={cn(
										"h-full w-full object-contain transition-all duration-200",
										"group-hover:scale-[1.02]"
									)}
									quality={75}
								/>
							</div>
						:	<div className="flex items-center justify-center h-full bg-muted">
								<ImageIcon className="h-8 w-8 text-muted-foreground/50" />
							</div>
						}
						<div className="absolute top-2 right-2 flex gap-1">
							{item.isFavorite && (
								<Badge
									variant="secondary"
									className="bg-red-500/20 text-red-500"
								>
									<Heart className="h-3 w-3 fill-current" />
								</Badge>
							)}
							{item.isPublic && (
								<Badge
									variant="secondary"
									className="bg-green-500/20 text-green-500"
								>
									<Share2 className="h-3 w-3" />
								</Badge>
							)}
						</div>
					</div>

					<div className="flex flex-col flex-1 p-3 gap-2">
						<div className="flex items-start justify-between gap-2">
							<h3 className="text-sm font-medium leading-tight truncate">
								{item.name}
							</h3>
							{metadata?.generation && (
								<Badge
									variant="outline"
									className={cn(
										"text-[10px] h-5 px-1.5 shrink-0",
										metadata.generation.type === "stable-diffusion" &&
											"bg-blue-500/10 text-blue-500",
										metadata.generation.type === "comfyui" &&
											"bg-green-500/10 text-green-500",
										metadata.generation.type === "midjourney" &&
											"bg-purple-500/10 text-purple-500"
									)}
								>
									<Wand2 className="h-3 w-3 mr-1" />
									<span className="truncate">
										{metadata.generation.type === "stable-diffusion" ?
											"SD"
										: metadata.generation.type === "comfyui" ?
											"ComfyUI"
										: metadata.generation.type === "midjourney" ?
											"MJ"
										:	metadata.generation.type}
									</span>
								</Badge>
							)}
						</div>

						<div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-muted-foreground">
							<div className="flex items-center gap-1">
								<HardDrive className="h-3 w-3" />
								<span>{formatBytes(item.size)}</span>
							</div>
							{metadata?.dimensions && (
								<div className="flex items-center gap-1">
									<Maximize2 className="h-3 w-3" />
									<span>
										{metadata.dimensions.width} × {metadata.dimensions.height}
									</span>
								</div>
							)}
							<div className="flex items-center gap-1">
								<Calendar className="h-3 w-3" />
								<span>{new Date(item.createdAt).toLocaleDateString()}</span>
							</div>
							{metadata?.colorSpace && (
								<div className="flex items-center gap-1">
									<Palette className="h-3 w-3" />
									<span>{metadata.colorSpace}</span>
								</div>
							)}
						</div>

						<div className="flex flex-col gap-1.5 mt-auto">
							{item.tags?.length > 0 && (
								<div className="flex flex-wrap gap-1">
									{item.tags.slice(0, 3).map((tag) => (
										<Badge
											key={tag.id}
											variant="secondary"
											className="text-[10px] h-4 px-1"
										>
											{tag.name}
										</Badge>
									))}
									{item.tags.length > 3 && (
										<Badge variant="secondary" className="text-[10px] h-4 px-1">
											+{item.tags.length - 3}
										</Badge>
									)}
								</div>
							)}

							<div className="flex flex-wrap gap-1">
								{item.collections?.length > 0 && (
									<Badge
										variant="outline"
										className="text-[10px] h-4 px-1 flex items-center gap-1"
									>
										<BookImage className="h-2.5 w-2.5" />
										<span>{item.collections.length}</span>
									</Badge>
								)}
								{item.albums?.length > 0 && (
									<Badge
										variant="outline"
										className="text-[10px] h-4 px-1 flex items-center gap-1"
									>
										<Camera className="h-2.5 w-2.5" />
										<span>{item.albums.length}</span>
									</Badge>
								)}
								{item.characters?.length > 0 && (
									<Badge
										variant="outline"
										className="text-[10px] h-4 px-1 flex items-center gap-1"
									>
										<User2 className="h-2.5 w-2.5" />
										<span>{item.characters.length}</span>
									</Badge>
								)}
								{item.places?.length > 0 && (
									<Badge
										variant="outline"
										className="text-[10px] h-4 px-1 flex items-center gap-1"
									>
										<MapPin className="h-2.5 w-2.5" />
										<span>{item.places.length}</span>
									</Badge>
								)}
								{item.objects?.length > 0 && (
									<Badge
										variant="outline"
										className="text-[10px] h-4 px-1 flex items-center gap-1"
									>
										<Box className="h-2.5 w-2.5" />
										<span>{item.objects.length}</span>
									</Badge>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</FileContextMenu>
	);
});
