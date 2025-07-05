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
			<div className="text-center flex flex-col items-center justify-center max-w-md">
				<Icon className="w-12 h-12 mb-4 opacity-50" />
				<h3 className="text-lg font-medium mb-2">{title}</h3>
				<p className="text-sm text-muted-foreground mb-6">{description}</p>

				{actions && <div className="mt-4">{actions}</div>}
			</div>
		</div>
	);
}
