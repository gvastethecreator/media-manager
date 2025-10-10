/**
 * @file Footer para TaskCard
 * @module components/cards/task-card
 */

import { Album, Image, ListTree, User, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TaskCardFooterProps } from './task-card.types';

export function TaskCardFooter({
	createdAt,
	updatedAt,
	subtasksCount,
	imagesCount,
	videosCount,
	albumsCount,
	charactersCount,
	primaryColor,
	secondaryColor,
	tcgMode,
	totalRelations,
}: TaskCardFooterProps) {
	// Calcular tiempo relativo
	const getRelativeTime = (date: Date | null) => {
		if (!date) return 'N/A';
		const now = new Date();
		const diff = now.getTime() - new Date(date).getTime();
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));

		if (days === 0) return 'Hoy';
		if (days === 1) return 'Ayer';
		if (days < 7) return `Hace ${days}d`;
		if (days < 30) return `Hace ${Math.floor(days / 7)}sem`;
		return `Hace ${Math.floor(days / 30)}m`;
	};

	// Contar relaciones totales
	const hasRelations = totalRelations > 0;

	return (
		<div
			className={cn('mt-auto border-t px-3 py-2', tcgMode && 'bg-black/10')}
			style={{
				borderColor: `${primaryColor}30`,
				background: tcgMode ? `linear-gradient(to top, ${secondaryColor}20, ${secondaryColor}10)` : undefined,
			}}
		>
			{/* Relaciones */}
			{hasRelations && (
				<div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
					{subtasksCount > 0 && (
						<div className="flex items-center gap-1 opacity-70">
							<ListTree className="h-3 w-3" />
							<span>{subtasksCount}</span>
						</div>
					)}
					{imagesCount > 0 && (
						<div className="flex items-center gap-1 opacity-70">
							<Image className="h-3 w-3" />
							<span>{imagesCount}</span>
						</div>
					)}
					{videosCount > 0 && (
						<div className="flex items-center gap-1 opacity-70">
							<Video className="h-3 w-3" />
							<span>{videosCount}</span>
						</div>
					)}
					{albumsCount > 0 && (
						<div className="flex items-center gap-1 opacity-70">
							<Album className="h-3 w-3" />
							<span>{albumsCount}</span>
						</div>
					)}
					{charactersCount > 0 && (
						<div className="flex items-center gap-1 opacity-70">
							<User className="h-3 w-3" />
							<span>{charactersCount}</span>
						</div>
					)}
				</div>
			)}

			{/* Timestamps */}
			<div className="flex items-center justify-between text-[10px] opacity-50">
				<span>Creado {getRelativeTime(createdAt)}</span>
				<span>Act. {getRelativeTime(updatedAt)}</span>
			</div>

			{/* TCG Bottom Border */}
			{tcgMode && (
				<div
					className="mx-auto mt-2 h-1 w-16 rounded-full"
					style={{
						background: `linear-gradient(90deg, transparent, ${primaryColor}, transparent)`,
					}}
				/>
			)}
		</div>
	);
}
