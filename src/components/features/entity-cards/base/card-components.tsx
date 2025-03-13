'use client';

import { formatBytes } from '@/lib/utils/utils';
import { cn } from '@/lib/utils/utils';
import { CalendarClock, Clock, HardDrive, ImageIcon } from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';
import { type EntityStats, type RarityLevel, getRandomThumbnailPattern } from '../config/base-card-config';

// Componente para mostrar el distintivo de rareza
interface RarityBadgeProps {
	rarity: RarityLevel;
	value?: number | string;
	showValue?: boolean;
	size?: 'sm' | 'md' | 'lg';
	icon?: React.ReactNode;
	className?: string;
}

export function RarityBadge({ rarity, value, showValue = true, size = 'md', icon, className }: RarityBadgeProps) {
	const sizeClasses = {
		sm: 'w-8 h-8 text-xs',
		md: 'w-10 h-10 text-sm',
		lg: 'w-12 h-12 text-base',
	};

	return (
		<div
			className={cn(
				'rounded-full bg-background/90 backdrop-blur-sm border-2 flex items-center justify-center shadow-lg overflow-hidden relative',
				rarity.borderColor,
				sizeClasses[size],
				className
			)}
		>
			<div className={cn('absolute inset-0 opacity-70', rarity.badgeClass)} />
			<div className="relative font-semibold text-white drop-shadow-sm z-10 flex items-center justify-center">
				{icon ? icon : showValue ? value : rarity.label.charAt(0)}
			</div>
		</div>
	);
}

// Barra de poder/nivel basada en rareza
interface PowerBarProps {
	power: number;
	maxPower?: number;
	rarity: RarityLevel;
	showValue?: boolean;
	className?: string;
}

export function PowerBar({ power, maxPower = 12, rarity, showValue = true, className }: PowerBarProps) {
	return (
		<div className={cn('flex items-center gap-2', className)}>
			<div className="flex-1 bg-muted h-2 rounded-full overflow-hidden">
				<div className={cn('h-full rounded-full', rarity.barClass)} style={{ width: `${(power / maxPower) * 100}%` }} />
			</div>
			{showValue && (
				<div className="text-xs font-semibold">
					{power}/{maxPower}
				</div>
			)}
		</div>
	);
}

// Componente para mostrar estadísticas de entidades
interface EntityStatsDisplayProps {
	stats: EntityStats;
	className?: string;
	layout?: 'grid' | 'inline';
}

export function EntityStatsDisplay({ stats, className, layout = 'grid' }: EntityStatsDisplayProps) {
	if (layout === 'inline') {
		return (
			<div className={cn('flex items-center gap-3 text-xs', className)}>
				{stats.imageCount !== undefined && (
					<div className="flex items-center gap-1">
						<ImageIcon className="h-3.5 w-3.5" />
						<span>{stats.imageCount}</span>
					</div>
				)}
				{stats.size !== undefined && (
					<div className="flex items-center gap-1">
						<HardDrive className="h-3.5 w-3.5" />
						<span>{formatBytes(stats.size, 0)}</span>
					</div>
				)}
				{stats.ageText && (
					<div className="flex items-center gap-1">
						<CalendarClock className="h-3.5 w-3.5" />
						<span>{stats.ageText}</span>
					</div>
				)}
				{stats.lastUpdated && (
					<div className="flex items-center gap-1">
						<Clock className="h-3.5 w-3.5" />
						<span>{stats.lastUpdated.toLocaleDateString()}</span>
					</div>
				)}
				{stats.customStats?.map((stat) => (
					<div key={`custom-stat-${stat.id || stat.label}`} className="flex items-center gap-1">
						{stat.icon}
						<span>{stat.value}</span>
					</div>
				))}
			</div>
		);
	}

	return (
		<div className={cn('grid grid-cols-3 gap-3', className)}>
			{stats.imageCount !== undefined && (
				<div className="flex flex-col items-center">
					<div className="text-xl font-bold">{stats.imageCount}</div>
					<div className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
						<ImageIcon className="h-3 w-3" />
						Imágenes
					</div>
				</div>
			)}
			{stats.ageText && (
				<div className="flex flex-col items-center">
					<div className="text-xl font-bold">{stats.ageText}</div>
					<div className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
						<CalendarClock className="h-3 w-3" />
						Edad
					</div>
				</div>
			)}
			{stats.size !== undefined && (
				<div className="flex flex-col items-center">
					<div className="text-xl font-bold">{formatBytes(stats.size, 0)}</div>
					<div className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
						<HardDrive className="h-3 w-3" />
						Tamaño
					</div>
				</div>
			)}
			{stats.customStats?.map((stat) => {
				const customIconProps = {
					className: 'h-3 w-3',
				};

				return (
					<div key={`stat-${stat.id || stat.label}`} className="flex flex-col items-center">
						<div className="text-xl font-bold">{stat.value}</div>
						<div className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
							{React.isValidElement(stat.icon) ? React.cloneElement(stat.icon, customIconProps) : stat.icon}
							{stat.label}
						</div>
					</div>
				);
			})}
		</div>
	);
}

