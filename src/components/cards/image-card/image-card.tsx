import { CalendarIcon, CameraIcon, FolderIcon, HashIcon, Image as ImageIcon, Info, Star, TagIcon } from 'lucide-react';
import { memo, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useImage } from '@/lib/api/images';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils/format.utils';
import { useImageResources } from '@/store/image-resources.store';
import type { ImageWithStats } from '@/types/entities/image';
import type { TagWithStats } from '@/types/entities/tag';

// ==========================
// Helpers de módulo
// ==========================
type AspectRatio = 'square' | 'auto' | 'video' | string;
type Variant = 'default' | 'minimal' | 'polaroid' | 'tcg';

const getAspectRatioClass = (aspectRatio: AspectRatio = 'auto'): string => {
	switch (aspectRatio) {
		case 'square':
			return 'aspect-square';
		case 'video':
			return 'aspect-video';
		case 'auto':
			return '';
		default: {
			if (typeof aspectRatio === 'string' && aspectRatio.includes('/')) {
				return `aspect-[${aspectRatio}]`;
			}
			return 'aspect-[3/2]';
		}
	}
};

// Partes pequeñas para Overlay
const NonTcgTitle = ({
	name,
	isFavorite,
	effectiveTcgMode,
}: {
	name?: string | null;
	isFavorite?: boolean;
	effectiveTcgMode: boolean;
}) => {
	if (effectiveTcgMode) {
		return null;
	}
	return (
		<h3 className="mb-1 line-clamp-1 font-medium text-sm text-white">
			{name || 'Sin título'}
			{isFavorite ? <Star className="-mt-1 ml-1 inline h-3.5 w-3.5 fill-yellow-300 text-yellow-300" /> : null}
		</h3>
	);
};

// Memoizado: evita re-render cuando las props no cambian.
const TechInfo = memo(function TechInfoComponent({
	humanDimensions,
	createdAt,
	cameraInfo,
}: {
	humanDimensions: string;
	createdAt?: string | Date | null;
	cameraInfo: string | null;
}) {
	return (
		<div className="flex flex-col gap-1 text-gray-200 text-xs">
			<div className="flex items-center gap-1.5">
				<Info className="h-3 w-3" />
				<span>{humanDimensions}</span>
			</div>
			{createdAt ? (
				<div className="flex items-center gap-1.5">
					<CalendarIcon className="h-3 w-3" />
					<span>{formatDate(createdAt)}</span>
				</div>
			) : null}
			{cameraInfo ? (
				<div className="flex items-center gap-1.5">
					<CameraIcon className="h-3 w-3" />
					<span className="max-w-[180px] truncate">{cameraInfo}</span>
				</div>
			) : null}
		</div>
	);
});

const TcgMetaBadges = ({
	effectiveTcgMode,
	metadataFormatUpper,
	size,
	hash,
}: {
	effectiveTcgMode: boolean;
	metadataFormatUpper: string | null;
	size?: number | null;
	hash?: string | null;
}) => {
	if (!effectiveTcgMode) {
		return null;
	}
	return (
		<div className="mt-1 flex flex-wrap gap-1.5">
			{metadataFormatUpper ? (
				<Badge className="h-4 border-none bg-black/40 px-1.5 py-0 text-[10px]" variant="outline">
					{metadataFormatUpper}
				</Badge>
			) : null}
			{size ? (
				<Badge className="h-4 border-none bg-black/40 px-1.5 py-0 text-[10px]" variant="outline">
					{Math.round(size / 1024)} KB
				</Badge>
			) : null}
			{hash ? (
				<Badge className="h-4 max-w-[60px] truncate border-none bg-black/40 px-1.5 py-0 text-[10px]" variant="outline">
					<HashIcon className="mr-1 h-2 w-2" />
					{hash.substring(0, 6)}
				</Badge>
			) : null}
		</div>
	);
};

