'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Layers, ZoomIn } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { EntityPreviewAdapter } from './entity-preview-adapter';
import type { PreviewPanelProps } from './types';

/**
 * Panel de vista previa para tarjetas de entidad
 * Muestra una tarjeta con controles adicionales y efectos visuales
 */
export function PreviewPanel({
	cardOptions,
	rarity,
	texture,
	showInfo = true,
	showControls = true,
	showBorder = true,
	enableInteraction = true,
	previewMode = 'full',
	className,
	entityType = 'card-album',
}: PreviewPanelProps) {
	// Estado para el modo de explosión de capas
	const [isExploded, setIsExploded] = useState(false);
	// Estado para el zoom
	const [zoomLevel, setZoomLevel] = useState(1);

	// Función para alternar el modo de explosión
	const toggleExplode = () => {
		setIsExploded(!isExploded);
	};

	// Función para aumentar el zoom
	const increaseZoom = () => {
		setZoomLevel((prev) => Math.min(prev + 0.1, 2));
	};

	// Función para disminuir el zoom
	const decreaseZoom = () => {
		setZoomLevel((prev) => Math.max(prev - 0.1, 0.5));
	};

	return (
		<Card
			className={cn(
				'relative overflow-hidden transition-all duration-300',
				showBorder ? 'border border-border' : 'border-0',
				className
			)}
		>
			<CardContent className="p-0">
				{/* Contenedor de la tarjeta con zoom */}
				<div
					className="flex items-center justify-center p-6"
					style={{
						transform: `scale(${zoomLevel})`,
						transition: 'transform 0.3s ease',
					}}
				>
					{/* Adaptador de vista previa de entidad */}
					<EntityPreviewAdapter
						cardOptions={cardOptions}
						rarity={rarity}
						texture={texture}
						showInfo={showInfo}
						entityType={entityType}
						previewMode={previewMode}
					/>
				</div>

				{/* Controles flotantes */}
				{showControls && (
					<div className="absolute bottom-2 right-2 flex gap-1">
						<motion.button
							whileHover={{ scale: 1.1 }}
							whileTap={{ scale: 0.9 }}
							onClick={toggleExplode}
							className={cn(
								'p-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-sm',
								isExploded && 'bg-primary/20 border-primary/50'
							)}
							title="Explotar capas"
						>
							<Layers className="h-3.5 w-3.5" />
						</motion.button>
						<motion.button
							whileHover={{ scale: 1.1 }}
							whileTap={{ scale: 0.9 }}
							onClick={increaseZoom}
							className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-sm"
							title="Aumentar zoom"
						>
							<ZoomIn className="h-3.5 w-3.5" />
						</motion.button>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
