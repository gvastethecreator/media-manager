import { BaseItem, type BaseItemProps, getFallbackContent, getThumbnailUrl } from './base-item';

export interface VideoItemProps extends BaseItemProps {
	/** Mostrar resolución del video */
	showResolution?: boolean;
}

export function VideoItem({ item, size, showResolution = false, ...baseProps }: VideoItemProps) {
	const thumbnailUrl = getThumbnailUrl(item, size);
	const { icon, bgColor } = getFallbackContent(item);

	return (
		<BaseItem item={item} size={size} {...baseProps}>
			<div className="relative h-full w-full overflow-hidden rounded-lg">
				{thumbnailUrl ? (
					<img alt={item.name} className="h-full w-full object-cover" loading="lazy" src={thumbnailUrl} />
				) : (
					<div className={`flex h-full w-full items-center justify-center ${bgColor}`}>
						<span className="text-4xl">{icon}</span>
					</div>
				)}

				{/* Indicador de play */}
				<div className="absolute inset-0 flex items-center justify-center">
					<div className="rounded-full bg-black/50 p-3 transition-transform hover:scale-110">
						<div className="ml-1 h-0 w-0 border-y-8 border-y-transparent border-l-12 border-l-white" />
					</div>
				</div>

				{/* Overlay con información */}
				<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2">
					<p className="truncate font-medium text-white text-xs">{item.name}</p>

					{showResolution && item.width && item.height && (
						<div className="flex items-center justify-between text-gray-200 text-xs">
							<span>
								{item.width}×{item.height}
							</span>
						</div>
					)}
				</div>
			</div>
		</BaseItem>
	);
}
