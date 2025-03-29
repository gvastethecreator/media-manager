'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Sparkles, WandSparkles } from 'lucide-react';
import { useCallback } from 'react';
import type { WildcardWithStats } from './wildcards-view';

export interface WildcardCardProps {
	wildcard: WildcardWithStats;
	onClick?: () => void;
	className?: string;
}

export function WildcardCard({ wildcard, onClick, className }: WildcardCardProps) {
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

	// Color principal para el comodín (constante por ahora)
	const cardColor = '#a855f7'; // purple-500

	// Formatear fecha para mostrar
	const formatDate = (date: Date | string) => {
		return new Date(date).toLocaleDateString('es-ES', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	// Extracto de valores
	const valuesPreview = wildcard.values.length > 0
		? wildcard.values.slice(0, 3).join(', ') + (wildcard.values.length > 3 ? '...' : '')
		: 'Sin valores';

	return (
		<Card
			className={cn(
				'flex flex-col h-full overflow-hidden transition-all duration-300',
				'hover:shadow-lg cursor-pointer border-2 relative',
				className
			)}
			style={{
				borderColor: `${cardColor}80`,
				background: `linear-gradient(135deg, ${cardColor}10, ${cardColor}05)`,
			}}
			onClick={onClick}
			onKeyDown={handleKeyDown}
			tabIndex={onClick ? 0 : -1}
			role={onClick ? 'button' : 'article'}
			data-wildcard-id={wildcard.id}
		>
			{/* Efecto de brillo en la esquina */}
			<div className="absolute top-0 right-0 w-16 h-16 opacity-30 pointer-events-none">
				<div className="absolute top-0 right-0 transform rotate-45 translate-x-4 -translate-y-4 w-16 h-4 bg-gradient-to-r from-transparent to-purple-400" />
			</div>

			{/* Cabecera con nombre y patrón */}
			<div
				className="p-4 flex items-center gap-3 border-b"
				style={{ borderColor: `${cardColor}30` }}
			>
				<div
					className="flex items-center justify-center w-10 h-10 rounded-full text-white"
					style={{ backgroundColor: cardColor }}
				>
					<WandSparkles size={20} />
				</div>
				<div className="flex-1 overflow-hidden">
					<h3 className="text-lg font-medium truncate">{wildcard.name}</h3>
					<code className="text-xs bg-muted/50 px-1.5 py-0.5 rounded">{wildcard.pattern}</code>
				</div>
				<Badge className="bg-purple-500" variant="default">
					{wildcard.values.length}
				</Badge>
			</div>

			{/* Contenido con descripción y valores */}
			<div className="p-4 flex-1">
				{wildcard.description ? (
					<p className="text-sm line-clamp-2 mb-3">{wildcard.description}</p>
				) : (
					<p className="text-sm text-muted-foreground italic mb-3">Sin descripción</p>
				)}

				<div className="mt-2">
					<p className="text-xs text-muted-foreground flex items-center gap-1">
						<Sparkles size={14} />
						<span>Valores:</span>
					</p>
					<p className="text-sm mt-1 bg-muted/20 p-2 rounded line-clamp-2">{valuesPreview}</p>
				</div>
			</div>

			{/* Pie con estadísticas */}
			<div className="p-4 border-t bg-muted/30" style={{ borderColor: `${cardColor}30` }}>
				<div className="flex items-center justify-between">
					<span className="text-sm font-medium">
						{wildcard.usageCount} usos
					</span>
					<Badge
						variant="outline"
						className="text-xs"
						style={{ borderColor: cardColor }}
					>
						{formatDate(wildcard.updatedAt)}
					</Badge>
				</div>
			</div>
		</Card>
	);
}