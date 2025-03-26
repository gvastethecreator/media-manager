'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { FileItem } from '@/types/file-item';
import {
	BookImage,
	Box,
	Calendar,
	Camera,
	File,
	HardDrive,
	Heart,
	MapPin,
	Maximize2,
	Palette,
	Share2,
	User2,
	Wand2,
} from 'lucide-react';
import type * as React from 'react';
import { memo, useEffect, useRef } from 'react';
import type { ContextMenuAction } from '../context-menu/context-menu';
import { FileContextMenu } from '../context-menu/context-menu';
import { ImageRenderer } from '../image-renderer';

interface ListViewProps {
	item: FileItem;
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

export const ListView = memo(function ListView({
	item,
	isSelected,
	isScrolling,
	shouldLoad,
	thumbnail,
	onClick,
	onDoubleClick,
	onContextAction,
	style,
}: ListViewProps) {
	const metadata = getMetadata(item.metadata);
	const buttonRef = useRef<HTMLButtonElement>(null);

	// Añadir logging para depuración
	useEffect(() => {
		// Registrar eventos de contexto
		const button = buttonRef.current;
		if (button) {
			const handleContextMenuNative = (e: MouseEvent) => {
				console.log('Evento contextmenu nativo en ListView para:', item.name);
			};

			button.addEventListener('contextmenu', handleContextMenuNative);
			return () => {
				button.removeEventListener('contextmenu', handleContextMenuNative);
			};
		}
	}, [item]);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onClick?.(item);
		}
	};

	return (
		<FileContextMenu file={item} onAction={onContextAction || (() => { })}>
			<button
				ref={buttonRef}
				type="button"
				className={cn(
					'flex items-center gap-4 w-full hover:bg-accent/50 rounded-sm group px-2 text-left',
					isSelected && 'bg-accent',
					isScrolling && 'opacity-50'
				)}
				style={style}
				onClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					console.log('Click en ListView para:', item.name);
					onClick?.(item);
				}}
				onDoubleClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					console.log('Double click en ListView para:', item.name);
					onDoubleClick?.(item);
				}}
				onKeyDown={handleKeyDown}
				aria-pressed={isSelected}
			>
				<div className="relative h-[72px] aspect-square shrink-0 overflow-hidden rounded-sm">
					{shouldLoad && thumbnail ? (
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
								width={72}
								height={72}
								className={cn('h-full w-full object-cover transition-all duration-200', 'group-hover:scale-[1.02]')}
								quality={75}
							/>
						</div>
					) : (
						<div className="flex items-center justify-center h-full bg-muted">
							<File className="h-4 w-4 text-muted-foreground/50" />
						</div>
					)}
					<div className="absolute top-0.5 right-0.5 flex gap-0.5">
						{item.isFavorite && (
							<Badge variant="secondary" className="bg-red-500/20 text-red-500 h-3 w-3 p-0.5">
								<Heart className="h-2 w-2 fill-current" />
							</Badge>
						)}
						{item.isPublic && (
							<Badge variant="secondary" className="bg-green-500/20 text-green-500 h-3 w-3 p-0.5">
								<Share2 className="h-2 w-2" />
							</Badge>
						)}
					</div>
				</div>

				<div className="flex flex-col min-w-0 flex-1 py-2 gap-1">
					<div className="flex items-center gap-2">
						<p className="text-sm font-medium truncate">{item.name}</p>
						{metadata?.generation && (
							<Badge
								variant="outline"
								className={cn(
									'text-[10px] h-4 px-1 flex items-center gap-1 shrink-0',
									metadata.generation.type === 'stable-diffusion' && 'bg-blue-500/10 text-blue-500',
									metadata.generation.type === 'comfyui' && 'bg-green-500/10 text-green-500',
									metadata.generation.type === 'midjourney' && 'bg-purple-500/10 text-purple-500'
								)}
							>
								<Wand2 className="h-2.5 w-2.5" />
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
						)}
					</div>

					<div className="grid grid-cols-4 gap-x-4 text-xs text-muted-foreground">
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

					<div className="flex items-center gap-2">
						<div className="flex flex-wrap gap-1 max-w-[50%]">
							{item.tags?.slice(0, 2).map((tag) => (
								<Badge key={tag.id} variant="secondary" className="text-[10px] h-4 px-1">
									{tag.name}
								</Badge>
							))}
							{item.tags?.length > 2 && (
								<Badge variant="secondary" className="text-[10px] h-4 px-1">
									+{item.tags.length - 2}
								</Badge>
							)}
						</div>

						<div className="flex items-center gap-1 ml-auto">
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
					</div>
				</div>
			</button>
		</FileContextMenu>
	);
});
