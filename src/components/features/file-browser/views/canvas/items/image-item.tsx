import { BaseItem, type BaseItemProps, getFallbackContent, getThumbnailUrl } from './base-item';

export interface ImageItemProps extends BaseItemProps {
	/** Mostrar resolución de la imagen */
	showResolution?: boolean;
	/** Mostrar duración para GIFs animados */
	showDuration?: boolean;
}

export function ImageItem({ item, size, showResolution = false, showDuration = false, ...baseProps }: ImageItemProps) {
	const thumbnailUrl = getThumbnailUrl(item, size);
	const { icon, bgColor } = getFallbackContent(item);

	return (
		<BaseItem item={item} size={size} {...baseProps}>
			<div className="relative h-full w-full overflow-hidden rounded-lg">
				{thumbnailUrl ? (
					<img
						alt={item.name}
						className="h-full w-full object-cover transition-transform duration-200 hover:scale-110"
						loading="lazy"
						src={thumbnailUrl}
					/>
				) : (
					<div className={`flex h-full w-full items-center justify-center ${bgColor}`}>
						<span className="text-4xl">{icon}</span>
					</div>
				)}

				{/* Overlay con información */}
				<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2">
					<p className="truncate font-medium text-white text-xs">{item.name}</p>

					{showResolution && item.width && item.height && (
						<p className="text-gray-200 text-xs">
							{item.width} × {item.height}
						</p>
					)}

					{showDuration && item.entityType === 'image' && (
						<p className="text-gray-200 text-xs">{item.mimeType?.includes('gif') ? 'GIF' : 'Static'}</p>
					)}
				</div>
			</div>
		</BaseItem>
	);
}
