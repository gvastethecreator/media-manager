'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Key } from 'lucide-react';
import { useCallback } from 'react';
import type { PropertyWithStats } from './properties-view';

export interface PropertyCardProps {
	property: PropertyWithStats;
	onClick?: () => void;
	className?: string;
}

export function PropertyCard({ property, onClick, className }: PropertyCardProps) {
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

	// Determinar el color de la propiedad
	const propertyColor = property.color || '#64748b'; // slate-500

	// Formatear fecha para mostrar
	const formatDate = (date: Date | string) => {
		return new Date(date).toLocaleDateString('es-ES', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	return (
		<Card
			className={cn(
				'flex flex-col h-full overflow-hidden transition-all duration-300',
				'hover:shadow-lg cursor-pointer border-2',
				className
			)}
			style={{
				borderColor: `${propertyColor}80`,
				background: `linear-gradient(135deg, ${propertyColor}10, ${propertyColor}05)`,
			}}
			onClick={onClick}
			onKeyDown={handleKeyDown}
			tabIndex={onClick ? 0 : -1}
			role={onClick ? 'button' : 'article'}
			data-property-id={property.id}
		>
			{/* Cabecera con emoji y nombre */}
			<div className="p-4 flex items-center gap-3 border-b" style={{ borderColor: `${propertyColor}30` }}>
				<div
					className="flex items-center justify-center w-10 h-10 rounded-full text-2xl"
					style={{ backgroundColor: `${propertyColor}20` }}
				>
					{property.emoji || <Key size={20} />}
				</div>
				<div className="flex-1 overflow-hidden">
					<h3 className="text-lg font-medium truncate">{property.name}</h3>
					<div className="flex items-center gap-2">
						{property.category && (
							<Badge variant="outline" className="text-xs">
								{property.category}
							</Badge>
						)}
						{property.shortcut && <code className="text-xs text-muted-foreground truncate">{property.shortcut}</code>}
					</div>
				</div>
			</div>

			{/* Contenido con descripción */}
			<div className="p-4 flex-1">
				{property.description ? (
					<p className="text-sm line-clamp-3">{property.description}</p>
				) : (
					<p className="text-sm text-muted-foreground italic">Sin descripción</p>
				)}
			</div>

			{/* Pie con estadísticas */}
			<div className="p-4 border-t bg-muted/30" style={{ borderColor: `${propertyColor}30` }}>
				<div className="flex items-center justify-between">
					<span className="text-sm font-medium">{property.totalAssociations} asociaciones</span>
					<Badge variant="outline" className="text-xs" style={{ borderColor: propertyColor }}>
						{formatDate(property.updatedAt)}
					</Badge>
				</div>
			</div>
		</Card>
	);
}
