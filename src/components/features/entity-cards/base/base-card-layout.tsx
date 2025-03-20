/**
 * Componente base para todos los layouts de tarjetas
 * Proporciona la estructura común y manejo de props estándar
 */

import { cn } from '@/lib/utils';
import type React from 'react';
import { useMemo } from 'react';
import { adaptCardOptions, type CardOptions } from '../types';

export interface BaseEntityCardProps {
	id: string;
	name: string;
	description?: string;
	createdAt?: Date | string;
	updatedAt?: Date | string;
	imageUrl?: string;
	thumbnailUrl?: string;
	// Utilizamos Record<string, unknown> en lugar de any
	[key: string]: unknown;
}

export interface BaseCardLayoutProps<T extends BaseEntityCardProps = BaseEntityCardProps> {
	/** Datos de la entidad a mostrar */
	data: T;
	/** Opciones visuales y de comportamiento */
	options?: Partial<CardOptions>;
	/** Función llamada al hacer clic en la tarjeta */
	onClick?: () => void;
	/** Función llamada al hacer doble clic en la tarjeta */
	onDoubleClick?: () => void;
	/** Indica si la tarjeta está seleccionada */
	isSelected?: boolean;
	/** Indica si la tarjeta está deshabilitada */
	disabled?: boolean;
	/** Clases CSS adicionales */
	className?: string;
	/** Elementos hijos (opcionales) */
	children?: React.ReactNode;
}

export function BaseCardLayout<T extends BaseEntityCardProps = BaseEntityCardProps>({
	data,
	options,
	onClick,
	onDoubleClick,
	isSelected = false,
	disabled = false,
	className,
	children,
}: BaseCardLayoutProps<T>) {
	// Opciones por defecto para la tarjeta - Envuelto en useMemo para evitar regeneración
	const defaultOptions = useMemo(() => ({
		designSystem: {
			preset: 'modern',
			cornerRadius: 8,
			borderWidth: 1,
			shadowStyle: 'soft',
		},
		enableHover: true,
		enableClick: !disabled,
	}), [disabled]); // Solo depende de disabled que puede cambiar

	// Mezclar opciones por defecto con las proporcionadas
	const mergedOptions = useMemo(() => {
		return adaptCardOptions<CardOptions>({
			...defaultOptions,
			...options,
		});
	}, [options, defaultOptions]); // Ahora defaultOptions es estable

	// Determinar clases CSS basadas en las opciones y estado
	const cardClasses = useMemo(() => {
		return cn(
			'entity-card',
			'relative w-full h-full overflow-hidden transition-all duration-200',
			{
				'cursor-pointer': mergedOptions.enableClick && !disabled,
				'opacity-60': disabled,
				'ring-2 ring-primary': isSelected,
				'hover:scale-[1.02]': mergedOptions.enableHover && !disabled,
			},
			className
		);
	}, [mergedOptions, isSelected, disabled, className]);

	// Manejadores de eventos
	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (!disabled && onClick) {
			onClick();
		}
	};

	const handleDoubleClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (!disabled && onDoubleClick) {
			onDoubleClick();
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
			e.preventDefault();
			if (onClick) {
				onClick();
			}
		}
	};

	// Usar button en lugar de div con role="button" para mejor accesibilidad
	return (
		<button
			className={cardClasses}
			onClick={handleClick}
			onDoubleClick={handleDoubleClick}
			onKeyDown={handleKeyDown}
			disabled={disabled}
			type="button"
			style={{
				borderRadius: `${mergedOptions.designSystem?.cornerRadius || 8}px`,
				borderWidth: `${mergedOptions.designSystem?.borderWidth || 1}px`,
				textAlign: 'left', // Para que el contenido se alinee a la izquierda
			}}
		>
			{children || (
				<div className="flex flex-col h-full">
					{/* Renderizado mínimo por defecto si no hay children */}
					<div className="card-header p-3 border-b">
						<h3 className="text-base font-semibold truncate">{data.name}</h3>
					</div>
					{data.description && (
						<div className="card-description p-3 flex-grow overflow-hidden">
							<p className="text-sm line-clamp-3">{data.description}</p>
						</div>
					)}
					{data.imageUrl && (
						<div className="card-image aspect-video overflow-hidden">
							<img
								src={data.thumbnailUrl || data.imageUrl}
								alt={data.name}
								className="w-full h-full object-cover"
							/>
						</div>
					)}
					<div className="card-footer p-2 text-xs text-muted-foreground border-t">
						{data.createdAt && (
							<span>
								{typeof data.createdAt === 'string'
									? data.createdAt
									: data.createdAt.toLocaleDateString()}
							</span>
						)}
					</div>
				</div>
			)}
		</button>
	);
}