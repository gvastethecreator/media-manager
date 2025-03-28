'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { FileItem } from '@/types/file-item';
import {
	BookImage,
	Box,
	Calendar,
	Camera,
	HardDrive,
	Heart,
	ImageIcon,
	MapPin,
	Maximize2,
	Palette,
	Share2,
	User2,
	Wand2,
} from 'lucide-react';
import type * as React from 'react';
import { memo, useCallback, useMemo, useRef } from 'react';
import type { ContextMenuAction } from '../context-menu/context-menu';
import { FileContextMenu } from '../context-menu/context-menu';
import { ImageRenderer } from '../image-renderer';

interface CardsViewProps {
	item: FileItem;
	itemSize: number;
	isSelected?: boolean;
	isScrolling?: boolean;
	shouldLoad?: boolean;
	thumbnail?: string | null;
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

export const CardsView = memo(function CardsView({
	item,
	itemSize,
	isSelected,
	isScrolling,
	shouldLoad,
	thumbnail,
	onClick,
	onDoubleClick,
	onContextAction,
	style,
}: CardsViewProps) {
	const buttonRef = useRef<HTMLButtonElement>(null);

	const metadata = useMemo(() => getMetadata(item.metadata), [item.metadata]);

	const imageHeight = useMemo(() => {
		if (metadata?.dimensions) {
			return Math.min(itemSize / (metadata.dimensions.width / metadata.dimensions.height), itemSize * 0.6);
		}
		return itemSize * 0.5;
	}, [metadata, itemSize]);

	const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onClick?.(item);
		}
	}, [onClick, item]);

	const handleClick = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		onClick?.(item);
	}, [onClick, item]);

	const handleDoubleClick = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		onDoubleClick?.(item);
	}, [onDoubleClick, item]);

	const handleContextAction = useCallback(
		(action: ContextMenuAction, data?: Record<string, unknown>) => {
			onContextAction?.(action, item, data);
		},
		[onContextAction, item]
	);

	const buttonClassName = useMemo(() => cn(
		'relative w-full h-full bg-card rounded-lg border shadow-xs overflow-hidden group hover:shadow-md transition-all duration-200 text-left',
		isSelected && 'ring-2 ring-primary',
		isScrolling && 'opacity-50'
	), [isSelected, isScrolling]);

	const ImageContent = useMemo(() => {
		return shouldLoad && thumbnail ? (
			<div className="relative w-full h-full">
				<div
					className="absolute inset-0 bg-cover bg-center blur-xs opacity-30 brightness-50"
					style={{
						backgroundImage: `url(${thumbnail})`,
					}}
				/>
				<ImageRenderer
					src={thumbnail}
					alt={item.name}
					width={metadata?.dimensions?.width}
					height={metadata?.dimensions?.height}
					className={cn('h-full w-full object-contain transition-all duration-200', 'group-hover:scale-[1.02]')}
					quality={75}
				/>
			</div>
		) : (
			<div className="flex items-center justify-center h-full bg-muted">
				<ImageIcon className="h-8 w-8 text-muted-foreground/50" />
			</div>
		);
	}, [shouldLoad, thumbnail, item.name, metadata?.dimensions?.width, metadata?.dimensions?.height]);

	const StatusBadges = useMemo(() => (
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
		</div>
	), [item.isFavorite, item.isPublic]);

	const GenerationBadge = useMemo(() => {
		if (!metadata?.generation) return null;

		return (
			<Badge
				variant="outline"
				className={cn(
					'text-[10px] h-5 px-1.5 shrink-0',
					metadata.generation.type === 'stable-diffusion' && 'bg-blue-500/10 text-blue-500',
					metadata.generation.type === 'comfyui' && 'bg-green-500/10 text-green-500',
					metadata.generation.type === 'midjourney' && 'bg-purple-500/10 text-purple-500'
				)}
			>
				<Wand2 className="h-3 w-3 mr-1" />
				<span className="truncate">
					{metadata.generation.type === 'stable-diffusion'
						? 'SD'
						: metadata.generation.type === 'comfyui'
							? 'ComfyUI'
							: metadata.generation.type === 'midjourney'
								? 'MJ'
								: metadata.generation.type}
				</span>
			</Badge>
		);
	}, [metadata?.generation]);

	const MetadataInfo = useMemo(() => (
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
	), [item.size, item.createdAt, metadata?.dimensions, metadata?.colorSpace]);

	const TagsDisplay = useMemo(() => {
		if (!item.tags?.length) return null;

		return (
			<div className="flex flex-wrap gap-1">
				{item.tags.slice(0, 3).map((tag) => (
					<Badge key={tag.id} variant="secondary" className="text-[10px] h-4 px-1">
						{tag.name}
					</Badge>
				))}
				{item.tags.length > 3 && (
					<Badge variant="secondary" className="text-[10px] h-4 px-1">
						+{item.tags.length - 3}
					</Badge>
				)}
			</div>
		);
	}, [item.tags]);

	const CollectionBadges = useMemo(() => (
		<div className="flex flex-wrap gap-1">
			{item.collections?.length > 0 && (
				<Badge variant="outline" className="text-[10px] h-4 px-1 flex items-center gap-1">
					<BookImage className="h-2.5 w-2.5" />
					<span>{item.collections.length}</span>
				</Badge>
			)}
			{item.albums?.length > 0 && (
				<Badge variant="outline" className="text-[10px] h-4 px-1 flex items-center gap-1">
					<Camera className="h-2.5 w-2.5" />
					<span>{item.albums.length}</span>
				</Badge>
			)}
			{item.characters?.length > 0 && (
				<Badge variant="outline" className="text-[10px] h-4 px-1 flex items-center gap-1">
					<User2 className="h-2.5 w-2.5" />
					<span>{item.characters.length}</span>
				</Badge>
			)}
			{item.places?.length > 0 && (
				<Badge variant="outline" className="text-[10px] h-4 px-1 flex items-center gap-1">
					<MapPin className="h-2.5 w-2.5" />
					<span>{item.places.length}</span>
				</Badge>
			)}
			{item.worldItems?.length > 0 && (
				<Badge variant="outline" className="text-[10px] h-4 px-1 flex items-center gap-1">
					<Box className="h-2.5 w-2.5" />
					<span>{item.worldItems.length}</span>
				</Badge>
			)}
		</div>
	), [
		item.collections?.length,
		item.albums?.length,
		item.characters?.length,
		item.places?.length,
		item.worldItems?.length
	]);

	return (
		<FileContextMenu file={item} onAction={handleContextAction}>
			<button
				ref={buttonRef}
				type="button"
				className={buttonClassName}
				style={style}
				onClick={handleClick}
				onDoubleClick={handleDoubleClick}
				onKeyDown={handleKeyDown}
				aria-pressed={isSelected}
			>
				<div className="flex flex-col h-full">
					<div
						className="relative overflow-hidden"
						style={{ height: imageHeight }}
					>
						{ImageContent}
						{StatusBadges}
					</div>

					<div className="flex flex-col flex-1 p-3 gap-2">
						<div className="flex items-start justify-between gap-2">
							<h3 className="text-sm font-medium leading-tight truncate">{item.name}</h3>
							{GenerationBadge}
						</div>

						{MetadataInfo}

						<div className="flex flex-col gap-1.5 mt-auto">
							{TagsDisplay}
							{CollectionBadges}
						</div>
					</div>
				</div>
			</button>
		</FileContextMenu>
	);
});
