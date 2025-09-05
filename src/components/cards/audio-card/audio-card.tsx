import React from 'react';
import { cn } from '@/lib/utils';

export interface AudioCardProps extends React.HTMLAttributes<HTMLDivElement> {
	audio: any;
	className?: string;
}

export function AudioCard({ audio, className, onClick, ...rest }: AudioCardProps) {
	if (onClick) {
		return (
			<button
				className={cn('overflow-hidden rounded-md border bg-card text-card-foreground shadow-sm', className)}
				onClick={onClick as any}
				type="button"
			>
				<div className="flex h-28 items-center justify-center bg-muted">
					<span className="text-muted-foreground text-sm">{audio?.format?.toUpperCase() || 'AUDIO'}</span>
				</div>
				<div className="truncate p-2 font-medium text-sm">{audio?.name || 'Audio'}</div>
			</button>
		);
	}

	return (
		<div
			className={cn('overflow-hidden rounded-md border bg-card text-card-foreground shadow-sm', className)}
			{...rest}
		>
			<div className="flex h-28 items-center justify-center bg-muted">
				<span className="text-muted-foreground text-sm">{audio?.format?.toUpperCase() || 'AUDIO'}</span>
			</div>
			<div className="truncate p-2 font-medium text-sm">{audio?.name || 'Audio'}</div>
		</div>
	);
}

export default AudioCard;
