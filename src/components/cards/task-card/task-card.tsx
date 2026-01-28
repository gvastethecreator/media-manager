/**
 * @file TaskCard - Tarjeta TCG para Tasks
 * @module components/cards/task-card
 * @description Componente de tarjeta estilo Trading Card Game para mostrar tasks
 */

import { memo, useCallback, useMemo } from 'react';
import { CardContainer } from '@/components/cards/card-container';
import { motion } from '@/components/ui/animejs-shim';
import { cn } from '@/lib/utils';
import type { TaskCardProps } from './task-card.types';
import { TaskCardContent } from './task-card-content';
import { TaskCardFooter } from './task-card-footer';
import { TaskCardHeader } from './task-card-header';

// Colores por status
const STATUS_COLORS = {
	pending: 'var(--dt-neutral-500)',
	in_progress: 'var(--dt-primary-500)',
	completed: 'var(--dt-success-500)',
	cancelled: 'var(--dt-danger-500)',
} as const;

// Colores por priority
const PRIORITY_COLORS = {
	low: 'var(--dt-neutral-500)',
	medium: 'var(--dt-warning-500)',
	high: 'var(--dt-warning-600)',
	urgent: 'var(--dt-danger-500)',
} as const;

export const TaskCard = memo(function TaskCard({
	task,
	onClick,
	className,
	style,
	tcgMode = true,
	compact = false,
	isSelected = false,
	disabled = false,
	interactive = true,
}: TaskCardProps) {
	// Si no hay task, no renderizar
	if (!task) {
		return null;
	}

	// Extraer contadores
	const subtasksCount = task._count?.subtasks || 0;
	const imagesCount = task._count?.images || 0;
	const videosCount = task._count?.videos || 0;
	const albumsCount = task._count?.albums || 0;
	const charactersCount = task._count?.characters || 0;

	const totalRelations = subtasksCount + imagesCount + videosCount + albumsCount + charactersCount;

	// Determinar colores (prioridad sobre status)
	const primaryColor = useMemo(() => {
		return PRIORITY_COLORS[task.priority] || STATUS_COLORS[task.status];
	}, [task.priority, task.status]);

	const secondaryColor = useMemo(() => {
		return `color-mix(in oklab, ${primaryColor}, black 20%)`;
	}, [primaryColor]);

	// Calcular si está vencida
	const isOverdue = useMemo(() => {
		if (!task.dueDate || task.status === 'completed' || task.status === 'cancelled') return false;
		return new Date(task.dueDate) < new Date();
	}, [task.dueDate, task.status]);

	// Calcular días hasta vencimiento
	const daysUntilDue = useMemo(() => {
		if (!task.dueDate || task.status === 'completed' || task.status === 'cancelled') return null;
		const now = new Date();
		const due = new Date(task.dueDate);
		const diff = due.getTime() - now.getTime();
		return Math.ceil(diff / (1000 * 60 * 60 * 24));
	}, [task.dueDate, task.status]);

	// Parsear tags
	const parsedTags = useMemo(() => {
		if (!task.tags) return [];
		if (typeof task.tags === 'string') {
			try {
				return JSON.parse(task.tags);
			} catch {
				return [];
			}
		}
		return task.tags;
	}, [task.tags]);

	// Manejar click (motion.div no recibe event parameter)
	const handleClick = useCallback(() => {
		if (onClick && !disabled) {
			onClick();
		}
	}, [onClick, disabled]);

	// Manejar teclado
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLDivElement>) => {
			if (onClick && !disabled && (e.key === 'Enter' || e.key === ' ')) {
				e.preventDefault();
				onClick();
			}
		},
		[onClick, disabled]
	);

	// Estilos de la tarjeta
	const cardStyle = useMemo(() => {
		if (!tcgMode) {
			return {
				borderColor: primaryColor,
				background: `linear-gradient(135deg, color-mix(in oklab, ${primaryColor}, transparent 85%), color-mix(in oklab, ${primaryColor}, transparent 95%))`,
				...style,
			};
		}

		// Estilo TCG
		const relationIntensity = Math.min(0.5 + (totalRelations / 50) * 0.5, 0.9);
		const bgOpacity = Math.round(relationIntensity * 50);

		return {
			borderColor: primaryColor,
			background: `linear-gradient(135deg, color-mix(in oklab, ${primaryColor}, transparent ${100 - bgOpacity}%), color-mix(in oklab, ${primaryColor}, transparent 90%))`,
			boxShadow: `0 0 15px color-mix(in oklab, ${primaryColor}, transparent 60%), inset 0 0 20px color-mix(in oklab, ${primaryColor}, transparent 80%)`,
			...style,
		};
	}, [primaryColor, style, tcgMode, totalRelations]);

	return (
		<motion.div
			animate={{ opacity: 1, y: 0 }}
			aria-label={`Task: ${task.title}`}
			className={cn(
				// Base
				'relative bg-card',
				compact ? 'h-[300px] w-[240px]' : 'h-[420px] w-[300px]',
				'overflow-hidden rounded-[4.75%]',
				'border-2 shadow-md',
				// Interacción
				'transition-all duration-300 ease-out',
				interactive && !disabled && 'cursor-pointer hover:shadow-xl',
				isSelected && 'ring-4 ring-primary/60',
				disabled && 'cursor-not-allowed opacity-50',
				className
			)}
			exit={{ opacity: 0, y: -20 }}
			initial={{ opacity: 0, y: 20 }}
			onKeyDown={handleKeyDown}
			role={onClick && !disabled ? 'button' : 'article'}
			style={cardStyle}
			tabIndex={disabled || !onClick ? -1 : 0}
			whileHover={disabled ? {} : { y: -8, transition: { duration: 0.3 } }}
			whileTap={!disabled && onClick ? { scale: 0.98 } : {}}
			{...(onClick && !disabled ? { onClick: handleClick } : {})}
		>
			<CardContainer
				className="transition-all duration-300"
				primaryColor={primaryColor}
				secondaryColor={secondaryColor}
			>
				<div className="flex h-full flex-col">
					{/* Header */}
					<TaskCardHeader
						emoji={task.emoji}
						isArchived={task.isArchived}
						isFavorite={task.isFavorite}
						primaryColor={primaryColor}
						priority={task.priority}
						status={task.status}
						tcgMode={tcgMode}
						title={task.title}
					/>

					{/* Content */}
					<TaskCardContent
						actualHours={task.actualHours}
						category={task.category}
						compact={compact}
						daysUntilDue={daysUntilDue}
						description={task.description}
						dueDate={task.dueDate}
						estimatedHours={task.estimatedHours}
						isOverdue={isOverdue}
						notes={task.notes}
						primaryColor={primaryColor}
						priority={task.priority}
						progress={task.progress}
						secondaryColor={secondaryColor}
						status={task.status}
						tags={parsedTags}
						tcgMode={tcgMode}
					/>

					{/* Footer */}
					<TaskCardFooter
						albumsCount={albumsCount}
						charactersCount={charactersCount}
						createdAt={task.createdAt}
						imagesCount={imagesCount}
						primaryColor={primaryColor}
						secondaryColor={secondaryColor}
						subtasksCount={subtasksCount}
						tcgMode={tcgMode}
						totalRelations={totalRelations}
						updatedAt={task.updatedAt}
						videosCount={videosCount}
					/>
				</div>

				{/* TCG Effects */}
				{tcgMode && (
					<>
						{/* Holographic effect */}
						<div
							className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 hover:opacity-30"
							style={{
								backgroundImage: `
									linear-gradient(125deg,
									transparent 0%,
									color-mix(in oklab, ${primaryColor}, transparent 70%) 25%,
									color-mix(in oklab, ${secondaryColor}, transparent 70%) 50%,
									color-mix(in oklab, ${primaryColor}, transparent 70%) 75%,
									transparent 100%)
								`,
								backgroundSize: '200% 200%',
								animation: 'gradient-shift 3s ease infinite',
							}}
						/>

						{/* Corner decorations */}
						<div
							className="pointer-events-none absolute top-1 left-1 h-5 w-5 rounded-br-sm border-t-2 border-l-2 opacity-60"
							style={{ borderColor: primaryColor }}
						/>
						<div
							className="pointer-events-none absolute top-1 right-1 h-5 w-5 rounded-bl-sm border-t-2 border-r-2 opacity-60"
							style={{ borderColor: primaryColor }}
						/>
						<div
							className="pointer-events-none absolute bottom-1 left-1 h-5 w-5 rounded-tr-sm border-b-2 border-l-2 opacity-60"
							style={{ borderColor: primaryColor }}
						/>
						<div
							className="pointer-events-none absolute right-1 bottom-1 h-5 w-5 rounded-tl-sm border-r-2 border-b-2 opacity-60"
							style={{ borderColor: primaryColor }}
						/>
					</>
				)}

				{/* Glow effect on hover */}
				{tcgMode && (
					<div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 hover:opacity-100">
						<div
							className="absolute inset-0 -z-10 rounded-[4.75%] blur-sm"
							style={{ boxShadow: `0 0 15px 2px ${primaryColor}` }}
						/>
					</div>
				)}
			</CardContainer>
		</motion.div>
	);
});