const RelationsBadges = ({
	show,
	stats,
	totalRelations,
	visible,
}: {
	show: boolean;
	stats?: ImageWithStats['stats'];
	totalRelations: number;
	visible: boolean;
}) => {
	if (!(show && visible)) {
		return null;
	}
	return (
		<div className="mt-2 flex items-center gap-2">
			{stats?.tagCount && stats.tagCount > 0 ? (
				<Badge className="gap-1 border-none bg-black/40" variant="secondary">
					<TagIcon className="h-3 w-3" />
					{stats.tagCount}
				</Badge>
			) : null}
			{stats?.albumCount && stats.albumCount > 0 ? (
				<Badge className="gap-1 border-none bg-black/40" variant="secondary">
					<FolderIcon className="h-3 w-3" />
					{stats.albumCount}
				</Badge>
			) : null}
			{totalRelations > 0 ? (
				<Badge className="border-none bg-black/40 px-1.5" variant="secondary">
					{totalRelations}
				</Badge>
			) : null}
		</div>
	);
};

const getVariantClasses = (variant: Variant = 'default'): string => {
	switch (variant) {
		case 'minimal':
			return 'border-0 shadow-none bg-transparent';
		case 'polaroid':
			return 'border-8 border-white dark:border-gray-800 bg-white dark:bg-gray-800 shadow-md p-1 rotate-1';
		case 'tcg':
			return 'border border-gray-800/20 shadow-lg bg-gradient-to-b from-gray-900 to-black text-white';
		default:
			return 'border border-gray-200 dark:border-gray-800 bg-card';
	}
};

const getPrimaryColorFromTags = (tags?: TagWithStats[]): string => {
	if (tags && tags.length > 0) {
		return tags[0].color || '#3b82f6';
	}
	return '#3b82f6';
};

const safeParseMetadata = (metadataStr?: string | null): any | null => {
	try {
		return metadataStr ? JSON.parse(metadataStr) : null;
	} catch {
		return null;
	}
};

const getCameraInfoFromMetadata = (metadataStr?: string | null): string | null => {
	const md = safeParseMetadata(metadataStr);
	if (md?.camera?.make || md?.camera?.model) {
		return `${md.camera.make || ''} ${md.camera.model || ''}`.trim();
	}
	return null;
};

const getMetadataFormatUpper = (metadataStr?: string | null): string | null => {
	const md = safeParseMetadata(metadataStr);
	return md?.format ? String(md.format).toUpperCase() : null;
};

const computeOverlayOpacityClass = (effectiveTcgMode: boolean, isHovered: boolean): string => {
	if (effectiveTcgMode) {
		return 'opacity-70 group-hover:opacity-90';
	}
	if (isHovered) {
		return 'opacity-100';
	}
	return 'opacity-0';
};

const getHumanReadableDimensionsFromImage = (image: ImageWithStats): string => {
	if (!(image?.width && image?.height)) {
		return '';
	}
	return `${image.width} × ${image.height}`;
};

const getTotalRelationsCountFromStats = (stats: ImageWithStats['stats'] | undefined): number => {
	if (!stats) {
		return 0;
	}
	return (
		(stats.tagCount || 0) +
		(stats.albumCount || 0) +
		(stats.collectionCount || 0) +
		(stats.characterCount || 0) +
		(stats.placeCount || 0) +
		(stats.worldItemCount || 0) +
		(stats.noteCount || 0)
	);
};

// ==========================
// Subcomponentes puros
// ==========================
interface TcgChromeProps {
	primaryColor: string;
	imageName?: string | null;
	metadataFormatUpper?: string | null;
}

const TcgChrome = ({ primaryColor, imageName, metadataFormatUpper }: TcgChromeProps) => (
	<>
		<div
			className="pointer-events-none absolute top-0 left-0 z-20 h-5 w-5 rounded-tl-md border-t-2 border-l-2"
			style={{ borderColor: `${primaryColor}70` }}
		/>
		<div
			className="pointer-events-none absolute top-0 right-0 z-20 h-5 w-5 rounded-tr-md border-t-2 border-r-2"
			style={{ borderColor: `${primaryColor}70` }}
		/>
		<div
			className="pointer-events-none absolute bottom-0 left-0 z-20 h-5 w-5 rounded-bl-md border-b-2 border-l-2"
			style={{ borderColor: `${primaryColor}70` }}
		/>
		<div
			className="pointer-events-none absolute right-0 bottom-0 z-20 h-5 w-5 rounded-br-md border-r-2 border-b-2"
			style={{ borderColor: `${primaryColor}70` }}
		/>
		<div
			className="pointer-events-none absolute inset-0 z-10 rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100"
			style={{ boxShadow: `inset 0 0 0 1px ${primaryColor}50, 0 0 15px ${primaryColor}30` }}
		/>
		<div
			className="absolute top-0 right-0 left-0 z-20 h-8 bg-gradient-to-r"
			style={{ background: `linear-gradient(to right, ${primaryColor}90, ${primaryColor}30)` }}
		>
			<div className="flex h-full items-center justify-between px-2">
				<span className="max-w-[70%] truncate font-medium text-white text-xs">{imageName || 'Sin título'}</span>
				<div className="flex items-center gap-1">
					{metadataFormatUpper ? (
						<span className="rounded bg-black/30 px-1.5 py-0.5 text-[10px] text-white/90 uppercase">
							{metadataFormatUpper}
						</span>
					) : null}
				</div>
			</div>
		</div>
	</>
);

