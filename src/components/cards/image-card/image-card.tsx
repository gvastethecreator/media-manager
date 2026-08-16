import React, { memo, useState } from 'react';
import { cn } from '@/lib/utils';

// Componente mínimo para cubrir el contrato usado por EntityCard y MixedView
export type ImageCardVariant = 'default' | 'minimal' | 'polaroid' | 'tcg';

export interface ImageCardProps extends React.HTMLAttributes<HTMLDivElement> {
	aspectRatio?: string;
	className?: string;
	imageId: string;
	showRelations?: boolean;
	showTags?: boolean;
	tcgMode?: boolean;
	thumbnailQuality?: 'low' | 'medium' | 'high';
	thumbnailUrl?: string;
	variant?: ImageCardVariant;
}

export const ImageCard = memo(function ImageCard({
	imageId,
	thumbnailUrl: propThumbnailUrl,
	className,
	onClick,
	onDoubleClick,
	...rest
}: ImageCardProps) {
	const [hasError, setHasError] = useState(false);

	// Usar thumbnailUrl si se proporciona, de lo contrario construir la URL
	const thumbnailUrl = propThumbnailUrl || `/api/images/${encodeURIComponent(imageId)}/thumbnail`;

	const handleError = () => {
		setHasError(true);
	};

	const renderContent = () => (
		<div className="w-full bg-muted" style={{ aspectRatio: '1 / 1' }}>
			{hasError ? (
				<div className="flex h-full w-full items-center justify-center bg-muted">
					<svg
						className="text-muted-foreground"
						fill="none"
						height="24"
						stroke="currentColor"
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						viewBox="0 0 24 24"
						width="24"
						xmlns="http://www.w3.org/2000/svg"
					>
						<rect height="18" rx="2" ry="2" width="18" x="3" y="3" />
						<circle cx="9" cy="9" r="2" />
						<path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
					</svg>
				</div>
			) : (
				<img
					alt={`Image ${imageId}`}
					className="h-full w-full object-cover"
					height="200"
					loading="lazy"
					onError={handleError}
					src={thumbnailUrl}
					width="200"
				/>
			)}
		</div>
	);

	if (onClick) {
		return (
			<button
				className={cn('overflow-hidden rounded-md border bg-card text-card-foreground shadow-sm', className)}
				onClick={onClick as any}
				onDoubleClick={onDoubleClick as any}
				type="button"
			>
				{renderContent()}
			</button>
		);
	}

	return (
		<div
			className={cn('overflow-hidden rounded-md border bg-card text-card-foreground shadow-sm', className)}
			{...rest}
		>
			{renderContent()}
		</div>
	);
});

export default ImageCard;
