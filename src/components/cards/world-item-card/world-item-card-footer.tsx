import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, Image as ImageIcon, ShieldCheck, Sparkles, Star } from 'lucide-react';

interface WorldItemCardFooterProps {
	createdAt: Date | string;
	updatedAt: Date | string;
	imagesCount?: number;
	isFavorite?: boolean;
	category?: string | null;
	type?: string | null;
	primaryColor: string;
	secondaryColor: string;
}

/**
 * Componente para el pie de una tarjeta de objeto del mundo.
 * Similar a la parte inferior de una carta Magic con el tipo, artista y copyright.
 */
export function WorldItemCardFooter({
	createdAt,
	updatedAt,
	imagesCount = 0,
	isFavorite = false,
	category = 'Objeto',
	type = 'ITEM',
	primaryColor,
	secondaryColor,
}: WorldItemCardFooterProps) {
	// Convertir fechas a objetos Date si son strings
	const createdAtDate = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
	const updatedAtDate = typeof updatedAt === 'string' ? new Date(updatedAt) : updatedAt;

	// Calcular tiempo relativo
	const createdTimeAgo = formatDistanceToNow(createdAtDate, {
		addSuffix: true,
		locale: es,
	});
	const updatedTimeAgo = formatDistanceToNow(updatedAtDate, {
		addSuffix: true,
		locale: es,
	});

	// Mapear el tipo a un icono
	const getTypeIcon = () => {
		switch (type?.toUpperCase()) {
			case 'ARTIFACT':
				return <Sparkles size={14} className="mr-1.5 opacity-80" />;
			case 'WEAPON':
				return <ShieldCheck size={14} className="mr-1.5 opacity-80" />;
			default:
				return <Sparkles size={14} className="mr-1.5 opacity-80" />;
		}
	};

	return (
		<div
			className="px-3 py-2 text-xs text-white/80"
			style={{
				background: `linear-gradient(to top, ${secondaryColor}90, ${secondaryColor}60)`,
				borderTop: `1px solid ${primaryColor}40`,
			}}
		>
			<div className="flex justify-between items-center mb-1.5">
				{/* Categoría del objeto */}
				<div className="flex items-center">
					{getTypeIcon()}
					<span className="uppercase tracking-wide font-medium">{category || type}</span>
				</div>

				{/* Contador de imágenes y favorito */}
				<div className="flex items-center space-x-2">
					{/* Indicador de favorito */}
					{isFavorite && <Star size={14} className="fill-yellow-400 text-yellow-400" aria-label="Favorito" />}

					{/* Contador de imágenes */}
					<div className="flex items-center">
						<ImageIcon size={14} className="mr-1 opacity-80" />
						<span>{imagesCount}</span>
					</div>
				</div>
			</div>

			{/* Fechas de creación y modificación */}
			<div className="flex justify-between text-[0.65rem] text-white/60">
				<div className="flex items-center">
					<Calendar size={12} className="mr-1" />
					<span title={`Creado: ${createdAtDate.toLocaleString()}`}>{createdTimeAgo}</span>
				</div>
				<div className="flex items-center">
					<Clock size={12} className="mr-1" />
					<span title={`Actualizado: ${updatedAtDate.toLocaleString()}`}>{updatedTimeAgo}</span>
				</div>
			</div>
		</div>
	);
}
