"use client";

import { memo } from "react";
import { FileItem } from "@/types/file-item";
import { cn } from "@/lib/utils";
import { ImageRenderer } from "../image-renderer";
import { FileContextMenu } from "../context-menu";
import { Badge } from "@/components/ui/badge";
import { Star, ImageIcon } from "lucide-react";
import type { ContextMenuAction } from "../context-menu";

interface GridViewProps {
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

export const GridView = memo(function GridView({
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
}: GridViewProps) {
	return (
		<FileContextMenu file={item} onAction={onContextAction || (() => {})}>
			<div
				className={cn(
					"relative w-full h-full group",
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
				<div className="w-full h-full bg-muted/30 rounded-sm">
					{shouldLoad && thumbnail ?
						<div className="relative w-full h-full p-2">
							<div
								className="absolute inset-0 bg-cover bg-center blur-lg opacity-80 brightness-20"
								style={{
									backgroundImage: `url(${thumbnail})`,
								}}
							/>
							<ImageRenderer
								src={thumbnail}
								alt={item.name}
								objectFit="contain"
								className={cn(
									"h-full w-full rounded-sm transition-transform duration-200",
									"group-hover:scale-105"
								)}
							/>
						</div>
					:	<div className="flex items-center justify-center h-full">
							<ImageIcon className="h-8 w-8 text-muted-foreground/50 animate-pulse" />
						</div>
					}
				</div>
				{item.isFavorite && (
					<div className="absolute top-2 right-2">
						<Star className="h-4 w-4 text-yellow-500 fill-current drop-shadow-lg shadow-black" />
					</div>
				)}
			</div>
		</FileContextMenu>
	);
});
