/**
 * @file Header para TaskCard
 * @module components/cards/task-card
 */

import { Archive, CheckCircle2, Circle, Clock, Star, XCircle } from 'lucide-react';
import { CardHeader } from '@/components/cards/card-header';
import { cn } from '@/lib/utils';
import type { TaskCardHeaderProps } from './task-card.types';

// Iconos por status
const STATUS_ICONS = {
	pending: Circle,
	in_progress: Clock,
	completed: CheckCircle2,
	cancelled: XCircle,
} as const;

// Labels por status
const STATUS_LABELS = {
	pending: 'Pendiente',
	in_progress: 'En Progreso',
	completed: 'Completado',
	cancelled: 'Cancelado',
} as const;

// Colores por priority
const PRIORITY_COLORS = {
	low: 'var(--dt-neutral-500)',
	medium: 'var(--dt-warning-500)',
	high: 'var(--dt-warning-600)',
	urgent: 'var(--dt-danger-500)',
} as const;

export function TaskCardHeader({
	title,
	emoji,
	status,
	priority,
	isFavorite,
	isArchived,
	primaryColor,
	tcgMode,
	onToggleFavorite,
	onToggleArchive,
}: TaskCardHeaderProps) {
	const StatusIcon = STATUS_ICONS[status];
	const priorityColor = PRIORITY_COLORS[priority];

	return (
		<CardHeader
			icon={emoji ? <span className="text-lg">{emoji}</span> : <StatusIcon className="h-4 w-4" />}
			primaryColor={primaryColor}
			subtitle={`${STATUS_LABELS[status]} • ${priority.toUpperCase()}`}
			title={title}
		>
			{/* Acciones rápidas */}
			<div className="flex items-center gap-1">
				{/* Favorito */}
				{onToggleFavorite && (
					<button
						aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
						className={cn(
							'rounded-full p-1 transition-all duration-200',
							'hover:bg-background/10',
							isFavorite && 'text-warning'
						)}
						onClick={(e) => {
							e.stopPropagation();
							onToggleFavorite();
						}}
						type="button"
					>
						<Star className={cn('h-3.5 w-3.5', isFavorite && 'fill-current')} />
					</button>
				)}

				{/* Archivar */}
				{onToggleArchive && (
					<button
						aria-label={isArchived ? 'Desarchivar' : 'Archivar'}
						className={cn(
							'rounded-full p-1 transition-all duration-200',
							'hover:bg-background/10',
							isArchived && 'text-muted-foreground'
						)}
						onClick={(e) => {
							e.stopPropagation();
							onToggleArchive();
						}}
						type="button"
					>
						<Archive className={cn('h-3.5 w-3.5', isArchived && 'fill-current')} />
					</button>
				)}
			</div>
		</CardHeader>
	);
}
