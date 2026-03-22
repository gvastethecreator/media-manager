/**
 * @file Tipos para TaskCard
 * @module components/cards/task-card
 */

import type { TaskWithStats } from '@/types/entities/task';

export interface TaskCardProps {
	/** Clases CSS adicionales */
	className?: string;
	/** Modo compacto */
	compact?: boolean;
	/** Si está deshabilitado */
	disabled?: boolean;
	/** Si es interactivo */
	interactive?: boolean;
	/** Si está seleccionado */
	isSelected?: boolean;
	/** Callback al hacer click */
	onClick?: () => void;
	/** Estilos inline */
	style?: React.CSSProperties;
	/** Task a mostrar */
	task: TaskWithStats;
	/** Modo TCG (Trading Card Game) */
	tcgMode?: boolean;
}

export interface TaskCardContentProps {
	actualHours?: number | null;
	category?: string | null;
	compact: boolean;
	daysUntilDue?: number | null;
	description?: string | null;
	dueDate?: Date | null;
	estimatedHours?: number | null;
	isOverdue: boolean;
	notes?: string | null;
	primaryColor: string;
	priority: 'low' | 'medium' | 'high' | 'urgent';
	progress: number;
	secondaryColor: string;
	status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
	tags?: string[];
	tcgMode: boolean;
}

export interface TaskCardFooterProps {
	albumsCount: number;
	charactersCount: number;
	createdAt: Date;
	imagesCount: number;
	primaryColor: string;
	secondaryColor: string;
	subtasksCount: number;
	tcgMode: boolean;
	totalRelations: number;
	updatedAt: Date | null;
	videosCount: number;
}

export interface TaskCardHeaderProps {
	emoji?: string | null;
	isArchived: boolean;
	isFavorite: boolean;
	onToggleArchive?: () => void;
	onToggleFavorite?: () => void;
	primaryColor: string;
	priority: 'low' | 'medium' | 'high' | 'urgent';
	status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
	tcgMode: boolean;
	title: string;
}
