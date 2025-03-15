'use client';

import { Card } from '@/components/ui/card';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { type CoreConfig, DEFAULT_CORE_CONFIG, useCardContent, useCardPerformance, useCoreConfig } from './core-config';

export interface EntityData {
	id: string;
	name: string;
	description?: string;
	image?: string;
	tags?: string[];
	type?: string;
	rarity?: string;
	attributes?: Record<string, unknown>[];
	metadata?: Record<string, unknown>;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface CoreLayerProps {
	entityData: EntityData;
	config?: Partial<CoreConfig>;
	className?: string;
	children?: React.ReactNode;
	containerRef?: React.RefObject<HTMLDivElement>;
	isActive?: boolean;
	onActivate?: (isActive: boolean) => void;
}

export function CoreLayer({ entityData, config: customConfig, className, children, onActivate }: CoreLayerProps) {
	const [isVisible, setIsVisible] = useState(false);
	const cardRef = useRef<HTMLDivElement>(null);

	// Obtener configuración desde el contexto y combinarla con la configuración personalizada
	const { config: contextConfig, handlers } = useCoreConfig();
	const config = { ...DEFAULT_CORE_CONFIG, ...contextConfig, ...customConfig };

	// Hooks personalizados para funcionalidades específicas
	const { getPerformanceOptimizations, getLoadingStrategy } = useCardPerformance(config);
	const { getContentStyles, formatContent } = useCardContent(config);

	// Estado derivado
	const isInteractive = config.interactiveMode !== 'none';
	const performanceOptions = getPerformanceOptimizations();
	const loadingStrategy = getLoadingStrategy();
	const contentStyles = getContentStyles();

	// Effect para manejar visibilidad (IntersectionObserver)
	useEffect(() => {
		if (!cardRef.current) {
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				const [entry] = entries;
				setIsVisible(entry.isIntersecting);

				// Llamar al handler si existe
				if (handlers?.onVisibilityChange) {
					handlers.onVisibilityChange(entry.isIntersecting);
				}
			},
			{ threshold: 0.1 }
		);

		observer.observe(cardRef.current);

		return () => {
			if (cardRef.current) {
				observer.unobserve(cardRef.current);
			}
		};
	}, [handlers]);

	// Effect para notificar montaje/desmontaje
	useEffect(() => {
		// Llamar al handler de montaje
		if (handlers?.onMount) {
			handlers.onMount();
		}

		return () => {
			// Llamar al handler de desmontaje
			if (handlers?.onUnmount) {
				handlers.onUnmount();
			}
		};
	}, [handlers]);

	// Preload si está configurado y es visible
	useEffect(() => {
		if (isVisible && loadingStrategy.preload && handlers?.onPreload) {
			handlers.onPreload();
		}
	}, [isVisible, loadingStrategy.preload, handlers]);

	// Handler para hover
	const handleHover = (hovered: boolean) => {
		// Notificar interacción si hay un handler
		if (handlers?.onInteraction) {
			handlers.onInteraction('hover', { hovered, entityId: entityData.id });
		}

		// Notificar activación si hay un handler
		if (onActivate) {
			onActivate(hovered);
		}
	};

	// Props para interactividad
	const interactivityProps = isInteractive
		? {
				onMouseEnter: () => {
					handleHover(true);
				},
				onMouseLeave: () => {
					handleHover(false);
				},
				onClick: () => {
					if (handlers?.onInteraction) {
						handlers.onInteraction('click', { entityId: entityData.id });
					}
				},
			}
		: {};

	// Clase CSS basada en estado y configuración
	const cardClassName = cn(
		'relative overflow-hidden',
		{
			'cursor-pointer': isInteractive,
			'motion-reduce': config.motionReduction,
		},
		className
	);

	// Opciones de animación basadas en configuración de rendimiento
	const motionOptions = {
		initial: { opacity: 0 },
		animate: { opacity: 1 },
		exit: { opacity: 0 },
		transition: {
			duration: performanceOptions.disableAnimations ? 0 : 0.3,
		},
	};

	return (
		<Card ref={cardRef} className={cardClassName} {...interactivityProps}>
			<motion.div {...motionOptions} className="relative w-full h-full">
				{/* Capa de contenido principal */}
				<div className="p-4" style={contentStyles}>
					{/* Nombre de la entidad */}
					<h3 className="text-lg font-bold mb-2">{entityData.name}</h3>

					{/* Descripción con truncamiento según configuración */}
					{entityData.description && (
						<p className="text-sm mb-3">{formatContent(entityData.description, config.maxLines)}</p>
					)}

					{/* Tags */}
					{entityData.tags && entityData.tags.length > 0 && (
						<div className="flex flex-wrap gap-1 mb-3">
							{entityData.tags.map((tag) => (
								<span key={tag} className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">
									{tag}
								</span>
							))}
						</div>
					)}

					{/* Contenido personalizado pasado como children */}
					{children}
				</div>
			</motion.div>
		</Card>
	);
}
