/**
 * @file Tipos para TaskCard
 * @module components/cards/task-card
 */

import type { TaskWithStats } from '@/types/entities/task';

export interface TaskCardProps {
	/** Task a mostrar */
	task: TaskWithStats;
	/** Callback al hacer click */
	onClick?: () => void;
	/** Clases CSS adicionales */
	className?: string;
	/** Estilos inline */
	style?: React.CSSProperties;
	/** Modo TCG (Trading Card Game) */
	tcgMode?: boolean;
	/** Modo compacto */
	compact?: boolean;
	/** Si está seleccionado */
	isSelected?: boolean;
	/** Si está deshabilitado */
	disabled?: boolean;
	/** Si es interactivo */
	interactive?: boolean;
}

export interface TaskCardContentProps {
	description?: string | null;
	status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
	priority: 'low' | 'medium' | 'high' | 'urgent';
	progress: number;
	category?: string | null;
	tags?: string[];
	dueDate?: Date | null;
	estimatedHours?: number | null;
	actualHours?: number | null;
	notes?: string | null;
	primaryColor: string;
	secondaryColor: string;
	tcgMode: boolean;
	compact: boolean;
	isOverdue: boolean;
	daysUntilDue?: number | null;
}

export interface TaskCardFooterProps {
	createdAt: Date;
	updatedAt: Date | null;
	subtasksCount: number;
	imagesCount: number;
	videosCount: number;
	albumsCount: number;
	charactersCount: number;
	primaryColor: string;
	secondaryColor: string;
	tcgMode: boolean;
	totalRelations: number;
}

export interface TaskCardHeaderProps {
	title: string;
	emoji?: string | null;
	status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
	priority: 'low' | 'medium' | 'high' | 'urgent';
	isFavorite: boolean;
	isArchived: boolean;
	primaryColor: string;
	tcgMode: boolean;
	onToggleFavorite?: () => void;
	onToggleArchive?: () => void;
}
