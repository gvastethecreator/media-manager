'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/utils';
import type { FileItem } from '@/types/file-item';
import { HardDrive, Heart, ImageIcon, Palette, Share2, Wand2 } from 'lucide-react';
import type * as React from 'react';
import { memo } from 'react';
import { FileContextMenu } from '../context-menu/context-menu';
import type { ContextMenuAction } from '../context-menu/context-menu';
import { ImageRenderer } from '../image-renderer';

interface MasonryViewProps {
	item: FileItem;
	isSelected?: boolean;
	isScrolling?: boolean;
	shouldLoad?: boolean;
	thumbnail?: string | null;
	isHovered?: boolean;
	onClick?: (item: FileItem) => void;
	onDoubleClick?: (item: FileItem) => void;
	onContextAction?: (action: ContextMenuAction, item: FileItem, data?: Record<string, unknown>) => void;
	style?: React.CSSProperties;
}

const getMetadata = (metadata: string | null) => {
	if (!metadata) {
		return null;
	}
	try {
		return JSON.parse(metadata);
	} catch {
		return null;
	}
};

function formatBytes(bytes: number): string {
	if (bytes === 0) {
		return '0 B';
	}
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

export const MasonryView = memo(function MasonryView({
	item,
	isSelected,
	isScrolling,
	shouldLoad,
	thumbnail,
	isHovered,
	onClick,
	onDoubleClick,
	onContextAction,
	style,
}: MasonryViewProps) {
	const metadata = getMetadata(item.metadata);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onClick?.(item);
		}
	};

	return (
		<FileContextMenu file={item} onAction={onContextAction || (() => {})}>
			<button
				type="button"
				className={cn(
					'relative w-full h-full overflow-hidden group text-left',
					isSelected && 'ring-2 ring-primary ring-offset-2',
					isScrolling && 'opacity-50'
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
				{shouldLoad && thumbnail ? (
					<div className="relative w-full h-full">
						<ImageRenderer
							src={thumbnail}
							alt={item.name}
							width={metadata?.dimensions?.width}
							height={metadata?.dimensions?.height}
							className={cn(
								'w-full h-full object-cover rounded-sm transition-all duration-200',
								'group-hover:scale-[1.02]'
							)}
							quality={75}
						/>
						<div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
					</div>
				) : (
					<div className="flex items-center justify-center h-full bg-muted/50 rounded-sm">
						<ImageIcon className="h-8 w-8 text-muted-foreground/50" />
					</div>
				)}

				<div className="absolute top-2 right-2 flex gap-1">
					{item.isFavorite && (
						<Badge variant="secondary" className="bg-red-500/20 text-red-500">
							<Heart className="h-3 w-3 fill-current" />
						</Badge>
					)}
					{item.isPublic && (
						<Badge variant="secondary" className="bg-green-500/20 text-green-500">
							<Share2 className="h-3 w-3" />
						</Badge>
					)}
					{metadata?.generation && (
						<Badge
							variant="secondary"
							className={cn(
								'text-[10px] h-5 px-1',
								metadata.generation.type === 'stable-diffusion' && 'bg-blue-500/20 text-blue-500',
								metadata.generation.type === 'comfyui' && 'bg-green-500/20 text-green-500',
								metadata.generation.type === 'midjourney' && 'bg-purple-500/20 text-purple-500'
							)}
						>
							<Wand2 className="h-3 w-3" />
						</Badge>
					)}
				</div>

				<div
					className={cn(
						'absolute inset-x-0 bottom-0 p-2 flex flex-col gap-1.5 transition-all duration-200',
						isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
					)}
				>
					<div className="flex items-start justify-between gap-2">
						<p className="text-xs text-white font-medium truncate flex-1 drop-shadow-sm">{item.name}</p>
						{metadata?.dimensions && (
							<span className="text-[10px] text-white/90 font-medium drop-shadow-sm">
								{metadata.dimensions.width} × {metadata.dimensions.height}
							</span>
						)}
					</div>

					<div className="flex flex-wrap gap-1">
						{item.tags?.slice(0, 3).map((tag) => (
							<Badge key={tag.id} variant="secondary" className="text-[10px] h-4 px-1 bg-white/10 text-white/90">
								{tag.name}
							</Badge>
						))}
						{item.tags?.length > 3 && (
							<Badge variant="secondary" className="text-[10px] h-4 px-1 bg-white/10 text-white/90">
								+{item.tags.length - 3}
							</Badge>
						)}
					</div>

					<div className="flex items-center gap-1 text-[10px] text-white/70">
						<div className="flex items-center gap-1">
							<HardDrive className="h-2.5 w-2.5" />
							<span>{formatBytes(item.size)}</span>
						</div>
						{metadata?.colorSpace && (
							<>
								<span>•</span>
								<div className="flex items-center gap-1">
									<Palette className="h-2.5 w-2.5" />
									<span>{metadata.colorSpace}</span>
								</div>
							</>
						)}
					</div>
				</div>
			</button>
		</FileContextMenu>
	);
});
