/**
 * Componentes de sección para tarjetas
 * Proporcionan piezas reutilizables para construir layouts de tarjetas con estructura consistente
 */

import { cn } from '@/lib/utils';
import type React from 'react';
import { EntityTypeIcon } from '../entity-type-icon';

// CARD HEADER
// ==============================
export interface CardHeaderProps {
	title: string;
	subtitle?: string;
	entityType?: string;
	showIcon?: boolean;
	className?: string;
	rightContent?: React.ReactNode;
}

export function CardHeader({
	title,
	subtitle,
	entityType,
	showIcon = true,
	className,
	rightContent,
}: CardHeaderProps) {
	return (
		<div className={cn('card-header px-3 py-2 border-b', className)}>
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-2 overflow-hidden">
					{showIcon && entityType && (
						<EntityTypeIcon type={entityType} className="flex-shrink-0 text-muted-foreground" />
					)}
					<div className="overflow-hidden">
						<h3 className="text-sm font-semibold truncate">{title}</h3>
						{subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
					</div>
				</div>
				{rightContent && <div className="flex-shrink-0">{rightContent}</div>}
			</div>
		</div>
	);
}

// CARD FOOTER
// ==============================
export interface CardFooterProps {
	children?: React.ReactNode;
	className?: string;
	createdAt?: Date | string;
	updatedAt?: Date | string;
	showDates?: boolean;
	leftContent?: React.ReactNode;
	rightContent?: React.ReactNode;
}

export function CardFooter({
	children,
	className,
	createdAt,
	updatedAt,
	showDates = true,
	leftContent,
	rightContent,
}: CardFooterProps) {
	// Formatear fecha para mostrar
	const formatDate = (date?: Date | string) => {
		if (!date) return '';
		if (typeof date === 'string') {
			// Si parece una fecha ISO, convertirla
			if (date.includes('T')) {
				return new Date(date).toLocaleDateString();
			}
			return date;
		}
		return date.toLocaleDateString();
	};

	return (
		<div className={cn('card-footer p-2 text-xs border-t flex justify-between items-center', className)}>
			{children || (
				<>
					<div className="text-muted-foreground">
						{leftContent}
						{!leftContent && showDates && createdAt && (
							<span title={`Creado: ${formatDate(createdAt)}`}>
								{formatDate(createdAt)}
							</span>
						)}
					</div>
					<div className="text-muted-foreground">
						{rightContent}
						{!rightContent && showDates && updatedAt && (
							<span title={`Actualizado: ${formatDate(updatedAt)}`} className="text-xs opacity-70">
								{formatDate(updatedAt)}
							</span>
						)}
					</div>
				</>
			)}
		</div>
	);
}

// CARD IMAGE SECTION
// ==============================
export interface CardImageSectionProps {
	imageUrl?: string;
	thumbnailUrl?: string;
	alt?: string;
	aspectRatio?: 'square' | 'video' | 'wide' | 'tall' | 'auto';
	fillContainer?: boolean;
	overlayContent?: React.ReactNode;
	className?: string;
	imageClassName?: string;
	priority?: boolean;
}

export function CardImageSection({
	imageUrl,
	thumbnailUrl,
	alt = '',
	aspectRatio = 'video',
	fillContainer = false,
	overlayContent,
	className,
	imageClassName,
	priority = false,
}: CardImageSectionProps) {
	if (!imageUrl) return null;

	// Mapeo de aspect ratios a clases
	const aspectClasses = {
		square: 'aspect-square',
		video: 'aspect-video',
		wide: 'aspect-[16/9]',
		tall: 'aspect-[9/16]',
		auto: '',
	};

	return (
		<div
			className={cn(
				'card-image-section relative overflow-hidden',
				aspectClasses[aspectRatio],
				fillContainer && 'h-full w-full',
				className
			)}
		>
			{/* Imagen */}
			<img
				src={thumbnailUrl || imageUrl}
				alt={alt}
				className={cn('w-full h-full object-cover', imageClassName)}
				loading={priority ? 'eager' : 'lazy'}
			/>

			{/* Contenido de superposición */}
			{overlayContent && (
				<div className="absolute inset-0 flex items-center justify-center">
					{overlayContent}
				</div>
			)}
		</div>
	);
}

// CARD METADATA SECTION
// ==============================
export interface MetadataItem {
	label: string;
	value: string | number | React.ReactNode;
	icon?: React.ReactNode;
	id?: string;
}

export interface CardMetadataSectionProps {
	items?: MetadataItem[];
	className?: string;
}

export function CardMetadataSection({ items = [], className }: CardMetadataSectionProps) {
	if (!items.length) return null;

	return (
		<div className={cn('card-metadata-section p-2 border-t text-xs', className)}>
			<ul className="grid grid-cols-2 gap-2">
				{items.map((item, index) => (
					<li
						key={item.id || `${item.label}-${index}`}
						className="flex items-center gap-1 overflow-hidden"
					>
						{item.icon && <span className="flex-shrink-0">{item.icon}</span>}
						<span className="font-medium text-muted-foreground">{item.label}:</span>
						<span className="truncate">{item.value}</span>
					</li>
				))}
			</ul>
		</div>
	);
}

// CARD DESCRIPTION SECTION
// ==============================
export interface CardDescriptionSectionProps {
	description?: string;
	maxLines?: 1 | 2 | 3 | 4 | 5;
	className?: string;
}

export function CardDescriptionSection({
	description,
	maxLines = 3,
	className,
}: CardDescriptionSectionProps) {
	if (!description) return null;

	// Mapeo de maxLines a clases
	const lineClampClasses = {
		1: 'line-clamp-1',
		2: 'line-clamp-2',
		3: 'line-clamp-3',
		4: 'line-clamp-4',
		5: 'line-clamp-5',
	};

	return (
		<div className={cn('card-description-section p-3 flex-grow overflow-hidden', className)}>
			<p className={cn('text-sm', lineClampClasses[maxLines])}>{description}</p>
		</div>
	);
}