// ===== Subcomponentes a nivel de módulo =====
interface LoadingCardProps {
	aspectRatio: AspectRatio;
	variant: Variant;
	className?: string;
}

const LoadingCard = ({ aspectRatio, variant, className }: LoadingCardProps) => (
	<div
		className={cn(
			'relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-900',
			getAspectRatioClass(aspectRatio),
			getVariantClasses(variant),
			className
		)}
	>
		<Skeleton className="h-full w-full" />
	</div>
);

interface ErrorCardProps {
	aspectRatio: AspectRatio;
	variant: Variant;
	className?: string;
	message?: string;
}

const ErrorCard = ({ aspectRatio, variant, className, message }: ErrorCardProps) => (
	<div
		className={cn(
			'relative flex items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-900',
			getAspectRatioClass(aspectRatio),
			getVariantClasses(variant),
			className
		)}
	>
		<div className="p-4 text-center">
			<ImageIcon className="mx-auto mb-2 h-10 w-10 text-gray-400" />
			<p className="text-gray-500 text-sm">{message || 'No se pudo cargar la imagen'}</p>
		</div>
	</div>
);

interface ThumbnailAreaProps {
	displayThumbnailUrl: string | null;
	shouldShowThumbnailLoading: boolean;
	effectiveTcgMode: boolean;
	setThumbnailLoading: (v: boolean) => void;
}

const ThumbnailArea = ({
	displayThumbnailUrl,
	shouldShowThumbnailLoading,
	effectiveTcgMode,
	setThumbnailLoading,
}: ThumbnailAreaProps) => (
	<div className="relative h-full w-full">
		{shouldShowThumbnailLoading ? (
			<div className={cn('absolute inset-0 z-10', effectiveTcgMode && 'pt-8')}>
				<Skeleton className="h-full w-full" />
			</div>
		) : null}

		{displayThumbnailUrl ? (
			<img
				alt="imagen"
				className={cn(
					'h-full w-full object-cover',
					effectiveTcgMode && 'pt-8',
					shouldShowThumbnailLoading && 'opacity-0'
				)}
				loading="lazy"
				onError={(e) => {
					const imgElement = e.currentTarget as HTMLImageElement;
					imgElement.style.display = 'none';
					const parent = imgElement.parentElement;
					if (parent) {
						parent.innerHTML = `
						<div class="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900 ${effectiveTcgMode ? 'pt-8' : ''}">
							<svg class="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
							</svg>
						</div>
					`;
					}
					setThumbnailLoading(false);
				}}
				onLoad={() => {
					setThumbnailLoading(false);
				}}
				src={displayThumbnailUrl}
			/>
		) : (
			<div
				className={cn(
					'flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-900',
					effectiveTcgMode && 'pt-8'
				)}
			>
				<ImageIcon className="h-10 w-10 text-gray-400" />
			</div>
		)}
	</div>
);

interface DetailsOverlayProps {
	showDetails: boolean;
	effectiveTcgMode: boolean;
	isHovered: boolean;
	imageData: ImageWithStats;
	humanDimensions: string;
	cameraInfo: string | null;
	metadataFormatUpper: string | null;
	showRelations: boolean;
	totalRelations: number;
}

