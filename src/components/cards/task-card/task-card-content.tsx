/**
 * @file Contenido para TaskCard
 * @module components/cards/task-card
 */

import { AlertCircle, Calendar, Clock, FileText, ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TaskCardContentProps } from './task-card.types';

export function TaskCardContent({
	description,
	status,
	priority,
	progress,
	category,
	tags,
	dueDate,
	estimatedHours,
	actualHours,
	notes,
	primaryColor,
	secondaryColor,
	tcgMode,
	compact,
	isOverdue,
	daysUntilDue,
}: TaskCardContentProps) {
	// Calcular color de progreso
	const progressColor =
		progress === 100
			? 'var(--dt-success-500)'
			: progress >= 75
				? 'var(--dt-primary-500)'
				: progress >= 50
					? 'var(--dt-warning-500)'
					: 'var(--dt-neutral-500)';

	// Formatear fecha
	const formatDate = (date: Date) => {
		return new Date(date).toLocaleDateString('es-ES', {
			day: '2-digit',
			month: 'short',
		});
	};

	return (
		<div className={cn('flex flex-col gap-2', compact ? 'px-3 py-3' : 'px-4 py-4')}>
			{/* Descripción */}
			{description && <p className={cn('line-clamp-2 text-sm opacity-80', compact && 'text-sm')}>{description}</p>}

			{/* Progress Bar */}
			<div className="space-y-1">
				<div className="flex items-center justify-between text-sm opacity-70">
					<span>Progreso</span>
					<span className="font-medium">{progress}%</span>
				</div>
				<div className="relative h-2 overflow-hidden rounded-full bg-muted/20">
					<div
						className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
						style={{
							width: `${progress}%`,
							backgroundColor: progressColor,
							boxShadow: `0 0 8px color-mix(in oklab, ${progressColor}, transparent 69%)`,
						}}
					/>
				</div>
			</div>

			{/* Due Date & Overdue Warning */}
			{dueDate && (
				<div
					className={cn(
						'flex items-center gap-2 rounded px-2 py-1 text-sm',
						isOverdue ? 'bg-destructive/20 text-red-400' : 'bg-background/5'
					)}
				>
					<Calendar className="h-4 w-4" />
					<span>
						{isOverdue ? '¡Vencida!' : `Vence: ${formatDate(dueDate)}`}
						{daysUntilDue != null && !isOverdue && daysUntilDue <= 3 && ` (${daysUntilDue}d)`}
					</span>
					{isOverdue && <AlertCircle className="ml-auto h-4 w-4" />}
				</div>
			)}

			{/* Category */}
			{category && (
				<div className="flex items-center gap-2 text-sm opacity-70">
					<FileText className="h-4 w-4" />
					<span className="truncate">{category}</span>
				</div>
			)}

			{/* Estimated vs Actual Hours */}
			{(estimatedHours || actualHours) && (
				<div className="flex items-center gap-2 text-sm opacity-70">
					<Clock className="h-4 w-4" />
					<span>
						{actualHours ? `${actualHours}h` : '0h'} / {estimatedHours ? `${estimatedHours}h` : '?'}
						{actualHours && estimatedHours && actualHours > estimatedHours && (
							<span className="ml-1 text-red-400">(+{actualHours - estimatedHours}h)</span>
						)}
					</span>
				</div>
			)}

			{/* Tags */}
			{tags && tags.length > 0 && (
				<div className="flex flex-wrap gap-1">
					{tags.slice(0, compact ? 2 : 3).map((tag, idx) => (
						<span
							className="rounded px-1.5 py-0.5 font-medium text-xs"
							key={`${tag}-${idx + 1}`}
							style={{
								backgroundColor: `color-mix(in oklab, ${primaryColor}, transparent 88%)`,
								color: primaryColor,
							}}
						>
							{tag}
						</span>
					))}
					{tags.length > (compact ? 2 : 3) && (
						<span className="rounded bg-background/10 px-1.5 py-0.5 text-xs opacity-60">
							+{tags.length - (compact ? 2 : 3)}
						</span>
					)}
				</div>
			)}

			{/* Notes Preview */}
			{!compact && notes && (
				<div className="flex items-start gap-2 text-sm opacity-60">
					<ListChecks className="mt-0.5 h-4 w-4 flex-shrink-0" />
					<p className="line-clamp-2">{notes}</p>
				</div>
			)}

			{/* TCG Decorative Line */}
			{tcgMode && (
				<div
					className="mt-auto h-0.5 rounded-full"
					style={{
						background: `linear-gradient(90deg, transparent, color-mix(in oklab, ${primaryColor}, transparent 63%), transparent)`,
					}}
				/>
			)}
		</div>
	);
}
