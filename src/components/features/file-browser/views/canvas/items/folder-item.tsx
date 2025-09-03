import { MediaThumbnail } from '../../../components/media-thumbnail';
import { BaseItem, type BaseItemProps, getFallbackContent } from './base-item';

export interface FolderItemProps extends BaseItemProps {
	/** Mostrar número de items en la carpeta */
	showItemCount?: boolean;
}

export function FolderItem({ item, size, showItemCount = true, ...baseProps }: FolderItemProps) {
	const { icon, bgColor } = getFallbackContent(item);

	return (
		<BaseItem item={item} size={size} {...baseProps}>
			<div className="relative h-full w-full overflow-hidden rounded-lg">
				{/* Usar MediaThumbnail para mostrar el preview compuesto de la carpeta */}
				<MediaThumbnail
					item={item}
					width={size}
					height={size}
					className="h-full w-full object-cover"
				/>

				{/* Overlay con información de la carpeta */}
				<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2">
					<p className="truncate font-medium text-white text-xs">{item.name}</p>

					{showItemCount && typeof item.totalItems === 'number' && (
						<p className="text-gray-200 text-xs">
							{item.totalItems} {item.totalItems === 1 ? 'item' : 'items'}
						</p>
					)}
				</div>
			</div>
		</BaseItem>
	);
}
