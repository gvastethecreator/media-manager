import { AlertCircle, CircleAlert, CircleCheckBig, CircleDashed, TimerReset } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type IndexStatus = 'indexed' | 'outdated' | 'pending' | 'not_found' | 'error';

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
			case 'not_found':
				return <CircleAlert className="h-3 w-3 text-destructive" />;
			case 'error':
				return <AlertCircle className="h-3 w-3 text-destructive" />;
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
			case 'not_found':
				return 'No encontrado';
			case 'error':
				return 'Error';
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

	const tooltipContent =
		status === 'not_found'
			? 'Carpeta no encontrada en el sistema'
			: status === 'error'
				? 'Error en la carpeta'
				: lastIndexed
					? `Última indexación: ${formatDate(lastIndexed)} (${lastIndexed.toLocaleTimeString()})`
					: 'Nunca indexado';

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Badge
						className={cn(
							'flex h-4 items-center gap-1 px-2 text-[10px]',
							status === 'indexed' && 'border-green-200 bg-green-50/30 text-green-600',
							status === 'outdated' && 'border-amber-200 bg-amber-50/30 text-amber-600',
							status === 'pending' && 'border-muted bg-muted/30 text-muted-foreground',
							(status === 'not_found' || status === 'error') &&
								'border-destructive/30 bg-destructive/10 text-destructive',
							className
						)}
						variant="outline"
					>
						{getStatusIcon()}
						{getStatusLabel()}
					</Badge>
				</TooltipTrigger>
				<TooltipContent align="center" className="text-xs" side="top">
					{tooltipContent}
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
