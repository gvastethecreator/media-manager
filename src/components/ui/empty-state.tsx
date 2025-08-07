import type { LucideIcon } from 'lucide-react';
import React from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
	icon: LucideIcon;
	title: string;
	description: string;
	className?: string;
	actions?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, className, actions }: EmptyStateProps) {
	return (
		<div className={cn('flex flex-col items-center justify-center py-12 text-muted-foreground', className)}>
			<div className="flex max-w-md flex-col items-center justify-center text-center">
				<Icon className="mb-4 h-12 w-12 opacity-50" />
				<h3 className="mb-2 font-medium text-lg">{title}</h3>
				<p className="mb-6 text-muted-foreground text-sm">{description}</p>

				{actions && <div className="mt-4">{actions}</div>}
			</div>
		</div>
	);
}
