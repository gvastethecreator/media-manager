import { Bookmark, Calendar, Currency, Diamond, Globe, Link, Tag } from 'lucide-react';
import { motion } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { useCallback, useMemo } from 'react';
import type { CollectionEdition } from '@/types/entities/collection';

interface CollectionCardContentProps {
	description?: string | null;
	platform?: string | null;
	price?: number | null;
	network?: string | null;
	tokenId?: string | null;
	url?: string | null;
	editions?: CollectionEdition[] | string | null;
	primaryColor: string;
	secondaryColor?: string;
	featuredImage?: string | null;
	sourceImage?: string | null;
	metadata?: {
		rarityLevel: 'Common' | 'Uncommon' | 'Rare' | 'Mythic';
		cardId: string;
		totalItems: number;
	};
}

/**
 * Componente para el contenido principal de la tarjeta de colección.
 * Diseñado con estilo de cuadro de texto de carta TCG.
 */
export function CollectionCardContent({
	description,
	platform,
	price,
	network,
	tokenId,
	url,
	editions,
	primaryColor,
	secondaryColor,
	featuredImage,
	sourceImage,
	metadata,
}: CollectionCardContentProps) {
	// Determinar qué ediciones usar, prefiriendo parsedEditions
	const editionsList = useMemo(() => {
		if (typeof editions === 'string' && editions !== 'empty_array') {
			try {
				return JSON.parse(editions);
			} catch (_e) {
				return [];
			}
		}
		return editions || [];
	}, [editions]);

	// Formatear precio
	const formattedPrice = price
		? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(price)
		: null;

	// Determinar la imagen de fondo (priorizar featuredImage, luego sourceImage)
	const backgroundImage = featuredImage || sourceImage;

	// Crear color secundario si no se proporciona
	const derivedSecondaryColor = secondaryColor || `${primaryColor}90`;

	// Obtener los colores de rareza para el borde TCG
	const rarityColors = getRarityColors(metadata?.rarityLevel || 'Common');

	return (
		<div
			className="flex-grow p-3 overflow-hidden relative rounded-sm"
			style={{
				backgroundColor: `${primaryColor}10`,
				backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
				backgroundSize: 'cover',
				backgroundPosition: 'center',
				backgroundBlendMode: 'overlay',
			}}
		>
			{/* Overlay para mantener legibilidad sobre imagen */}
			{backgroundImage && <div className="absolute inset-0 bg-black/30 z-0" />}

			{/* Contenido con posición relativa para estar sobre el overlay */}
			<div className="relative z-10 h-full flex flex-col">
				{/* Sello de rareza y cardId estilo TCG */}
				{metadata && (
					<div className="absolute -top-1 -right-1 flex items-center gap-1">
						<Badge
							className="text-[9px] py-0 h-5 shadow-md uppercase font-bold"
							style={{
								backgroundColor: rarityColors.background,
								color: rarityColors.text,
								border: `1px solid ${rarityColors.border}`,
							}}
						>
							{metadata.rarityLevel}
						</Badge>
					</div>
				)}

				{/* Descripción principal con estilo TCG */}
				{description && (
					<div className="mb-2 text-xs leading-relaxed line-clamp-3" style={{ color: `${primaryColor}DD` }}>
						<p className="italic">{description}</p>
					</div>
				)}

				{/* Contadores con estilo TCG */}
				{metadata && (
					<div className="flex items-center gap-3 mb-2">
						<motion.div className="flex items-center gap-1 text-xs" whileHover={{ scale: 1.05 }}>
							<Diamond className="w-3.5 h-3.5" style={{ color: rarityColors.border }} />
							<span className="font-bold">{metadata.cardId}</span>
						</motion.div>
						<motion.div className="flex items-center gap-1 text-xs" whileHover={{ scale: 1.05 }}>
							<Bookmark className="w-3.5 h-3.5 text-muted-foreground" />
							<span className="font-medium">{metadata.totalItems} elementos</span>
						</motion.div>
					</div>
				)}

				{/* Caja de propiedades estilo TCG */}
				<div
					className="mt-auto pt-1 text-xs space-y-1.5 border-t rounded-sm p-1"
					style={{
						borderColor: `${primaryColor}30`,
						backgroundColor: `${primaryColor}15`,
						boxShadow: `inset 0 0 10px ${derivedSecondaryColor}30`,
					}}
				>
					{/* Grid de propiedades */}
					<div className="grid grid-cols-2 gap-1">
						{/* Plataforma */}
						{platform && (
							<div className="flex items-center gap-1 text-xs">
								<Globe className="w-3.5 h-3.5 text-muted-foreground" />
								<span className="font-medium truncate">{platform}</span>
							</div>
						)}

						{/* Precio */}
						{formattedPrice && (
							<div className="flex items-center gap-1 text-xs">
								<Tag className="w-3.5 h-3.5 text-muted-foreground" />
								<span className="font-medium">{formattedPrice}</span>
							</div>
						)}

						{/* Red blockchain */}
						{network && (
							<div className="flex items-center gap-1 text-xs">
								<Currency className="w-3.5 h-3.5 text-muted-foreground" />
								<span className="font-medium truncate">{network}</span>
							</div>
						)}

						{/* Token ID (reducido si es muy largo) */}
						{tokenId && (
							<div className="flex items-center gap-1 text-xs">
								<span className="text-xs text-muted-foreground">Token:</span>
								<span className="font-medium truncate">
									{tokenId.length > 8 ? `${tokenId.substring(0, 5)}...` : tokenId}
								</span>
							</div>
						)}

						{/* URL externa */}
						{url && (
							<div className="flex items-center gap-1 text-xs col-span-2">
								<Link className="w-3.5 h-3.5 text-muted-foreground" />
								<span className="font-medium truncate underline text-blue-500 hover:text-blue-600">
									{url.replace(/https?:\/\/(www\.)?/, '').substring(0, 30)}
									{url.length > 30 && '...'}
								</span>
							</div>
						)}
					</div>

					{/* Ediciones disponibles */}
					{editionsList.length > 0 && (
						<div className="mt-1 pt-1 border-t border-dashed" style={{ borderColor: `${primaryColor}20` }}>
							<div className="flex items-center gap-1 mb-1 text-xs text-muted-foreground">
								<Calendar className="w-3.5 h-3.5" />
								<span className="font-medium">Ediciones</span>
							</div>
							<ul className="text-xs space-y-0.5 max-h-12 overflow-y-auto scrollbar-thin overflow-x-hidden">
								{editionsList.slice(0, 2).map((edition: CollectionEdition) => {
									const date = 'date' in edition ? edition.date : edition.releaseDate;
									return (
										<li
											key={edition.id || `edition-${edition.name.substring(0, 15)}`}
											className="flex justify-between text-xs text-muted-foreground"
										>
											<span className="font-medium truncate">{edition.name}</span>
											{date && (
												<span className="ml-1 text-muted-foreground whitespace-nowrap">
													({new Date(date).getFullYear()})
												</span>
											)}
										</li>
									);
								})}
								{editionsList.length > 2 && (
									<li className="text-xs italic text-muted-foreground">...y {editionsList.length - 2} más</li>
								)}
							</ul>
						</div>
					)}
				</div>
			</div>

			{/* Decoración de esquina estilo TCG */}
			<div className="absolute bottom-1 right-1 w-4 h-4 opacity-70" style={{ color: primaryColor }}>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
					<path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
					<path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
				</svg>
			</div>
		</div>
	);
}

// Función para obtener los colores según el nivel de rareza
function getRarityColors(rarity: 'Common' | 'Uncommon' | 'Rare' | 'Mythic') {
	switch (rarity) {
		case 'Mythic':
			return {
				border: '#FF8C00',
				background: '#FF8C0020',
				text: '#FF8C00',
			};
		case 'Rare':
			return {
				border: '#FFD700',
				background: '#FFD70020',
				text: '#FFD700',
			};
		case 'Uncommon':
			return {
				border: '#C0C0C0',
				background: '#C0C0C020',
				text: '#C0C0C0',
			};
		default: // Common
			return {
				border: '#CD7F32',
				background: '#CD7F3220',
				text: '#CD7F32',
			};
	}
}
