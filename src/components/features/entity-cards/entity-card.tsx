'use client';

import { cn } from '@/lib/utils';
import type * as React from 'react';
import { useEffect, useState } from 'react';
import type { CardOptions } from './types/unified-card-types';

// Definir un tipo simplificado de CardOptions
export interface EntityCardOptions {
	designSystem?: {
		preset?: string;
		cornerRadius?: number;
		borderWidth?: number;
		shadowStyle?: string;
	};
	primaryColor?: string;
	secondaryColor?: string;
	// Añadir opciones para efectos visuales
	enable3DEffect?: boolean;
	enableHolographicEffect?: boolean;
	enableGlowEffect?: boolean;
	enableScanlines?: boolean;
	enableAnimatedBorder?: boolean;
	enableGrainEffect?: boolean;
}

export interface BaseCardProps {
	children: React.ReactNode;
	className?: string;
	onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

// Componente base simplificado
export function BaseCard({
	children,
	className,
	onClick,
}: BaseCardProps) {
	return (
		<button
			tabIndex={0}
			type="button"
			className={cn(
				'relative w-full h-full bg-background border border-border overflow-hidden rounded-lg transition-all duration-200',
				className,
				onClick ? 'cursor-pointer' : 'cursor-default'
			)}
			onClick={onClick}
			onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					if (onClick) {
						// Crear un evento sintético de clic
						const syntheticEvent = {
							currentTarget: e.currentTarget,
							preventDefault: () => { },
							stopPropagation: () => { },
						} as React.MouseEvent<HTMLButtonElement>;
						onClick(syntheticEvent);
					}
				}
			}}
		>
			{children}
		</button>
	);
}

// Propiedades para el EntityCard simplificado
export interface EntityCardProps {
	title: string;
	description?: string;
	image?: string;
	options?: Partial<CardOptions>;
	className?: string;
	onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
	children?: React.ReactNode;
}

/**
 * Tarjeta de entidad básica
 * Esta versión es la más simple y debería tener el mejor rendimiento
 */
export function EntityCard({
	title,
	description,
	image,
	options = {},
	className,
	onClick,
	children,
}: EntityCardProps) {
	// Contador de renderizados para depuración
	const [renderCount, setRenderCount] = useState(0);
	// Estado para controlar errores
	const [hasError, setHasError] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');

	// Incrementar contador de renderizados en desarrollo
	useEffect(() => {
		if (process.env.NODE_ENV === 'development') {
			setRenderCount(prev => prev + 1);
		}
	}, []);

	// Verificar y registrar opciones y rendimiento en desarrollo
	useEffect(() => {
		if (process.env.NODE_ENV === 'development') {
			// Crear un grupo para la información de depuración
			console.group(`🎴 EntityCard: ${title}`);
			console.info('🔄 Renderizado:', renderCount);

			// Verificar opciones avanzadas
			const advancedOptions = options && Object.entries(options)
				.filter(([key, value]) => key.startsWith('enable') && Boolean(value))
				.map(([key]) => key);

			if (advancedOptions && advancedOptions.length > 0) {
				console.warn('⚠️ Se han detectado opciones avanzadas en modo simple:', advancedOptions);
				console.info('💡 Estas opciones solo funcionan en modo complex o skeleton');
			}

			console.groupEnd();
		}
	}, [options, renderCount, title]);

	// Manejador de errores
	const handleError = (error: unknown) => {
		setHasError(true);
		setErrorMessage(error instanceof Error ? error.message : 'Error desconocido');
		if (process.env.NODE_ENV === 'development') {
			console.error('❌ Error en EntityCard:', error);
		}
	};

	// Renderizar la tarjeta con manejo de errores
	try {
		// Obtener la información de diseño
		const designSystem = options?.designSystem || {
			preset: 'default',
			cornerRadius: 8,
			borderWidth: 1,
		};

		return (
			<div
				onClick={onClick}
				className={cn(
					'relative overflow-hidden transition-all duration-200',
					'bg-card border rounded-lg p-4 h-52',
					'hover:shadow-md cursor-pointer',
					className
				)}
				style={{
					borderRadius: `${designSystem.cornerRadius}px`,
					borderWidth: `${designSystem.borderWidth}px`,
				}}
			>
				{/* Si hay un error, mostrar un indicador */}
				{hasError && (
					<div className="absolute inset-0 flex items-center justify-center bg-red-500/10 z-10">
						<div className="bg-card p-3 rounded shadow-lg text-center max-w-[80%]">
							<p className="text-red-500 font-semibold text-sm">Error</p>
							<p className="text-muted-foreground text-xs">{errorMessage || 'Error al renderizar'}</p>
						</div>
					</div>
				)}

				{/* Contenido principal */}
				<div className="flex flex-col h-full">
					{/* Imagen */}
					{image && (
						<div className="relative w-full aspect-[4/3] mb-3">
							<img
								src={image}
								alt={title || 'Imagen de tarjeta'}
								className="object-cover w-full h-full rounded-md"
								onError={() => handleError('Error al cargar la imagen')}
							/>
						</div>
					)}

					{/* Título */}
					<h3 className="text-base font-medium truncate">{title}</h3>

					{/* Descripción */}
					{description && (
						<p className="text-sm text-muted-foreground line-clamp-3 mt-1">
							{description}
						</p>
					)}

					{/* Contenido adicional */}
					{children}

					{/* Indicador de mode en desarrollo */}
					{process.env.NODE_ENV === 'development' && (
						<div className="absolute top-1 right-1 flex text-[9px] gap-1">
							<span className="px-1 py-0.5 bg-blue-500/20 text-blue-700 dark:text-blue-300 rounded">simple</span>
							<span className="px-1 py-0.5 bg-gray-500/20 text-gray-700 dark:text-gray-300 rounded">{renderCount}</span>
						</div>
					)}
				</div>
			</div>
		);
	} catch (error) {
		// En caso de error en el renderizado, mostrar un fallback
		handleError(error);

		return (
			<div className="bg-card border border-red-500 rounded-lg p-4 h-52 relative overflow-hidden">
				<div className="flex flex-col h-full items-center justify-center">
					<p className="text-red-500 font-medium text-sm">Error al renderizar tarjeta</p>
					<p className="text-xs text-muted-foreground mt-1">
						{errorMessage || 'Error desconocido'}
					</p>
					<div className="mt-3 text-xs">
						<p className="font-medium">Información:</p>
						<p>Título: {title || 'No disponible'}</p>
						{process.env.NODE_ENV === 'development' && (
							<p className="mt-2 text-[10px] text-muted-foreground">
								Modo: simple | Renderizados: {renderCount}
							</p>
						)}
					</div>
				</div>
			</div>
		);
	}
}
