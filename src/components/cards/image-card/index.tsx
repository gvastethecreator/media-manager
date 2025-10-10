import React, { memo } from 'react';
import { cn } from '@/lib/utils';

// Componente mínimo para cubrir el contrato usado por EntityCard y MixedView
export type ImageCardVariant = 'default' | 'minimal' | 'polaroid' | 'tcg';

export interface ImageCardProps extends React.HTMLAttributes<HTMLDivElement> {
	imageId: string;
	variant?: ImageCardVariant;
	aspectRatio?: string;
	showRelations?: boolean;
	showTags?: boolean;
	tcgMode?: boolean;
	thumbnailQuality?: 'low' | 'medium' | 'high';
	className?: string;
}

export const ImageCard = memo(function ImageCard({ imageId, className, onClick, onDoubleClick, ...rest }: ImageCardProps) {
	const thumbnailUrl = `/api/images/${encodeURIComponent(imageId)}/thumbnail`;
	if (onClick) {
		return (
			<button
				className={cn('overflow-hidden rounded-md border bg-card text-card-foreground shadow-sm', className)}
				onClick={onClick as any}
				// onDoubleClick en button requiere handler compatible, casteamos si viene de props de div
				onDoubleClick={onDoubleClick as any}
				type="button"
			>
				<div className="w-full bg-muted" style={{ aspectRatio: '1 / 1' }}>
					<img alt={`Imagen ${imageId}`} className="h-full w-full object-cover" loading="lazy" src={thumbnailUrl} />
				</div>
			</button>
		);
	}

	return (
		<div
			className={cn('overflow-hidden rounded-md border bg-card text-card-foreground shadow-sm', className)}
			{...rest}
		>
			<div className="w-full bg-muted" style={{ aspectRatio: '1 / 1' }}>
				<img alt={`Imagen ${imageId}`} className="h-full w-full object-cover" loading="lazy" src={thumbnailUrl} />
			</div>
		</div>
	);
});

export default ImageCard;