// Componente para mostrar una grid de miniaturas
interface ThumbnailGridProps {
	images?: Array<string | null>;
	fallbackIcon?: React.ReactNode;
	rows?: number;
	cols?: number;
	rarity?: RarityLevel;
	className?: string;
	itemClassName?: string;
	aspectRatio?: 'square' | 'video' | 'widescreen';
	onImageClick?: (index: number) => void;
}

export function ThumbnailGrid({
	images = [],
	fallbackIcon,
	rows = 3,
	cols = 3,
	rarity,
	className,
	itemClassName,
	aspectRatio = 'square',
	onImageClick,
}: ThumbnailGridProps) {
	// Memoizar patrones aleatorios para no regenerarlos en cada render
	const randomPatterns = React.useMemo(() => {
		return Array(rows * cols)
			.fill(0)
			.map(() => getRandomThumbnailPattern());
	}, [rows, cols]);

	// Determinar la clase de aspect ratio
	const aspectRatioClass = {
		square: 'aspect-square',
		video: 'aspect-[4/3]',
		widescreen: 'aspect-[16/9]',
	}[aspectRatio];

	return (
		<div className={cn(`grid grid-cols-${cols} grid-rows-${rows} gap-1 p-2 h-full`, className)}>
			{Array(rows * cols)
				.fill(0)
				.map((_, i) => {
					const src = i < images.length ? images[i] : null;
					const itemId = `thumbnail-${i}-${randomPatterns[i].substring(0, 8)}`;
					return (
						<button
							key={itemId}
							className={cn('relative rounded overflow-hidden p-0 border-0', aspectRatioClass, itemClassName)}
							onClick={() => onImageClick?.(i)}
							aria-label={`Imagen ${i + 1}`}
							type="button"
						>
							{src ? (
								<img src={src} alt={`Imagen ${i + 1}`} className="object-cover w-full h-full" />
							) : (
								<div
									className={cn('w-full h-full flex items-center justify-center', rarity?.badgeClass || 'bg-muted')}
									style={{ background: randomPatterns[i] }}
								>
									{fallbackIcon || <ImageIcon className="w-3 h-3 text-white/90" />}
								</div>
							)}
						</button>
					);
				})}
		</div>
	);
}

// Componente para mostrar una imagen destacada con fallback
interface FeaturedImageProps {
	src?: string | null;
	alt?: string;
	fallbackIcon?: React.ReactNode;
	gradient?: boolean;
	rarity?: RarityLevel;
	className?: string;
	onClick?: () => void;
}

export function FeaturedImage({
	src,
	alt = 'Imagen destacada',
	fallbackIcon,
	gradient = true,
	rarity,
	className,
	onClick,
}: FeaturedImageProps) {
	// Memoizar un patrón aleatorio para fallback
	const randomPattern = React.useMemo(() => getRandomThumbnailPattern(), []);

	if (!onClick) {
		return (
			<div className={cn('relative w-full h-full overflow-hidden', className)}>
				{src ? (
					<>
						<img src={src} alt={alt} className="w-full h-full object-cover" />
						{gradient && <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />}
					</>
				) : (
					<div
						className={cn('w-full h-full flex items-center justify-center', rarity?.badgeClass || 'bg-muted')}
						style={{ background: randomPattern }}
					>
						{fallbackIcon || <ImageIcon className="w-8 h-8 text-white/90" />}
					</div>
				)}
			</div>
		);
	}

	return (
		<button
			className={cn('relative w-full h-full overflow-hidden p-0 border-0', className)}
			onClick={onClick}
			aria-label={alt}
			type="button"
		>
			{src ? (
				<>
					<img src={src} alt={alt} className="w-full h-full object-cover" />
					{gradient && <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />}
				</>
			) : (
				<div
					className={cn('w-full h-full flex items-center justify-center', rarity?.badgeClass || 'bg-muted')}
					style={{ background: randomPattern }}
				>
					{fallbackIcon || <ImageIcon className="w-8 h-8 text-white/90" />}
				</div>
			)}
		</button>
	);
}

// Botón de explorar que aparece al hacer hover
interface ExploreButtonProps {
	isHovered: boolean;
	onClick?: () => void;
	icon?: React.ReactNode;
}

export function ExploreButton({ isHovered, onClick, icon }: ExploreButtonProps) {
	return (
		<motion.div
			className="absolute inset-0 flex items-center justify-center z-40"
			initial={{ opacity: 0 }}
			animate={{ opacity: isHovered ? 1 : 0 }}
			onClick={(e) => {
				if (onClick) {
					if ((e.target as HTMLElement).closest('button')) {
						e.stopPropagation();
					} else {
						onClick();
					}
				}
			}}
		>
			<motion.div
				className="bg-black/60 backdrop-blur-md rounded-full p-4 text-white shadow-lg"
				initial={{ scale: 0.8 }}
				animate={{ scale: 1 }}
				transition={{ duration: 0.2 }}
			>
				{icon}
			</motion.div>
		</motion.div>
	);
}
