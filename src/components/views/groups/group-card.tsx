'use client';

import type { GroupWithStats } from '@/app/actions/groups/group.actions';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { FileFolder, Heart } from 'lucide-react';
import { useCallback } from 'react';

export interface GroupCardProps {
	group: GroupWithStats;
	onClick?: () => void;
	className?: string;
}

export function GroupCard({ group, onClick, className }: GroupCardProps) {
	// Manejar eventos de teclado para accesibilidad
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLDivElement>) => {
			if (onClick && (e.key === 'Enter' || e.key === ' ')) {
				e.preventDefault();
				onClick();
			}
		},
		[onClick]
	);

	// Formatear fecha para mostrar
	const formatDate = (date: Date | string) => {
		return new Date(date).toLocaleDateString('es-ES', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	// Calcular el total de entidades
	const totalEntities = group.totalEntities || 0;

	return (
		<Card
			className={cn(
				'flex flex-col h-full overflow-hidden transition-all duration-300',
				'hover:shadow-lg cursor-pointer border-2',
				className
			)}
			style={{
				borderColor: group.color || '#60a5fa',
				background: `linear-gradient(135deg, ${group.color}15, ${group.color}05)`,
			}}
			onClick={onClick}
			onKeyDown={handleKeyDown}
			tabIndex={onClick ? 0 : -1}
			role={onClick ? 'button' : 'article'}
			data-group-id={group.id}
		>
			{/* Cabecera con emoji y nombre */}
			<div
				className="p-4 flex items-center gap-3 border-b"
				style={{ borderColor: `${group.color}30` || '#60a5fa30' }}
			>
				<div
					className="flex items-center justify-center w-10 h-10 rounded-full text-2xl"
					style={{ backgroundColor: `${group.color}25` || '#60a5fa25' }}
				>
					{group.emoji || '📂'}
				</div>
				<div className="flex-1 overflow-hidden">
					<h3 className="text-lg font-medium truncate">{group.name}</h3>
					{group.category && (
						<p className="text-sm text-muted-foreground truncate">{group.category}</p>
					)}
				</div>
				{group.isFavorite && (
					<Heart className="text-red-500 fill-red-500" size={18} />
				)}
			</div>

			{/* Contenido con descripción */}
			<div className="p-4 flex-1">
				{group.description ? (
					<p className="text-sm line-clamp-3">{group.description}</p>
				) : (
					<p className="text-sm text-muted-foreground italic">Sin descripción</p>
				)}
			</div>

			{/* Pie con contadores y fecha */}
			<div className="p-4 border-t bg-muted/30" style={{ borderColor: `${group.color}30` || '#60a5fa30' }}>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<FileFolder size={16} />
						<span className="text-sm font-medium">{totalEntities} entidades</span>
					</div>
					<Badge
						variant="outline"
						className="text-xs"
						style={{ borderColor: group.color || '#60a5fa' }}
					>
						{formatDate(group.updatedAt)}
					</Badge>
				</div>
			</div>
		</Card>
	);
}