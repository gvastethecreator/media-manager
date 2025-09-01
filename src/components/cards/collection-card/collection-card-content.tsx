import { Bookmark, Calendar, Currency, Diamond, Globe, Link, Tag } from 'lucide-react';
import { motion } from '@/components/ui/motion-shim';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import type { CollectionEdition } from '@/types/entities/collection';

// Regex para limpiar URLs (extraído a nivel superior para mejor performance)
const URL_PROTOCOL_REGEX = /https?:\/\/(www\.)?/;

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
export function CollectionCardContent(props: CollectionCardContentProps) {
	const state = useCollectionContentState(props);
	return <CollectionCardContentView {...state} />;
}

interface CollectionContentState extends CollectionCardContentProps {
	editionsList: CollectionEdition[];
	formattedPrice: string | null;
	backgroundImage?: string | null;
	derivedSecondaryColor: string;
	rarityColors: { border: string; background: string; text: string };
}

function useCollectionContentState(props: CollectionCardContentProps): CollectionContentState {
	const { editions, price, featuredImage, sourceImage, secondaryColor, primaryColor, metadata } = props;
	const editionsList = useMemo(() => parseEditions(editions), [editions]);
	const formattedPrice = useMemo(() => formatPrice(price), [price]);
	const backgroundImage = featuredImage || sourceImage;
	const derivedSecondaryColor = secondaryColor || `${primaryColor}90`;
	const rarityColors = getRarityColors(metadata?.rarityLevel || 'Common');
	return { ...props, editionsList, formattedPrice, backgroundImage, derivedSecondaryColor, rarityColors };
}

// Helpers puros
function parseEditions(editions?: CollectionEdition[] | string | null): CollectionEdition[] {
	if (typeof editions === 'string' && editions !== 'empty_array') {
		try {
			return JSON.parse(editions);
		} catch {
			return [];
		}
	}
	return (editions as CollectionEdition[]) || [];
}

function formatPrice(price?: number | null): string | null {
	if (!price) {
		return null;
	}
	return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(price);
}

// Presentacional principal
const CollectionCardContentView: React.FC<CollectionContentState> = ({
	description,
	platform,
	network,
	tokenId,
	url,
	primaryColor,
	editionsList,
	formattedPrice,
	backgroundImage,
	derivedSecondaryColor,
	rarityColors,
	metadata,
}) => {
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
			{backgroundImage && <div className="absolute inset-0 z-0 bg-black/30" />}
			<div className="relative z-10 flex h-full flex-col">
				{metadata && <RarityBadge metadata={metadata} rarityColors={rarityColors} />}
				{description && <Description primaryColor={primaryColor} text={description} />}
				{metadata && <Counters metadata={metadata} rarityColors={rarityColors} />}
				<PropertiesBox
					backgroundColor={`${primaryColor}15`}
					borderColor={`${primaryColor}30`}
					boxShadowColor={`${derivedSecondaryColor}30`}
				>
					<PropertiesGrid
						formattedPrice={formattedPrice}
						network={network}
						platform={platform}
						primaryColor={primaryColor}
						tokenId={tokenId}
						url={url}
					/>
					<EditionsList editionsList={editionsList} primaryColor={primaryColor} />
				</PropertiesBox>
			</div>
			<CornerDecoration primaryColor={primaryColor} />
		</div>
	);
};

// Subcomponentes
const RarityBadge: React.FC<{
	metadata: NonNullable<CollectionCardContentProps['metadata']>;
	rarityColors: { border: string; background: string; text: string };
}> = ({ metadata, rarityColors }) => (
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
);

const Description: React.FC<{ text: string; primaryColor: string }> = ({ text, primaryColor }) => (
	<div className="mb-2 line-clamp-3 text-xs leading-relaxed" style={{ color: `${primaryColor}DD` }}>
		<p className="italic">{text}</p>
	</div>
);

