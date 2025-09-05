import React from 'react';
import { cn } from '@/lib/utils';

export interface VideoCardProps extends React.HTMLAttributes<HTMLDivElement> {
    video: any;
    compact?: boolean;
    tcgMode?: boolean;
    className?: string;
    isSelected?: boolean;
}

export function VideoCard({ video, className, onClick, compact, ...rest }: VideoCardProps) {
    const thumb = (video as any)?.thumbnailUrl || `/api/videos/${encodeURIComponent(video?.id)}/thumbnail`;
    if (onClick) {
        return (
            <button
                className={cn('overflow-hidden rounded-md border bg-card text-card-foreground shadow-sm', className)}
                onClick={onClick as any}
                type="button"
            >
                <div className="w-full bg-muted" style={{ aspectRatio: compact ? '16 / 9' : '4 / 3' }}>
                    <img alt={video?.name || 'Video'} className="h-full w-full object-cover" loading="lazy" src={thumb} />
                </div>
                <div className="truncate p-2 font-medium text-sm">{video?.name || 'Video'}</div>
            </button>
        );
    }

    return (
        <div
            className={cn('overflow-hidden rounded-md border bg-card text-card-foreground shadow-sm', className)}
            {...rest}
        >
            <div className="w-full bg-muted" style={{ aspectRatio: compact ? '16 / 9' : '4 / 3' }}>
                <img alt={video?.name || 'Video'} className="h-full w-full object-cover" loading="lazy" src={thumb} />
            </div>
            <div className="truncate p-2 font-medium text-sm">{video?.name || 'Video'}</div>
        </div>
    );
}

export default VideoCard;