const DetailsOverlay = memo(function DetailsOverlayComponent({
	showDetails,
	effectiveTcgMode,
	isHovered,
	imageData,
	humanDimensions,
	cameraInfo,
	metadataFormatUpper,
	showRelations,
	totalRelations,
}: DetailsOverlayProps) {
	if (!showDetails) {
		return null;
	}
	const visible = effectiveTcgMode || isHovered;
	return (
		<div
			className={cn(
				'absolute inset-0 bg-gradient-to-t from-black/70 to-transparent transition-opacity',
				computeOverlayOpacityClass(effectiveTcgMode, isHovered)
			)}
		>
			<div className="absolute right-0 bottom-0 left-0 p-3">
				<NonTcgTitle effectiveTcgMode={effectiveTcgMode} isFavorite={imageData.isFavorite} name={imageData.name} />
				<TechInfo cameraInfo={cameraInfo} createdAt={imageData.createdAt} humanDimensions={humanDimensions} />
				<TcgMetaBadges
					effectiveTcgMode={effectiveTcgMode}
					hash={imageData.hash}
					metadataFormatUpper={metadataFormatUpper}
					size={imageData.size}
				/>
				<RelationsBadges
					show={showRelations}
					stats={imageData.stats}
					totalRelations={totalRelations}
					visible={visible}
				/>
			</div>
		</div>
	);
});

interface TcgStyleBlockProps {
	effectiveTcgMode: boolean;
	imageData: ImageWithStats;
	showTags: boolean;
}

const TcgStyleBlock = ({ effectiveTcgMode, imageData, showTags }: TcgStyleBlockProps) => {
	if (!effectiveTcgMode) {
		return null;
	}
	return (
		<div className="pointer-events-none absolute inset-0">
			<div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 opacity-60" />
			<div className="absolute inset-0 h-[20%] bg-gradient-to-b from-white/10 to-transparent opacity-60" />
			<div className="absolute right-0 bottom-0 left-0 h-16 bg-gradient-to-t from-black to-transparent pt-2">
				{showTags && imageData.tags && imageData.tags.length > 0 ? (
					<div className="px-3">
						<div className="mb-1 flex flex-wrap gap-1">
							{imageData.tags?.slice(0, 3).map((tag: TagWithStats) => (
								<Badge
									className="h-4 py-0 text-[10px]"
									key={tag.id}
									style={{ backgroundColor: `${tag.color}20`, borderColor: `${tag.color}40`, color: `${tag.color}` }}
									variant="outline"
								>
									{tag.name}
								</Badge>
							))}
							{imageData.tags && imageData.tags.length > 3 ? (
								<Badge className="h-4 border-gray-700/60 bg-gray-800/60 py-0 text-[10px]" variant="outline">
									+{imageData.tags ? imageData.tags.length - 3 : 0}
								</Badge>
							) : null}
						</div>
					</div>
				) : null}
			</div>
			{imageData.isFavorite ? (
				<div className="absolute top-9 right-2 rotate-12 transform">
					<Star className="h-5 w-5 fill-yellow-300 text-yellow-300 drop-shadow-md" />
				</div>
			) : null}
		</div>
	);
};

interface StandardTagsBlockProps {
	showTags: boolean;
	imageData: ImageWithStats;
	isHovered: boolean;
	effectiveTcgMode: boolean;
}

const StandardTagsBlock = ({ showTags, imageData, isHovered, effectiveTcgMode }: StandardTagsBlockProps) => {
	if (!(showTags && imageData.tags && imageData.tags.length > 0 && !effectiveTcgMode)) {
		return null;
	}
	return (
		<div
			className={cn(
				'absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-10',
				isHovered ? 'opacity-100' : 'opacity-0',
				'transition-opacity duration-300'
			)}
		>
			<div className="flex flex-wrap gap-1">
				{imageData.tags?.slice(0, 5).map((tag: TagWithStats) => (
					<Badge
						className="h-5 py-0 text-[10px]"
						key={tag.id}
						style={{ backgroundColor: `${tag.color}30`, borderColor: `${tag.color}40`, color: `${tag.color}` }}
						variant="outline"
					>
						{tag.name}
					</Badge>
				))}
				{imageData.tags && imageData.tags.length > 5 ? (
					<Badge className="h-5 border-gray-700/60 bg-gray-800/60 py-0 text-[10px]" variant="outline">
						+{imageData.tags ? imageData.tags.length - 5 : 0}
					</Badge>
				) : null}
			</div>
		</div>
	);
};

