'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import type * as React from 'react';
import { useState } from 'react';
import type { BacksideOptions } from './types';

export interface EntityData {
	id: string;
	type: string;
	name: string;
	description?: string;
	attributes?: Record<string, unknown>;
	stats?: Record<string, unknown>;
	metadata?: Record<string, unknown>;
	relations?: Array<{
		type: string;
		id: string;
		name: string;
	}>;
	[key: string]: unknown;
}

export interface BacksideLayerProps {
	config: BacksideOptions;
	entityData: EntityData;
	isFlipped: boolean;
	onFlip: () => void;
	className?: string;
}

const DEFAULT_CONFIG: BacksideOptions = {
	enabled: true,
	layoutType: 'standard',
	colorMode: 'inherit',
	opacity: 0.95,
	blurBackground: true,
	blurAmount: 10,
	showAttributes: true,
	showDescription: true,
	showStats: true,
	showMetadata: true,
	showRelations: false,
	maxDescriptionLength: 300,
	animation: 'flip',
	animationDuration: 600,
	flipAnimation: 'rotate',
	flipDuration: 0.6,
	enableAutoFlip: false,
	autoFlipDelay: 3,
	flipTrigger: 'click',
	headingStyle: 'default',
	infoStyle: 'default',
	separatorStyle: 'line',
	showBackContent: true,
};

