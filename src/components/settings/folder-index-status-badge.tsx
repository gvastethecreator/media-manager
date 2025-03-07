'use client';

import { CircleCheckBig, CircleDashed, TimerReset } from 'lucide-react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type IndexStatus = 'indexed' | 'outdated' | 'pending';

interface FolderIndexStatusBadgeProps {
	status: IndexStatus;
	lastIndexed: Date | null;
	className?: string;
}

export function FolderIndexStatusBadge({ status, lastIndexed, className }: FolderIndexStatusBadgeProps) {
	const getStatusIcon = () => {
		switch (status) {
			case 'indexed':
				return <CircleCheckBig className="h-3 w-3 text-green-500" />;
			case 'outdated':
				return <TimerReset className="h-3 w-3 text-amber-500" />;
			case 'pending':
				return <CircleDashed className="h-3 w-3 text-muted-foreground" />;
		}
	};

	const getStatusLabel = () => {
		switch (status) {
			case 'indexed':
				return 'Indexado';
			case 'outdated':
				return 'Desactualizado';
			case 'pending':
				return 'Pendiente';
		}
	};

	const formatDate = (date: Date) => {
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffDays === 0) {
			return 'Hoy';
		}

		if (diffDays === 1) {
			return 'Ayer';
		}

		if (diffDays < 7) {
			return `Hace ${diffDays} días`;
		}

		return date.toLocaleDateString();
	};

	const tooltipContent = lastIndexed
		? `Última indexación: ${formatDate(lastIndexed)} (${lastIndexed.toLocaleTimeString()})`
		: 'Nunca indexado';

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Badge
						variant="outline"
						className={cn(
							'text-[10px] px-2 h-4 flex items-center gap-1',
							status === 'indexed' && 'border-green-200 bg-green-50/30 text-green-600',
							status === 'outdated' && 'border-amber-200 bg-amber-50/30 text-amber-600',
							status === 'pending' && 'border-muted bg-muted/30 text-muted-foreground',
							className
						)}
					>
						{getStatusIcon()}
						{getStatusLabel()}
					</Badge>
				</TooltipTrigger>
				<TooltipContent side="top" align="center" className="text-xs">
					{tooltipContent}
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
