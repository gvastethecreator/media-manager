import { BaseItem, type BaseItemProps, getFallbackContent, getThumbnailUrl } from './base-item';

export interface AudioItemProps extends BaseItemProps {
	/** Mostrar waveform simplificada */
	showWaveform?: boolean;
}

export function AudioItem({ item, size, showWaveform = false, ...baseProps }: AudioItemProps) {
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

				{/* Waveform simplificada */}
				{showWaveform && !thumbnailUrl && (
					<div className="absolute inset-0 flex items-center justify-center">
						<div className="flex h-8 items-end space-x-1">
							{Array.from({ length: 12 }).map((_, i) => (
								<div
									className="w-1 bg-green-400 opacity-70"
									key={i}
									style={{
										height: `${Math.random() * 100 + 20}%`,
									}}
								/>
							))}
						</div>
					</div>
				)}

				{/* Indicador de audio */}
				<div className="absolute top-2 left-2">
					<div className="rounded bg-green-500 px-1 py-0.5 text-white text-xs">♪</div>
				</div>

				{/* Overlay con información */}
				<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2">
					<p className="truncate font-medium text-white text-xs">{item.name}</p>

					{item.mimeType && (
						<p className="text-gray-200 text-xs">{item.mimeType.split('/')[1]?.toUpperCase() || 'AUDIO'}</p>
					)}
				</div>
			</div>
		</BaseItem>
	);
}
