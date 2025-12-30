import { BaseItem, type BaseItemProps, getFallbackContent, getThumbnailUrl } from './base-item';

export interface DocumentItemProps extends BaseItemProps {
	/** Mostrar tipo de documento */
	showDocumentType?: boolean;
}

export function DocumentItem({ item, size, showDocumentType = true, ...baseProps }: DocumentItemProps) {
	const thumbnailUrl = getThumbnailUrl(item, size);
	const { icon, bgColor } = getFallbackContent(item);

	const getDocumentType = (mimeType?: string | null, name?: string): string => {
		if (mimeType?.includes('pdf')) return 'PDF';
		if (name?.endsWith('.doc') || name?.endsWith('.docx')) return 'Word';
		if (name?.endsWith('.xls') || name?.endsWith('.xlsx')) return 'Excel';
		if (name?.endsWith('.ppt') || name?.endsWith('.pptx')) return 'PowerPoint';
		if (name?.endsWith('.txt')) return 'Text';
		if (name?.endsWith('.md')) return 'Markdown';
		return 'DOC';
	};

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

				{/* Indicador de tipo de documento */}
				{showDocumentType && (
					<div className="absolute top-2 right-2">
						<div className="rounded bg-yellow-500 px-1 py-0.5 text-white text-xs">
							{getDocumentType(item.mimeType, item.name)}
						</div>
					</div>
				)}

				{/* Overlay con información */}
				<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2">
					<p className="truncate font-medium text-white text-xs">{item.name}</p>

					{item.size && <p className="text-gray-200 text-xs">{(item.size / 1024).toFixed(1)} KB</p>}
				</div>
			</div>
		</BaseItem>
	);
}