// CardContent: encapsula el contenido del botón
interface CardContentProps {
	ariaDescribedBy?: string;
	ariaLabel?: string;
	aspectRatio: AspectRatio;
	variant: Variant;
	isHovered: boolean;
	setIsHovered: (v: boolean) => void;
	className?: string;
	dataItemId?: string;
	disabled?: boolean;
	onClick?: () => void;
	onContextMenu?: (e: React.MouseEvent) => void;
	onDoubleClick?: () => void;
	onKeyDown?: (e: React.KeyboardEvent) => void;
	role?: string;
	tabIndex?: number;
	effectiveTcgMode: boolean;
	displayThumbnailUrl: string | null;
	shouldShowThumbnailLoading: boolean;
	setThumbnailLoading: (v: boolean) => void;
	showDetails: boolean;
	imageData: ImageWithStats;
	humanDimensions: string;
	cameraInfo: string | null;
	metadataFormatUpper: string | null;
	showRelations: boolean;
	totalRelations: number;
	showTags: boolean;
	primaryColor: string;
}

const CardContent = ({
	ariaDescribedBy,
	ariaLabel,
	aspectRatio,
	variant,
	isHovered,
	setIsHovered,
	className,
	dataItemId,
	disabled,
	onClick,
	onContextMenu,
	onDoubleClick,
	onKeyDown,
	role,
	tabIndex,
	effectiveTcgMode,
	displayThumbnailUrl,
	shouldShowThumbnailLoading,
	setThumbnailLoading,
	showDetails,
	imageData,
	humanDimensions,
	cameraInfo,
	metadataFormatUpper,
	showRelations,
	totalRelations,
	showTags,
	primaryColor,
}: CardContentProps) => (
	<CardButton
		ariaDescribedBy={ariaDescribedBy}
		ariaLabel={ariaLabel}
		aspectRatio={aspectRatio}
		className={className}
		dataItemId={dataItemId}
		disabled={disabled}
		isHovered={isHovered}
		onClick={onClick}
		onContextMenu={onContextMenu}
		onDoubleClick={onDoubleClick}
		onKeyDown={onKeyDown}
		role={role}
		setIsHovered={setIsHovered}
		tabIndex={tabIndex}
		variant={variant}
	>
		{effectiveTcgMode ? (
			<TcgChrome imageName={imageData.name} metadataFormatUpper={metadataFormatUpper} primaryColor={primaryColor} />
		) : null}
		<ThumbnailArea
			displayThumbnailUrl={displayThumbnailUrl}
			effectiveTcgMode={effectiveTcgMode}
			setThumbnailLoading={setThumbnailLoading}
			shouldShowThumbnailLoading={shouldShowThumbnailLoading}
		/>
		{showDetails ? (
			<DetailsOverlay
				cameraInfo={cameraInfo}
				effectiveTcgMode={effectiveTcgMode}
				humanDimensions={humanDimensions}
				imageData={imageData}
				isHovered={isHovered}
				metadataFormatUpper={metadataFormatUpper}
				showDetails={showDetails}
				showRelations={showRelations}
				totalRelations={totalRelations}
			/>
		) : null}
		<TcgStyleBlock effectiveTcgMode={effectiveTcgMode} imageData={imageData} showTags={showTags} />
		<StandardTagsBlock
			effectiveTcgMode={effectiveTcgMode}
			imageData={imageData}
			isHovered={isHovered}
			showTags={showTags}
		/>
	</CardButton>
);

// Subcomponente: botón contenedor con estilos comunes
interface CardButtonProps {
	ariaDescribedBy?: string;
	ariaLabel?: string;
	aspectRatio: AspectRatio;
	variant: Variant;
	isHovered: boolean;
	setIsHovered: (v: boolean) => void;
	className?: string;
	dataItemId?: string;
	disabled?: boolean;
	onClick?: () => void;
	onContextMenu?: (e: React.MouseEvent) => void;
	onDoubleClick?: () => void;
	onKeyDown?: (e: React.KeyboardEvent) => void;
	role?: string;
	tabIndex?: number;
	children: React.ReactNode;
	/** Indica si debe exponerse como elemento interactivo (role=button, tabIndex=0). Evita nested buttons. */
	interactive?: boolean;
}

