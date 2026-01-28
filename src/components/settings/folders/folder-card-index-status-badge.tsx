import { AlertCircle, CircleAlert, CircleCheckBig, CircleDashed, TimerReset } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SimpleTooltip } from './common/simple-tooltip';
import { formatRelativeDate } from './utils/folder-helpers';

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
				return (
					<CircleCheckBig className="h-3 w-3 text-success">
						<title>Indexado</title>
					</CircleCheckBig>
				);
			case 'outdated':
				return (
					<TimerReset className="h-3 w-3 text-warning">
						<title>Desactualizado</title>
					</TimerReset>
				);
			case 'pending':
				return (
					<CircleDashed className="h-3 w-3 text-muted-foreground">
						<title>Pendiente</title>
					</CircleDashed>
				);
			case 'not_found':
				return (
					<CircleAlert className="h-3 w-3 text-destructive">
						<title>No encontrado</title>
					</CircleAlert>
				);
			case 'error':
				return (
					<AlertCircle className="h-3 w-3 text-destructive">
						<title>Error</title>
					</AlertCircle>
				);
			default:
				return (
					<CircleDashed className="h-3 w-3 text-muted-foreground">
						<title>Pendiente</title>
					</CircleDashed>
				);
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
			default:
				return 'Pendiente';
		}
	};

	const formatDate = (date: Date) => formatRelativeDate(date);

	let tooltipContent: string;
	if (status === 'not_found') {
		tooltipContent = 'Carpeta no encontrada en el sistema';
	} else if (status === 'error') {
		tooltipContent = 'Error en la carpeta';
	} else if (lastIndexed) {
		tooltipContent = `Última indexación: ${formatDate(lastIndexed)} (${lastIndexed.toLocaleTimeString()})`;
	} else {
		tooltipContent = 'Nunca indexado';
	}

	return (
		<SimpleTooltip align="center" className="text-xs" content={tooltipContent} side="top">
			<Badge
				className={cn(
					'flex h-4 items-center gap-1 px-2 text-[10px]',
					status === 'indexed' && 'border-ui-success-border bg-ui-success text-ui-success-text',
					status === 'outdated' && 'border-ui-warning-border bg-ui-warning text-ui-warning-text',
					status === 'pending' && 'border-muted bg-muted/30 text-muted-foreground',
					(status === 'not_found' || status === 'error') && 'border-destructive/30 bg-destructive/10 text-destructive',
					className
				)}
				variant="outline"
			>
				{getStatusIcon()}
				{getStatusLabel()}
			</Badge>
		</SimpleTooltip>
	);
}
