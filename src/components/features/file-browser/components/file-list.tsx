import { useEffect, useState } from 'react';
import { File, FileImage, FileVideo, FileAudio } from 'lucide-react';
import { MediaThumbnail } from './media-thumbnail';
import type { MediaItem } from './media-thumbnail';

// CONFIG local de la vista List (compacta y minimalista)
const CONFIG = {
	rowHeight: 90, // Altura máxima para acomodar thumbnails de 90px
	thumbnailSize: 90, // Thumbnail máximo 90x90px respetando aspect ratio
	increaseViewportBy: { top: 200, bottom: 600 } as { top: number; bottom: number },
};

// Función para obtener el icono apropiado según el tipo de archivo
const getFileIcon = (entityType: MediaItem['entityType']) => {
	switch (entityType) {
		case 'image':
			return FileImage;
		case 'video':
			return FileVideo;
		case 'audio':
			return FileAudio;
		default:
			return File;
	}
};

// Componente compacto para cada item de la lista
function CompactListItem({
	item,
	selected,
	onClick,
	onDoubleClick,
}: {
	item: MediaItem;
	selected: boolean;
	onClick?: (item: MediaItem) => void;
	onDoubleClick?: (item: MediaItem) => void;
}) {
	const IconComponent = getFileIcon(item.entityType);

	return (
		<button
			type="button"
			className={`flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent ${selected ? 'bg-accent font-medium' : ''}`}
			style={{ maxHeight: '90px', height: `${CONFIG.rowHeight}px` }}
			onClick={() => onClick?.(item)}
			onDoubleClick={() => onDoubleClick?.(item)}
		>
			{/* Icono o thumbnail dependiendo del tipo */}
			{item.entityType === 'image' || item.entityType === 'video' ? (
				<MediaThumbnail
					item={item}
					width={CONFIG.thumbnailSize}
					height={CONFIG.thumbnailSize}
					className="flex-shrink-0 rounded border"
					style={{
						objectFit: 'cover',
						maxWidth: `${CONFIG.thumbnailSize}px`,
						maxHeight: `${CONFIG.thumbnailSize}px`,
						width: `${CONFIG.thumbnailSize}px`,
						height: `${CONFIG.thumbnailSize}px`,
					}}
				/>
			) : (
				<IconComponent size={CONFIG.thumbnailSize} className="flex-shrink-0 text-muted-foreground" />
			)}

			{/* Nombre del archivo truncado */}
			<span className="flex-1 truncate font-medium">{item.name}</span>

			{/* Información adicional opcional */}
			{item.width && item.height && (
				<span className="font-mono text-xs text-muted-foreground">
					{item.width}×{item.height}
				</span>
			)}
		</button>
	);
}

interface FileListProps {
	items: MediaItem[];
	selectedIds?: string[];
	onItemClick?: (item: MediaItem) => void;
	onItemDoubleClick?: (item: MediaItem) => void;
}

export function FileList({ items, selectedIds = [], onItemClick, onItemDoubleClick }: FileListProps) {
	const [VirtuosoComp, setVirtuosoComp] = useState<any>(null);

	useEffect(() => {
		let mounted = true;
		import('react-virtuoso')
			.then((mod) => {
				if (!mounted) return;
				const Comp = (mod as any).Virtuoso || null;
				setVirtuosoComp(() => Comp);
			})
			.catch(() => {
				// fallback silencioso
			});
		return () => {
			mounted = false;
		};
	}, []);

	if (VirtuosoComp) {
		return (
			<div style={{ height: '100%' }}>
				<VirtuosoComp
					data={items}
					increaseViewportBy={CONFIG.increaseViewportBy}
					itemContent={(index: number, item: MediaItem) => (
						<CompactListItem
							key={item.id}
							item={item}
							selected={selectedIds.includes(item.id)}
							onClick={onItemClick}
							onDoubleClick={onItemDoubleClick}
						/>
					)}
					style={{ height: '100%' }}
					useWindowScroll={false}
					fixedItemSize={CONFIG.rowHeight}
				/>
			</div>
		);
	}

	// Fallback no virtualizado
	return (
		<div className="flex flex-col gap-1 p-2">
			{items.map((item) => (
				<CompactListItem
					key={item.id}
					item={item}
					selected={selectedIds.includes(item.id)}
					onClick={onItemClick}
					onDoubleClick={onItemDoubleClick}
				/>
			))}
		</div>
	);
}
