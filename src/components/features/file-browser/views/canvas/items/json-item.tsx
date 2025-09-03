import { BaseItem, type BaseItemProps, getFallbackContent, getThumbnailUrl } from './base-item';

export interface JsonItemProps extends BaseItemProps {
	/** Mostrar preview del contenido JSON */
	showPreview?: boolean;
}

export function JsonItem({ item, size, showPreview = false, ...baseProps }: JsonItemProps) {
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

				{/* Preview simplificado del JSON */}
				{showPreview && !thumbnailUrl && (
					<div className="absolute inset-2 rounded bg-gray-900 p-2 font-mono text-green-400 text-xs">
						<div className="opacity-60">{'{'}</div>
						<div className="ml-2 opacity-80">"data": ...</div>
						<div className="opacity-60">{'}'}</div>
					</div>
				)}

				{/* Indicador de JSON */}
				<div className="absolute top-2 right-2">
					<div className="rounded bg-purple-500 px-1 py-0.5 text-white text-xs">JSON</div>
				</div>

				{/* Overlay con información */}
				<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2">
					<p className="truncate font-medium text-white text-xs">{item.name}</p>

					{item.size && <p className="text-gray-200 text-xs">{(item.size / 1024).toFixed(1)} KB</p>}
				</div>
			</div>
		</BaseItem>
	);
}
