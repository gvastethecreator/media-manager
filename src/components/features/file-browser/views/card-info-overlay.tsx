/**
 * @file Overlay de información para tarjetas en CardsView
 * @description Componente que muestra información adicional al hacer hover sobre las tarjetas
 */

import { motion, AnimatePresence } from 'framer-motion';
import type { AnyEntityWithStats } from '@/types/migration';
import { formatFileSize, formatDate } from '@/lib/utils/format.utils';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CardInfoOverlayProps {
	/** Entidad sobre la que mostrar información */
	entity: AnyEntityWithStats;
	/** Si mostrar el overlay */
	visible: boolean;
	/** Posición del overlay */
	position: 'top' | 'bottom' | 'center';
	/** Configuración de metadata a mostrar */
	metadataConfig: {
		showSize: boolean;
		showDate: boolean;
		showType: boolean;
		showDimensions: boolean;
		showDuration: boolean;
		showTags: boolean;
		showCollection: boolean;
		maxTags: number;
	};
	/** Duración de la animación */
	animationDuration?: number;
}

export function CardInfoOverlay({
	entity,
	visible,
	position,
	metadataConfig,
	animationDuration = 300,
}: CardInfoOverlayProps) {
	const getPositionClasses = () => {
		switch (position) {
			case 'top':
				return 'top-0 left-0 right-0';
			case 'bottom':
				return 'bottom-0 left-0 right-0';
			case 'center':
				return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
			default:
				return 'bottom-0 left-0 right-0';
		}
	};

	const getAnimationVariants = () => {
		switch (position) {
			case 'top':
				return {
					initial: { opacity: 0, y: -20 },
					animate: { opacity: 1, y: 0 },
					exit: { opacity: 0, y: -20 },
				};
			case 'center':
				return {
					initial: { opacity: 0, scale: 0.8 },
					animate: { opacity: 1, scale: 1 },
					exit: { opacity: 0, scale: 0.8 },
				};
			default: // bottom
				return {
					initial: { opacity: 0, y: 20 },
					animate: { opacity: 1, y: 0 },
					exit: { opacity: 0, y: 20 },
				};
		}
	};

	const renderMetadataItem = (key: string, value: string | number | null | undefined) => {
		if (!value) return null;

		return (
			<div key={key} className="flex items-center justify-between text-xs">
				<span className="text-muted-foreground capitalize">{key}:</span>
				<span className="font-medium">{value}</span>
			</div>
		);
	};

	const getEntityMetadata = () => {
		const metadata: Array<{ key: string; value: string | number | null | undefined }> = [];

		if (metadataConfig.showSize && 'size' in entity && entity.size) {
			metadata.push({ key: 'tamaño', value: formatFileSize(entity.size) });
		}

		if (metadataConfig.showDate && 'addedAt' in entity && entity.addedAt) {
			metadata.push({ key: 'agregado', value: formatDate(entity.addedAt) });
		}

		if (metadataConfig.showType && 'mimeType' in entity && entity.mimeType) {
			const type = entity.mimeType.split('/')[0];
			metadata.push({ key: 'tipo', value: type });
		}

		if (metadataConfig.showDimensions && 'width' in entity && 'height' in entity && entity.width && entity.height) {
			metadata.push({ key: 'dimensiones', value: `${entity.width}×${entity.height}` });
		}

		if (metadataConfig.showDuration && 'duration' in entity && entity.duration) {
			const minutes = Math.floor(entity.duration / 60);
			const seconds = entity.duration % 60;
			metadata.push({ key: 'duración', value: `${minutes}:${seconds.toString().padStart(2, '0')}` });
		}

		return metadata;
	};

	const getEntityTags = () => {
		if (!metadataConfig.showTags || !('tags' in entity) || !entity.tags) {
			return [];
		}

		const tags = Array.isArray(entity.tags) ? entity.tags : [];
		return tags.slice(0, metadataConfig.maxTags);
	};

	return (
		<AnimatePresence>
			{visible && (
				<motion.div
					className={cn(
						'absolute z-10 rounded-lg shadow-lg backdrop-blur-sm',
						position === 'center'
							? 'bg-background/95 border max-w-xs p-3'
							: 'bg-gradient-to-t from-black/80 to-transparent text-white p-3',
						getPositionClasses()
					)}
					variants={getAnimationVariants()}
					initial="initial"
					animate="animate"
					exit="exit"
					transition={{ duration: animationDuration / 1000 }}
				>
					{/* Información básica */}
					<div className="space-y-1">
						{getEntityMetadata().map(({ key, value }) => renderMetadataItem(key, value))}
					</div>

					{/* Etiquetas */}
					{getEntityTags().length > 0 && (
						<div className="mt-2 pt-2 border-t border-white/20">
							<div className="flex flex-wrap gap-1">
								{getEntityTags().map((tag, index) => (
									<Badge
										key={index}
										variant="secondary"
										className={cn(
											'text-xs px-1.5 py-0.5',
											position === 'center'
												? 'bg-muted text-muted-foreground'
												: 'bg-white/20 text-white hover:bg-white/30'
										)}
									>
										{tag}
									</Badge>
								))}
							</div>
						</div>
					)}

					{/* Información de colección */}
					{metadataConfig.showCollection && 'collections' in entity && entity.collections && (
						<div className="mt-2 pt-2 border-t border-white/20">
							<div className="text-xs">
								<span className="text-muted-foreground">Colección:</span>
								<span className="ml-1 font-medium">
									{Array.isArray(entity.collections)
										? entity.collections[0]
										: entity.collections
									}
								</span>
							</div>
						</div>
					)}
				</motion.div>
			)}
		</AnimatePresence>
	);
}
