'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { FileText, Hash, Key, Variable } from 'lucide-react';
import { useCallback } from 'react';
import type { PropertyWithStats } from './properties-view';

export interface PropertyCardProps {
	property: PropertyWithStats;
	onClick?: () => void;
	className?: string;
}

// Mapa de iconos por tipo de propiedad
const PROPERTY_TYPE_ICONS = {
	string: FileText,
	number: Hash,
	boolean: Variable,
	date: FileText,
	select: Variable,
	default: Key,
} as const;

// Colores por tipo de propiedad
const PROPERTY_TYPE_COLORS = {
	string: '#3b82f6', // blue-500
	number: '#10b981', // emerald-500
	boolean: '#6366f1', // indigo-500
	date: '#f97316',   // orange-500
	select: '#8b5cf6', // violet-500
	default: '#64748b', // slate-500
} as const;

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

	// Determinar el tipo para iconos y colores
	const propertyType = (property.type || 'default').toLowerCase();
	const IconComponent = PROPERTY_TYPE_ICONS[propertyType as keyof typeof PROPERTY_TYPE_ICONS] || PROPERTY_TYPE_ICONS.default;
	const propertyColor = PROPERTY_TYPE_COLORS[propertyType as keyof typeof PROPERTY_TYPE_COLORS] || PROPERTY_TYPE_COLORS.default;

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
			{/* Cabecera con tipo y nombre */}
			<div
				className="p-4 flex items-center gap-3 border-b"
				style={{ borderColor: `${propertyColor}30` }}
			>
				<div
					className="flex items-center justify-center w-10 h-10 rounded-full text-white"
					style={{ backgroundColor: propertyColor }}
				>
					<IconComponent size={20} />
				</div>
				<div className="flex-1 overflow-hidden">
					<h3 className="text-lg font-medium truncate">{property.name}</h3>
					<div className="flex items-center gap-2">
						<Badge variant="outline" className="text-xs">
							{property.type || 'custom'}
						</Badge>
						<code className="text-xs text-muted-foreground truncate">{property.key}</code>
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

				{property.defaultValue && (
					<div className="mt-3">
						<p className="text-xs text-muted-foreground">Valor predeterminado:</p>
						<code className="text-sm bg-muted/50 px-1.5 py-0.5 rounded">{property.defaultValue}</code>
					</div>
				)}

				{property.required && (
					<Badge className="mt-3 text-xs" variant="secondary">Requerido</Badge>
				)}
			</div>

			{/* Pie con estadísticas */}
			<div className="p-4 border-t bg-muted/30" style={{ borderColor: `${propertyColor}30` }}>
				<div className="flex items-center justify-between">
					<span className="text-sm font-medium">
						{property.totalAssociations} asociaciones
					</span>
					<Badge
						variant="outline"
						className="text-xs"
						style={{ borderColor: propertyColor }}
					>
						{formatDate(property.updatedAt)}
					</Badge>
				</div>
			</div>
		</Card>
	);
}