const CardButton = ({
	ariaDescribedBy,
	ariaLabel,
	aspectRatio,
	variant,
	isHovered,
	setIsHovered,
	className,
	dataItemId,
	disabled,
	onClick,
	onContextMenu,
	onDoubleClick,
	onKeyDown,
	role,
	children,
	interactive = true,
}: CardButtonProps) => {
	const isInteractive = interactive && !disabled && (onClick || onDoubleClick);
	// Cuando es interactivo usamos un button semántico (evita necesidad de role/teclado custom)
	if (isInteractive) {
		return (
			<button
				aria-describedby={ariaDescribedBy}
				type="button"
				// aria-label solo si se provee (button lo soporta). Evitar aria-label vacío.
				{...(ariaLabel ? { 'aria-label': ariaLabel } : {})}
				className={cn(
					'group relative h-full w-full overflow-hidden rounded-lg border-0 bg-transparent p-0 transition-all duration-300',
					getAspectRatioClass(aspectRatio),
					getVariantClasses(variant),
					isHovered ? 'scale-[1.02] shadow-lg' : 'hover:scale-[1.02] hover:shadow-lg',
					'cursor-pointer',
					className
				)}
				data-item-id={dataItemId}
				disabled={disabled}
				onClick={onClick}
				onContextMenu={onContextMenu}
				onDoubleClick={onDoubleClick}
				onKeyDown={onKeyDown}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
			>
				{children}
			</button>
		);
	}

	// No interactivo: contenedor de grupo (sin role button ni aria-label que cause advertencias)
	return (
		<div
			aria-describedby={ariaDescribedBy}
			className={cn(
				'group relative h-full w-full select-none overflow-hidden rounded-lg border-0 bg-transparent p-0 transition-all duration-300',
				getAspectRatioClass(aspectRatio),
				getVariantClasses(variant),
				isHovered ? 'scale-[1.02] shadow-lg' : 'hover:scale-[1.02] hover:shadow-lg',
				className
			)}
			data-item-id={dataItemId}
			role={role || 'group'}
		>
			{children}
		</div>
	);
};

interface ImageCardProps {
	imageId: string;
	onClick?: (imageData?: ImageWithStats) => void;
	onDoubleClick?: () => void;
	onContextMenu?: (e: React.MouseEvent) => void;
	className?: string;
	showTags?: boolean;
	showDetails?: boolean;
	aspectRatio?: 'square' | 'auto' | 'video' | string;
	variant?: 'default' | 'minimal' | 'polaroid' | 'tcg';
	tcgMode?: boolean;
	showRelations?: boolean;
	/** Calidad de thumbnail preferida */
	thumbnailQuality?: 'low' | 'medium' | 'high';
	// Props adicionales para accesibilidad y funcionalidad
	'data-item-id'?: string;
	role?: string;
	tabIndex?: number;
	'aria-label'?: string;
	'aria-selected'?: boolean;
	'aria-describedby'?: string;
	onKeyDown?: (e: React.KeyboardEvent) => void;
}

/**
 * Card para mostrar una imagen con sus metadatos principales.
 * Incluye opción de estilo TCG (Trading Card Game) para una visualización
 * más atractiva e inmersiva.
 */
