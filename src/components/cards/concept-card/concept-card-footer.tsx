import { formatDistanceToNow } from '@/lib/utils/date';
import { BookOpen, Calendar, Clock, Lightbulb, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConceptCardFooterProps {
	createdAt: Date | string;
	updatedAt: Date | string;
	imagesCount?: number;
	videosCount?: number;
	promptsCount?: number;
	notesCount?: number;
	totalRelations?: number;
	isFavorite?: boolean;
	category?: string | null;
	primaryColor: string;
	secondaryColor: string;
	tcgMode?: boolean;
}

/**
 * Componente para el pie de una tarjeta de concepto.
 * Diseñado para imitar la información de créditos y copyright de una carta TCG.
 */
export function ConceptCardFooter({
	createdAt,
	updatedAt,
	imagesCount = 0,
	videosCount = 0,
	promptsCount = 0,
	notesCount = 0,
	totalRelations = 0,
	isFavorite = false,
	category = 'Concepto',
	primaryColor,
	secondaryColor,
	tcgMode = true,
}: ConceptCardFooterProps) {
	// Convertir fechas a objetos Date si son strings
	const createdAtDate = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
	const updatedAtDate = typeof updatedAt === 'string' ? new Date(updatedAt) : updatedAt;

	// Calcular tiempo relativo
	const createdTimeAgo = formatDistanceToNow(createdAtDate, {
		addSuffix: true,
	});
	const updatedTimeAgo = formatDistanceToNow(updatedAtDate, {
		addSuffix: true,
	});

	// Calcular rareza basado en relaciones totales
	const getRarity = () => {
		if (totalRelations > 50) {
			return 'Mítico';
		}
		if (totalRelations > 25) {
			return 'Raro';
		}
		if (totalRelations > 10) {
			return 'Infrecuente';
		}
		return 'Común';
	};

	// Calcular "ID" de colección al estilo TCG
	const getCollectionId = () => {
		// Usar las fechas para generar un ID único
		const year = createdAtDate.getFullYear().toString().slice(-2);
		const month = (createdAtDate.getMonth() + 1).toString().padStart(2, '0');
		// Usar un hash simple del timestamp para generar número de colección
		const timeHash = Math.abs(createdAtDate.getTime() % 999)
			.toString()
			.padStart(3, '0');

		return `${year}/${month}-${timeHash}`;
	};

	const rarity = tcgMode ? getRarity() : null;
	const collectionId = tcgMode ? getCollectionId() : null;

	// Calcular nivel de "poder" para cartas TCG (mayor valor = carta más poderosa)
	const powerLevel = tcgMode
		? Math.min(
			99,
			Math.floor(imagesCount * 2 + videosCount * 3 + promptsCount * 2 + notesCount * 1 + totalRelations * 0.5)
		)
		: 0;

	return (
		<div
			className={cn(
				'px-3 py-2 text-white/80 text-xs',
				tcgMode ? 'border-white/10 border-t' : '',
				isFavorite && tcgMode ? 'bg-linear-to-t from-amber-950/40 to-amber-900/20' : ''
			)}
			style={{
				background: tcgMode
					? `linear-gradient(to top, ${secondaryColor}, ${secondaryColor}90)`
					: `linear-gradient(to top, ${secondaryColor}90, ${secondaryColor}60)`,
				borderTop: tcgMode ? `1px solid ${primaryColor}60` : `1px solid ${primaryColor}40`,
				boxShadow: isFavorite && tcgMode ? 'inset 0 0 10px rgba(255, 215, 0, 0.2)' : undefined,
			}}
		>
			<div className="mb-1.5 flex items-center justify-between">
				{/* Información principal */}
				<div className="flex items-center">
					{tcgMode ? (
						<BookOpen className="mr-1.5 opacity-80" size={14} />
					) : (
						<Lightbulb className="mr-1.5 opacity-80" size={14} />
					)}
					<span className={cn('uppercase tracking-wide', tcgMode ? 'font-semibold' : 'font-medium')}>{category}</span>

					{/* Nivel de poder (estilo TCG) */}
					{tcgMode && powerLevel > 0 && (
						<div className="ml-1.5 flex items-center">
							<span className="mx-1 text-[0.6rem] opacity-70">LVL</span>
							<span
								className="rounded-sm px-1.5 py-0.5 font-bold text-[0.7rem]"
								style={{
									backgroundColor: `${primaryColor}60`,
									color: 'white',
									border: `1px solid ${primaryColor}80`,
									boxShadow: `0 0 3px ${primaryColor}40`,
								}}
							>
								{powerLevel}
							</span>
						</div>
					)}
				</div>

				<div className="flex items-center gap-2">
					{/* Rareza solo en modo TCG */}
					{tcgMode && rarity && (
						<span
							className="rounded-sm px-1.5 py-0.5 font-bold text-[0.65rem]"
							style={{
								backgroundColor: isFavorite ? '#FFD700' : primaryColor,
								color: isFavorite ? 'black' : 'white',
								boxShadow: isFavorite ? '0 0 5px rgba(255, 215, 0, 0.7)' : 'none',
							}}
						>
							{rarity}
						</span>
					)}

					{/* Indicador de favorito */}
					{isFavorite && (
						<Star
							aria-label="Favorito"
							className={cn(tcgMode ? 'fill-yellow-300 text-yellow-300' : 'fill-yellow-400 text-yellow-400')}
							size={14}
						/>
					)}
				</div>
			</div>

			{/* Segunda línea - Información adicional */}
			<div className="mb-1.5 flex items-center justify-between text-[0.65rem]">
				{/* ID de colección */}
				{tcgMode && collectionId && (
					<div className="flex items-center rounded-sm bg-black/30 px-1.5 py-0.5">
						<span className="font-mono tracking-wide">{collectionId}</span>
					</div>
				)}

				{/* Contador de contenido */}
				<div className="flex items-center gap-3">
					{/* Contador de imágenes y videos */}
					<div className="flex items-center">
						<span className="mr-1 opacity-60">IMG</span>
						<span className="font-medium">{imagesCount + videosCount}</span>
					</div>

					{/* Contador de prompts */}
					<div className="flex items-center">
						<span className="mr-1 opacity-60">TXT</span>
						<span className="font-medium">{promptsCount + notesCount}</span>
					</div>
				</div>
			</div>

			{/* Fechas de creación y modificación */}
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

			{/* Sello de copyright al estilo TCG */}
			{tcgMode && (
				<div className="mt-1 border-white/10 border-t pt-1 text-center text-[0.6rem] opacity-60">
					™ & © {new Date().getFullYear()} IdeaVault · {(category || 'CONCEPTO').toUpperCase()} · #{collectionId}
				</div>
			)}
		</div>
	);
}
