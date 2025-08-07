import { Bookmark, Calendar, Currency, Diamond, Globe, Link, Tag } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
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
			className="relative flex-grow overflow-hidden rounded-sm p-3"
			style={{
				backgroundColor: `${primaryColor}10`,
				backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
				backgroundSize: 'cover',
				backgroundPosition: 'center',
				backgroundBlendMode: 'overlay',
			}}
		>
			{/* Overlay para mantener legibilidad sobre imagen */}
			{backgroundImage && <div className="absolute inset-0 z-0 bg-black/30" />}

			{/* Contenido con posición relativa para estar sobre el overlay */}
			<div className="relative z-10 flex h-full flex-col">
				{/* Sello de rareza y cardId estilo TCG */}
				{metadata && (
					<div className="-top-1 -right-1 absolute flex items-center gap-1">
						<Badge
							className="h-5 py-0 font-bold text-[9px] uppercase shadow-md"
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
					<div className="mb-2 line-clamp-3 text-xs leading-relaxed" style={{ color: `${primaryColor}DD` }}>
						<p className="italic">{description}</p>
					</div>
				)}

				{/* Contadores con estilo TCG */}
				{metadata && (
					<div className="mb-2 flex items-center gap-3">
						<motion.div className="flex items-center gap-1 text-xs" whileHover={{ scale: 1.05 }}>
							<Diamond className="h-3.5 w-3.5" style={{ color: rarityColors.border }} />
							<span className="font-bold">{metadata.cardId}</span>
						</motion.div>
						<motion.div className="flex items-center gap-1 text-xs" whileHover={{ scale: 1.05 }}>
							<Bookmark className="h-3.5 w-3.5 text-muted-foreground" />
							<span className="font-medium">{metadata.totalItems} elementos</span>
						</motion.div>
					</div>
				)}

				{/* Caja de propiedades estilo TCG */}
				<div
					className="mt-auto space-y-1.5 rounded-sm border-t p-1 pt-1 text-xs"
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
								<Globe className="h-3.5 w-3.5 text-muted-foreground" />
								<span className="truncate font-medium">{platform}</span>
							</div>
						)}

						{/* Precio */}
						{formattedPrice && (
							<div className="flex items-center gap-1 text-xs">
								<Tag className="h-3.5 w-3.5 text-muted-foreground" />
								<span className="font-medium">{formattedPrice}</span>
							</div>
						)}

						{/* Red blockchain */}
						{network && (
							<div className="flex items-center gap-1 text-xs">
								<Currency className="h-3.5 w-3.5 text-muted-foreground" />
								<span className="truncate font-medium">{network}</span>
							</div>
						)}

						{/* Token ID (reducido si es muy largo) */}
						{tokenId && (
							<div className="flex items-center gap-1 text-xs">
								<span className="text-muted-foreground text-xs">Token:</span>
								<span className="truncate font-medium">
									{tokenId.length > 8 ? `${tokenId.substring(0, 5)}...` : tokenId}
								</span>
							</div>
						)}

						{/* URL externa */}
						{url && (
							<div className="col-span-2 flex items-center gap-1 text-xs">
								<Link className="h-3.5 w-3.5 text-muted-foreground" />
								<span className="truncate font-medium text-blue-500 underline hover:text-blue-600">
									{url.replace(/https?:\/\/(www\.)?/, '').substring(0, 30)}
									{url.length > 30 && '...'}
								</span>
							</div>
						)}
					</div>

					{/* Ediciones disponibles */}
					{editionsList.length > 0 && (
						<div className="mt-1 border-t border-dashed pt-1" style={{ borderColor: `${primaryColor}20` }}>
							<div className="mb-1 flex items-center gap-1 text-muted-foreground text-xs">
								<Calendar className="h-3.5 w-3.5" />
								<span className="font-medium">Ediciones</span>
							</div>
							<ul className="scrollbar-thin max-h-12 space-y-0.5 overflow-y-auto overflow-x-hidden text-xs">
								{editionsList.slice(0, 2).map((edition: CollectionEdition) => (
									<li className="flex justify-between text-muted-foreground text-xs" key={edition.name}>
										<span className="truncate font-medium">{edition.name}</span>
										{edition.releaseDate && (
											<span className="ml-1 whitespace-nowrap text-muted-foreground">
												({new Date(edition.releaseDate).getFullYear()})
											</span>
										)}
									</li>
								))}

								{editionsList.length > 2 && (
									<li className="text-muted-foreground text-xs italic">...y {editionsList.length - 2} más</li>
								)}
							</ul>
						</div>
					)}
				</div>
			</div>

			{/* Decoración de esquina estilo TCG */}
			<div className="absolute right-1 bottom-1 h-4 w-4 opacity-70" style={{ color: primaryColor }}>
				<svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