export const ImageCard = memo(
	function ImageCardComponent({
		imageId,
		onClick,
		onDoubleClick,
		onContextMenu,
		className,
		showTags = true,
		showDetails = true,
		aspectRatio = 'auto',
		variant = 'default',
		tcgMode = false,
		showRelations = false,
		'data-item-id': dataItemId,
		role,
		tabIndex,
		'aria-label': ariaLabel,
		'aria-describedby': ariaDescribedBy,
		onKeyDown,
	}: ImageCardProps) {
		const { data: imageData, isLoading, error } = useImage(imageId);
		const [isHovered, setIsHovered] = useState(false);
		const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
		const [thumbnailLoading, setThumbnailLoading] = useState(false);

		// Hook para manejar recursos de imagen (thumbnails)
		const { getThumbnail, isLoading: isResourceLoading } = useImageResources();

		// Si variant es tcg, forzar modo TCG efectivo sin modificar la prop
		const effectiveTcgMode = tcgMode || variant === 'tcg';

		// Cargar thumbnail usando useImageResources
		useEffect(() => {
			const loadThumbnail = async () => {
				if (!imageId || thumbnailUrl) {
					return;
				}

				setThumbnailLoading(true);
				try {
					const url = await getThumbnail(imageId);
					if (url) {
						setThumbnailUrl(url);
					}
				} catch (_err) {
					// noop
				} finally {
					setThumbnailLoading(false);
				}
			};

			loadThumbnail();
		}, [imageId, getThumbnail, thumbnailUrl]);

		const handleClick = () => {
			if (onClick && imageData) {
				onClick(imageData);
			}
		};

		const handleDoubleClick = () => {
			if (onDoubleClick) {
				onDoubleClick();
			}
		};

		// Hooks (useMemo) deben ejecutarse SIEMPRE antes de cualquier return temprano
		// para mantener orden de hooks estable entre renders (evita error "Rendered more hooks...")
		const primaryColor = useMemo(
			() => getPrimaryColorFromTags(imageData?.tags),
			// Dependemos del array de tags (o undefined)
			[imageData?.tags]
		);
		const cameraInfo = useMemo(() => (imageData ? getCameraInfoFromMetadata(imageData.metadata) : null), [imageData]);
		const metadataFormatUpper = useMemo(
			() => (imageData ? getMetadataFormatUpper(imageData.metadata) : null),
			[imageData]
		);
		const humanDimensions = useMemo(
			() => (imageData ? getHumanReadableDimensionsFromImage(imageData) : ''),
			[imageData]
		);
		const totalRelations = useMemo(
			() => (imageData ? getTotalRelationsCountFromStats(imageData.stats) : 0),
			[imageData]
		);

		// Renderizar cargando
		if (isLoading) {
			return <LoadingCard aspectRatio={aspectRatio} className={className} variant={variant} />;
		}

		// Renderizar error
		if (error || !imageData) {
			return <ErrorCard aspectRatio={aspectRatio} className={className} message={error?.message} variant={variant} />;
		}

		// Determinar la URL del thumbnail a usar (seguro: imageData definido tras return anterior)
		const displayThumbnailUrl = thumbnailUrl || imageData.thumbnailUrl || `/api/images/${imageData.id}/thumbnail`;
		const shouldShowThumbnailLoading = thumbnailLoading || isResourceLoading(imageId);

		const cardContent = (
			<CardContent
				ariaDescribedBy={ariaDescribedBy}
				ariaLabel={ariaLabel}
				aspectRatio={aspectRatio}
				cameraInfo={cameraInfo}
				className={className}
				dataItemId={dataItemId}
				disabled={!(onClick || onDoubleClick)}
				displayThumbnailUrl={displayThumbnailUrl}
				effectiveTcgMode={effectiveTcgMode}
				humanDimensions={humanDimensions}
				imageData={imageData}
				isHovered={isHovered}
				metadataFormatUpper={metadataFormatUpper}
				onClick={handleClick}
				onContextMenu={onContextMenu}
				onDoubleClick={handleDoubleClick}
				onKeyDown={onKeyDown}
				primaryColor={primaryColor}
				role={role}
				setIsHovered={setIsHovered}
				setThumbnailLoading={setThumbnailLoading}
				shouldShowThumbnailLoading={shouldShowThumbnailLoading}
				showDetails={showDetails}
				showRelations={showRelations}
				showTags={showTags}
				tabIndex={tabIndex}
				totalRelations={totalRelations}
				variant={variant}
			/>
		);

		// Si hay un onClick o onDoubleClick, devolver directamente el contenido
		if (onClick || onDoubleClick) {
			return cardContent;
		}

		// Si no hay onClick, envolver en un Link (si route es proporcionado)
		return (
			<div className={className}>
				<Link to={`/images/${imageId}`}>{cardContent}</Link>
			</div>
		);
	},
	(prevProps, nextProps) => {
		// Comparación personalizada para optimizar renders
		// Si el imageId es el mismo, y las props básicas no han cambiado, evitar re-render
		if (prevProps.imageId !== nextProps.imageId) {
			return false;
		}
		if (prevProps.className !== nextProps.className) {
			return false;
		}
		if (prevProps.showTags !== nextProps.showTags) {
			return false;
		}
		if (prevProps.showDetails !== nextProps.showDetails) {
			return false;
		}
		if (prevProps.aspectRatio !== nextProps.aspectRatio) {
			return false;
		}
		if (prevProps.variant !== nextProps.variant) {
			return false;
		}
		if (prevProps.tcgMode !== nextProps.tcgMode) {
			return false;
		}
		if (prevProps.showRelations !== nextProps.showRelations) {
			return false;
		}
		if (prevProps['data-item-id'] !== nextProps['data-item-id']) {
			return false;
		}

		// Ignorar cambios en funciones callback si el imageId es el mismo
		// Esto evita re-renders innecesarios cuando solo cambian las funciones
		return true;
	}
);
