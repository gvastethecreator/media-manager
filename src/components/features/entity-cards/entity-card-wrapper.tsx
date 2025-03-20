'use client';

/**
 * ARCHIVO MODIFICADO PARA SOPORTAR MODOS DE VISUALIZACIÓN
 *
 * Esta versión permite cambiar dinámicamente entre diferentes modos de visualización:
 * - simple: versión básica para rendimiento
 * - complex: versión completa con todas las características
 * - skeleton: versión completa pero con efectos desactivados para pruebas modulares
 * - json: visualización de datos en formato JSON
 */

import { useEffect } from 'react';
import { EntityCardAdapter } from './adapters/entity-card-adapter';
import { useCardDisplay } from './context/card-display-context';
import { useCardControl } from './debug/card-control-context';
import { EntityCard } from './entity-card';
import { JsonEntityCard } from './json-entity-card';
import type { CardOptions } from './types/unified-card-types';

// Re-exportar el tipo EntityCardWrapperProps para compatibilidad
export interface EntityCardWrapperProps {
	entityType: string;
	entityId?: string;
	title?: string;
	description?: string;
	image?: string;
	options?: Partial<CardOptions>;
	className?: string;
	children?: React.ReactNode;
	onClick?: () => void;
	entity?: any; // Agregar soporte para entidad completa para modo JSON
}

/**
 * Componente wrapper para mostrar tarjetas de entidades con soporte para diferentes modos
 */
