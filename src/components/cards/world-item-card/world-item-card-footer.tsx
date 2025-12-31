import { Calendar, Clock, Image as ImageIcon, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { formatDistanceToNow } from '@/lib/utils/date';

import type { WorldItemWithStats } from '@/types/entities/world-item';

interface WorldItemCardFooterProps {
	worldItem: WorldItemWithStats;
	_totalRelations: number;
	primaryColor: string;
	secondaryColor: string;
	intensityFactor: number;
	compact?: boolean;
}

/**
 * Componente para el pie de una tarjeta de objeto del mundo.
 * Similar a la parte inferior de una carta Magic con el tipo, artista y copyright.
 */
export const WorldItemCardFooter: React.FC<WorldItemCardFooterProps> = ({
	worldItem,
	_totalRelations,
	primaryColor,
	secondaryColor,
	intensityFactor,
	compact = false,
}: WorldItemCardFooterProps) => {
	const { createdAt, updatedAt, isFavorite, category, type, stats } = worldItem;
	const imagesCount = stats?.imageCount || worldItem.stats?.imageCount || 0;
	// Convertir fechas a objetos Date si son strings
	const createdAtDate = createdAt ? (typeof createdAt === 'string' ? new Date(createdAt) : createdAt) : new Date();
	const updatedAtDate = updatedAt ? (typeof updatedAt === 'string' ? new Date(updatedAt) : updatedAt) : new Date();

	// Calcular tiempo relativo
	const createdTimeAgo = formatDistanceToNow(createdAtDate, {
		addSuffix: true,
	});
	const updatedTimeAgo = formatDistanceToNow(updatedAtDate, {
		addSuffix: true,
	});

	// Mapear el tipo a un icono
	const getTypeIcon = () => {
		switch (type?.toUpperCase()) {
			case 'ARTIFACT':
				return <Sparkles className="mr-1.5 opacity-80" size={14} />;
			case 'WEAPON':
				return <ShieldCheck className="mr-1.5 opacity-80" size={14} />;
			default:
				return <Sparkles className="mr-1.5 opacity-80" size={14} />;
		}
	};

	return (
		<div
			className="px-3 py-2 text-white/80 text-xs"
			style={{
				background: `linear-gradient(to top, ${secondaryColor}90, ${secondaryColor}60)`,
				borderTop: `1px solid ${primaryColor}40`,
			}}
		>
			<div className="mb-1.5 flex items-center justify-between">
				{/* Categoría del objeto */}
				<div className="flex items-center">
					{getTypeIcon()}
					<span className="font-medium uppercase tracking-wide">{category || type}</span>
				</div>

				{/* Contador de imágenes y favorito */}
				<div className="flex items-center space-x-2">
					{/* Indicador de favorito */}
					{isFavorite && <Star aria-label="Favorito" className="fill-yellow-400 text-yellow-400" size={14} />}

					{/* Contador de imágenes */}
					<div className="flex items-center">
						<ImageIcon className="mr-1 opacity-80" size={14} />
						<span>{imagesCount}</span>
					</div>
				</div>

				{!compact && (
					<div className="flex justify-between text-[0.65rem] text-white/60">
						<div className="flex items-center">
							<Calendar className="mr-1" size={12} />
							<span title={`Creado: ${createdAtDate.toLocaleString()}`}>{createdTimeAgo}</span>
						</div>
						<div className="flex items-center">
							<Clock className="mr-1" size={12} />
							<span title={`Actualizado: ${updatedAtDate.toLocaleString()}`}>{updatedTimeAgo}</span>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};
