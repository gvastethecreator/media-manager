import React, { memo } from 'react';
import { cn } from '@/lib/utils';

export interface UploadedImageCardProps extends React.HTMLAttributes<HTMLDivElement> {
	className?: string;
	uploadedImage: any;
}

export const UploadedImageCard = memo(function UploadedImageCard({
	uploadedImage,
	className,
	onClick,
	...rest
}: UploadedImageCardProps) {
	const thumb =
		uploadedImage?.thumbnailUrl ||
		(uploadedImage?.imageId ? `/api/images/${uploadedImage.imageId}/thumbnail` : undefined);
	if (onClick) {
		return (
			<button
				className={cn('overflow-hidden rounded-md border bg-card text-card-foreground shadow-sm', className)}
				onClick={onClick as any}
				type="button"
			>
				<div className="w-full bg-muted" style={{ aspectRatio: '1 / 1' }}>
					{thumb ? (
						<img
							alt={uploadedImage?.name || 'Imagen subida'}
							className="h-full w-full object-cover"
							loading="lazy"
							src={thumb}
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm">
							Sin thumbnail
						</div>
					)}
				</div>
				<div className="truncate p-2 font-medium text-sm">{uploadedImage?.name || 'Imagen'}</div>
			</button>
		);
	}

	return (
		<div
			className={cn('overflow-hidden rounded-md border bg-card text-card-foreground shadow-sm', className)}
			{...rest}
		>
			<div className="w-full bg-muted" style={{ aspectRatio: '1 / 1' }}>
				{thumb ? (
					<img
						alt={uploadedImage?.name || 'Imagen subida'}
						className="h-full w-full object-cover"
						loading="lazy"
						src={thumb}
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm">
						Sin thumbnail
					</div>
				)}
			</div>
			<div className="truncate p-2 font-medium text-sm">{uploadedImage?.name || 'Imagen'}</div>
		</div>
	);
});

export default UploadedImageCard;
