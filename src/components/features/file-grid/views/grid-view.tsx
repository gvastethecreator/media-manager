"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FileItem } from "@/types/file-item";
import { ImageIcon, Star } from "lucide-react";
import type * as React from "react";
import { memo } from "react";
import { FileContextMenu } from "../context-menu/context-menu";
import type { ContextMenuAction } from "../context-menu/context-menu";
import { ImageRenderer } from "../image-renderer";

interface GridViewProps {
	item: FileItem;
	itemSize: number;
	isSelected?: boolean;
	isScrolling?: boolean;
	shouldLoad?: boolean;
	thumbnail?: string | null;
	onClick?: (item: FileItem) => void;
	onDoubleClick?: (item: FileItem) => void;
	onContextAction?: (
		action: ContextMenuAction,
		item: FileItem,
		data?: Record<string, unknown>
	) => void;
	style?: React.CSSProperties;
}

export const GridView = memo(function GridView({
	item,
	// itemSize no se está utilizando actualmente
	isSelected,
	isScrolling,
	shouldLoad,
	thumbnail,
	onClick,
	onDoubleClick,
	onContextAction,
	style,
}: GridViewProps) {
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			onClick?.(item);
		}
	};

	return (
		<FileContextMenu file={item} onAction={onContextAction || (() => {})}>
			<button
				type="button"
				className={cn(
					"relative w-full h-full overflow-hidden group text-left",
					isSelected && "ring-2 ring-primary ring-offset-2",
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
				onKeyDown={handleKeyDown}
				aria-pressed={isSelected}
			>
				<div className="w-full h-full bg-muted/30 rounded-sm">
					{shouldLoad && thumbnail ? (
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
					) : (
						<div className="flex items-center justify-center h-full">
							<ImageIcon className="h-8 w-8 text-muted-foreground/50 animate-pulse" />
						</div>
					)}
				</div>
				{item.isFavorite && (
					<div className="absolute top-2 right-2">
						<Star className="h-4 w-4 text-yellow-500 fill-current drop-shadow-lg shadow-black" />
					</div>
				)}
			</button>
		</FileContextMenu>
	);
});