export function BacksideLayer({ config, entityData, isFlipped, onFlip, className }: BacksideLayerProps) {
	const [_isHovered, setIsHovered] = useState(false);

	// Combinamos la configuración por defecto con la proporcionada
	const mergedConfig = { ...DEFAULT_CONFIG, ...config };

	if (!mergedConfig.enabled) {
		return null;
	}

	// Si no está volteada, no mostramos el backside
	if (!isFlipped) {
		return null;
	}

	// Truncar descripción si es necesario
	const description = entityData.description || '';
	const truncatedDescription =
		mergedConfig.maxDescriptionLength && description.length > mergedConfig.maxDescriptionLength
			? `${description.substring(0, mergedConfig.maxDescriptionLength)}...`
			: description;

	// Calcular estilos basados en la configuración
	const getBackgroundStyle = (): React.CSSProperties => {
		const style: React.CSSProperties = {
			opacity: mergedConfig.opacity,
		};

		if (mergedConfig.colorMode === 'custom' && mergedConfig.customColor) {
			style.backgroundColor = mergedConfig.customColor;
		}

		if (mergedConfig.blurBackground) {
			style.backdropFilter = `blur(${mergedConfig.blurAmount}px)`;
		}

		return style;
	};

	// Renderizar atributos si están habilitados
	const renderAttributes = () => {
		if (!mergedConfig.showAttributes || !entityData.attributes) {
			return null;
		}

		return (
			<div className="mt-4">
				<h3
					className={cn(
						'text-sm font-medium mb-2',
						mergedConfig.headingStyle === 'large' && 'text-base',
						mergedConfig.headingStyle === 'subtle' && 'text-xs text-muted-foreground',
						mergedConfig.headingStyle === 'accent' && 'text-sm text-primary'
					)}
				>
					Atributos
				</h3>
				<div
					className={cn(
						'grid grid-cols-2 gap-2',
						mergedConfig.infoStyle === 'pills' && 'flex flex-wrap gap-1',
						mergedConfig.infoStyle === 'cards' && 'grid grid-cols-2 gap-2',
						mergedConfig.infoStyle === 'minimal' && 'space-y-1'
					)}
				>
					{Object.entries(entityData.attributes).map(([key, value]) => (
						<div
							key={key}
							className={cn(
								'flex justify-between text-xs',
								mergedConfig.infoStyle === 'pills' && 'px-2 py-1 bg-secondary/20 rounded-full',
								mergedConfig.infoStyle === 'cards' && 'p-2 bg-card rounded-md shadow-sm',
								mergedConfig.infoStyle === 'minimal' && 'border-b border-border/30 pb-1'
							)}
						>
							<span className="font-medium">{key}:</span>
							<span className="ml-2">{String(value)}</span>
						</div>
					))}
				</div>
			</div>
		);
	};

	// Renderizar estadísticas si están habilitadas
	const renderStats = () => {
		if (!mergedConfig.showStats || !entityData.stats) {
			return null;
		}

		return (
			<div className="mt-4">
				<h3
					className={cn(
						'text-sm font-medium mb-2',
						mergedConfig.headingStyle === 'large' && 'text-base',
						mergedConfig.headingStyle === 'subtle' && 'text-xs text-muted-foreground',
						mergedConfig.headingStyle === 'accent' && 'text-sm text-primary'
					)}
				>
					Estadísticas
				</h3>
				<div className="grid grid-cols-2 gap-2">
					{Object.entries(entityData.stats).map(([key, value]) => (
						<div key={key} className="flex justify-between text-xs">
							<span className="font-medium">{key}:</span>
							<span>{String(value)}</span>
						</div>
					))}
				</div>
			</div>
		);
	};

	// Renderizar metadatos si están habilitados
	const renderMetadata = () => {
		if (!mergedConfig.showMetadata || !entityData.metadata) {
			return null;
		}

		return (
			<div className="mt-4">
				<h3
					className={cn(
						'text-sm font-medium mb-2',
						mergedConfig.headingStyle === 'large' && 'text-base',
						mergedConfig.headingStyle === 'subtle' && 'text-xs text-muted-foreground',
						mergedConfig.headingStyle === 'accent' && 'text-sm text-primary'
					)}
				>
					Metadatos
				</h3>
				<div className="grid grid-cols-2 gap-2 text-xs">
					{Object.entries(entityData.metadata).map(([key, value]) => (
						<div key={key} className="flex justify-between">
							<span className="font-medium">{key}:</span>
							<span>{String(value)}</span>
						</div>
					))}
				</div>
			</div>
		);
	};

	// Renderizar relaciones si están habilitadas
	const renderRelations = () => {
		if (!mergedConfig.showRelations || !entityData.relations || entityData.relations.length === 0) {
			return null;
		}

		return (
			<div className="mt-4">
				<h3
					className={cn(
						'text-sm font-medium mb-2',
						mergedConfig.headingStyle === 'large' && 'text-base',
						mergedConfig.headingStyle === 'subtle' && 'text-xs text-muted-foreground',
						mergedConfig.headingStyle === 'accent' && 'text-sm text-primary'
					)}
				>
					Relaciones
				</h3>
				<div className="space-y-1 text-xs">
					{entityData.relations.map((relation) => (
						<div key={relation.id} className="flex items-center gap-1">
							<span className="font-medium">{relation.type}:</span>
							<span>{relation.name}</span>
						</div>
					))}
				</div>
			</div>
		);
	};

	// Renderizar separador según el estilo seleccionado
	const renderSeparator = () => {
		switch (mergedConfig.separatorStyle) {
			case 'dotted':
				return <div className="border-t border-dotted border-border my-3" />;
			case 'gradient':
				return <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-3" />;
			case 'none':
				return <div className="my-3" />;
			default:
				return <div className="border-t border-border my-3" />;
		}
	};

	// Calcular la duración de la animación en segundos
	const animationDuration = mergedConfig.animationDuration
		? mergedConfig.animationDuration / 1000
		: mergedConfig.flipDuration || 0.6;

	return (
		<motion.div
			className={cn('absolute inset-0 z-10 flex items-center justify-center', className)}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: animationDuration }}
		>
			<Card
				className="w-full h-full overflow-auto"
				style={getBackgroundStyle()}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				onClick={onFlip}
			>
				<div className="p-4">
					<div className="flex justify-between items-start">
						<div>
							<h2 className="text-lg font-semibold">{entityData.name}</h2>
							<p className="text-xs text-muted-foreground">{entityData.type}</p>
						</div>
						<button
							className="text-xs text-muted-foreground hover:text-foreground"
							onClick={(e) => {
								e.stopPropagation();
								onFlip();
							}}
						>
							Volver
						</button>
					</div>

					{mergedConfig.showDescription && (
						<>
							{renderSeparator()}
							<p className="text-sm">{truncatedDescription}</p>
						</>
					)}

					{renderAttributes()}
					{renderStats()}
					{renderMetadata()}
					{renderRelations()}
				</div>
			</Card>
		</motion.div>
	);
}
