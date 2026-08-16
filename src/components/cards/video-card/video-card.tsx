import React, { memo, useState } from 'react';
import { cn } from '@/lib/utils';

export interface VideoCardProps extends React.HTMLAttributes<HTMLDivElement> {
	className?: string;
	compact?: boolean;
	isSelected?: boolean;
	tcgMode?: boolean;
	video: any;
}

export const VideoCard = memo(function VideoCard({ video, className, onClick, compact, ...rest }: VideoCardProps) {
	const [hasError, setHasError] = useState(false);
	const thumb = (video as any)?.thumbnailUrl || `/api/videos/${encodeURIComponent(video?.id)}/thumbnail`;

	const handleError = () => {
		setHasError(true);
	};

	const renderThumbnail = () => (
		<div className="w-full bg-muted" style={{ aspectRatio: compact ? '16 / 9' : '4 / 3' }}>
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
						<path d="m22 8-6 4 6 4V8Z" />
						<rect height="12" rx="2" ry="2" width="14" x="2" y="6" />
					</svg>
				</div>
			) : (
				<img
					alt={video?.name || 'Video'}
					className="h-full w-full object-cover"
					height="150"
					loading="lazy"
					onError={handleError}
					src={thumb}
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
				type="button"
			>
				{renderThumbnail()}
				<div className="truncate p-2 font-medium text-sm">{video?.name || 'Video'}</div>
			</button>
		);
	}

	return (
		<div
			className={cn('overflow-hidden rounded-md border bg-card text-card-foreground shadow-sm', className)}
			{...rest}
		>
			{renderThumbnail()}
			<div className="truncate p-2 font-medium text-sm">{video?.name || 'Video'}</div>
		</div>
	);
});

export default VideoCard;
