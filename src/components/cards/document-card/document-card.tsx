import React from 'react';
import { cn } from '@/lib/utils';

export interface DocumentCardProps extends React.HTMLAttributes<HTMLDivElement> {
	document: any;
	className?: string;
}

export function DocumentCard({ document, className, onClick, ...rest }: DocumentCardProps) {
	if (onClick) {
		return (
			<button
				className={cn('overflow-hidden rounded-md border bg-card text-card-foreground shadow-sm', className)}
				onClick={onClick as any}
				type="button"
			>
				<div className="flex h-28 items-center justify-center bg-muted">
					<span className="text-muted-foreground text-sm">{document?.extension?.toUpperCase() || 'DOC'}</span>
				</div>
				<div className="truncate p-2 font-medium text-sm">{document?.name || 'Documento'}</div>
			</button>
		);
	}

	return (
		<div
			className={cn('overflow-hidden rounded-md border bg-card text-card-foreground shadow-sm', className)}
			{...rest}
		>
			<div className="flex h-28 items-center justify-center bg-muted">
				<span className="text-muted-foreground text-sm">{document?.extension?.toUpperCase() || 'DOC'}</span>
			</div>
			<div className="truncate p-2 font-medium text-sm">{document?.name || 'Documento'}</div>
		</div>
	);
}

export default DocumentCard;