const Counters: React.FC<{
	metadata: NonNullable<CollectionCardContentProps['metadata']>;
	rarityColors: { border: string };
}> = ({ metadata, rarityColors }) => (
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
);

const PropertiesBox: React.FC<{
	children: React.ReactNode;
	borderColor: string;
	backgroundColor: string;
	boxShadowColor: string;
}> = ({ children, borderColor, backgroundColor, boxShadowColor }) => (
	<div
		className="mt-auto space-y-1.5 rounded-sm border-t p-1 pt-1 text-xs"
		style={{ borderColor, backgroundColor, boxShadow: `inset 0 0 10px ${boxShadowColor}` }}
	>
		{children}
	</div>
);

interface PropertiesGridProps {
	platform?: string | null;
	formattedPrice: string | null;
	network?: string | null;
	tokenId?: string | null;
	url?: string | null;
	primaryColor: string;
}

const PropertiesGrid: React.FC<PropertiesGridProps> = ({ platform, formattedPrice, network, tokenId, url }) => (
	<div className="grid grid-cols-2 gap-1">
		{platform && <PlatformItem platform={platform} />}
		{formattedPrice && <PriceItem price={formattedPrice} />}
		{network && <NetworkItem network={network} />}
		{tokenId && <TokenItem tokenId={tokenId} />}
		{url && <UrlItem url={url} />}
	</div>
);

const PlatformItem: React.FC<{ platform: string }> = ({ platform }) => (
	<div className="flex items-center gap-1 text-xs">
		<Globe className="h-3.5 w-3.5 text-muted-foreground" />
		<span className="truncate font-medium">{platform}</span>
	</div>
);
const PriceItem: React.FC<{ price: string }> = ({ price }) => (
	<div className="flex items-center gap-1 text-xs">
		<Tag className="h-3.5 w-3.5 text-muted-foreground" />
		<span className="font-medium">{price}</span>
	</div>
);
const NetworkItem: React.FC<{ network: string }> = ({ network }) => (
	<div className="flex items-center gap-1 text-xs">
		<Currency className="h-3.5 w-3.5 text-muted-foreground" />
		<span className="truncate font-medium">{network}</span>
	</div>
);
const TokenItem: React.FC<{ tokenId: string }> = ({ tokenId }) => (
	<div className="flex items-center gap-1 text-xs">
		<span className="text-muted-foreground text-xs">Token:</span>
		<span className="truncate font-medium">{tokenId.length > 8 ? `${tokenId.substring(0, 5)}...` : tokenId}</span>
	</div>
);
const UrlItem: React.FC<{ url: string }> = ({ url }) => (
	<div className="col-span-2 flex items-center gap-1 text-xs">
		<Link className="h-3.5 w-3.5 text-muted-foreground" />
		<span className="truncate font-medium text-blue-500 underline hover:text-blue-600">
			{url.replace(URL_PROTOCOL_REGEX, '').substring(0, 30)}
			{url.length > 30 && '...'}
		</span>
	</div>
);

const EditionsList: React.FC<{ editionsList: CollectionEdition[]; primaryColor: string }> = ({
	editionsList,
	primaryColor,
}) => {
	if (editionsList.length === 0) {
		return null;
	}
	return (
		<div className="mt-1 border-t border-dashed pt-1" style={{ borderColor: `${primaryColor}20` }}>
			<div className="mb-1 flex items-center gap-1 text-muted-foreground text-xs">
				<Calendar className="h-3.5 w-3.5" />
				<span className="font-medium">Ediciones</span>
			</div>
			<ul className="scrollbar-thin max-h-12 space-y-0.5 overflow-y-auto overflow-x-hidden text-xs">
				{editionsList.slice(0, 2).map((edition) => (
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
	);
};

const CornerDecoration: React.FC<{ primaryColor: string }> = ({ primaryColor }) => (
	<div className="absolute right-1 bottom-1 h-4 w-4 opacity-70" style={{ color: primaryColor }}>
		<svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
			<path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
			<path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
		</svg>
	</div>
);

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