export function EntityCardWrapper(props: EntityCardWrapperProps) {
	const { displayMode } = useCardDisplay();
	const { state: controlState } = useCardControl();

	// Extraer propiedades
	const {
		entityType,
		entityId,
		title,
		description,
		image,
		options,
		className,
		children,
		onClick,
		entity,
	} = props;

	// Función para imprimir información de depuración sobre la tarjeta
	const logCardDebugInfo = (mode: string, details: Record<string, any>) => {
		if (process.env.NODE_ENV === 'development') {
			console.group(`🔄 EntityCardWrapper [${entityType}] - Modo: ${mode}`);
			console.info(`📋 Entidad: ${title || entityId || 'Sin identificador'}`);

			// Mostrar qué efectos están activos
			if (details.options) {
				console.info('✨ Efectos activos:', Object.entries(details.options)
					.filter(([key, value]) => key.startsWith('enable') && Boolean(value))
					.map(([key]) => key.replace('enable', '').replace('Effect', ''))
					.join(', ') || 'ninguno');
			}

			// Mostrar qué módulos/componentes se están utilizando
			console.info('🧩 Componentes cargados:', details.components || []);

			// Mostrar advertencias si las hay
			if (details.warnings && details.warnings.length > 0) {
				console.warn('⚠️ Advertencias:', details.warnings);
			}

			// Mostrar cualquier error si lo hay
			if (details.errors && details.errors.length > 0) {
				console.error('❌ Errores:', details.errors);
			}

			console.groupEnd();
		}
	};

	// Log de información después del renderizado
	useEffect(() => {
		const warnings = [];
		const errors = [];

		// Verificar posibles problemas en base al modo
		if (displayMode === 'complex') {
			if (!controlState) {
				errors.push('Estado de control no disponible');
			} else {
				// Comprobar si hay propiedades faltantes en controlState
				const requiredProps = [
					'enable3DEffect',
					'enableHolographicEffect',
					'enableGlowEffect',
					'enableScanlines',
					'enableAnimatedBorder',
					'enableGrainEffect'
				];

				const missingProps = requiredProps.filter(prop => controlState[prop as keyof typeof controlState] === undefined);
				if (missingProps.length > 0) {
					errors.push(`Propiedades faltantes en controlState: ${missingProps.join(', ')}`);
				}
			}
		}

		// Información específica según el modo
		switch (displayMode) {
			case 'json':
				logCardDebugInfo('JSON', {
					components: ['JsonEntityCard'],
					options: null,
					warnings,
					errors
				});
				break;
			case 'complex':
				logCardDebugInfo('Completo', {
					components: ['EntityCardAdapter', 'ComplexLayers', 'EffectsSystem'],
					options: controlState,
					warnings,
					errors
				});
				break;
			case 'skeleton':
				logCardDebugInfo('Esqueleto', {
					components: ['EntityCardAdapter', 'SkeletonLayers'],
					options: skeletonOptions,
					warnings,
					errors
				});
				break;
			case 'simple':
			default:
				logCardDebugInfo('Simple', {
					components: ['EntityCard', 'BasicLayers'],
					options: { showImages: controlState?.showImages },
					warnings,
					errors
				});
		}
	}, [displayMode, entityType, entityId, title, controlState]);

	// Preparar la entidad para el modo JSON
	const jsonEntity = entity || {
		id: entityId,
		name: title,
		description,
		image,
		...props,
	};

	// Preparar opciones para modo skeleton
	const skeletonOptions: Partial<CardOptions> = {
		...options,
		enable3DEffect: false,
		enableHolographicEffect: false,
		enableGlowEffect: false,
		enableScanlines: false,
		enableAnimatedBorder: false,
		enableGrainEffect: false,
		// Mantener opciones de diseño base
		designSystem: options?.designSystem || {
			preset: 'default',
			cornerRadius: 8,
			borderWidth: 1,
		},
	};

	// Renderizar según el modo seleccionado
	switch (displayMode) {
		case 'json':
			return (
				<JsonEntityCard
					entity={jsonEntity}
					entityType={entityType}
					className={className}
					onClick={onClick ? (e) => onClick() : undefined}
				/>
			);

		case 'complex':
			try {
				// Aplicar configuración de control para el modo complejo
				const complexOptions = {
					...options,
					enable3DEffect: options?.enable3DEffect !== undefined ?
						options.enable3DEffect : controlState.enable3DEffect,
					enableHolographicEffect: options?.enableHolographicEffect !== undefined ?
						options.enableHolographicEffect : controlState.enableHolographicEffect,
					enableGlowEffect: options?.enableGlowEffect !== undefined ?
						options.enableGlowEffect : controlState.enableGlowEffect,
					enableScanlines: options?.enableScanlines !== undefined ?
						options.enableScanlines : controlState.enableScanlines,
					enableAnimatedBorder: options?.enableAnimatedBorder !== undefined ?
						options.enableAnimatedBorder : controlState.enableAnimatedBorder,
					enableGrainEffect: options?.enableGrainEffect !== undefined ?
						options.enableGrainEffect : controlState.enableGrainEffect,
				};

				return (
					<EntityCardAdapter
						entityType={entityType}
						entity={jsonEntity}
						options={complexOptions}
						className={className}
						onClick={onClick}
					/>
				);
			} catch (error) {
				if (process.env.NODE_ENV === 'development') {
					console.error('❌ Error en modo complejo:', error);
				}
				// Fallback al modo simple si hay error
				return (
					<EntityCard
						title={title || 'Sin título'}
						description={description}
						image={controlState?.showImages ? image : undefined}
						className={`${className} border-red-500 border-2`} // Indicador visual de error
						options={options as any}
						onClick={onClick ? (e) => onClick() : undefined}
					>
						{children}
						{process.env.NODE_ENV === 'development' && (
							<div className="absolute bottom-0 left-0 right-0 bg-red-500/70 text-white text-xs p-1 text-center">
								Error en modo complejo
							</div>
						)}
					</EntityCard>
				);
			}

		case 'skeleton':
			// Usar adaptador complejo pero con efectos desactivados
			return (
				<EntityCardAdapter
					entityType={entityType}
					entity={jsonEntity}
					options={skeletonOptions}
					className={className}
					onClick={onClick}
				/>
			);

		case 'simple':
		default:
			return (
				<EntityCard
					title={title || 'Sin título'}
					description={description}
					image={controlState?.showImages ? image : undefined}
					className={className}
					options={options as any}
					onClick={onClick ? (e) => onClick() : undefined}
				>
					{children}
				</EntityCard>
			);
	}
}

// Exportar como componente por defecto para mantener compatibilidad
export default EntityCardWrapper;
