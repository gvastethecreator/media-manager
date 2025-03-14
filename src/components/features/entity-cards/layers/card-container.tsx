'use client';

import { cn } from '@/lib/utils';
import type * as React from 'react';
import type { CardOptions } from '../types/card-settings-types';

export interface CardContainerProps {
	id?: string;
	className?: string;
	children: React.ReactNode;
	onClick?: (e: React.MouseEvent) => void;
	onKeyDown?: (e: React.KeyboardEvent) => void;
	options?: CardOptions;
	flipped?: boolean;
	enableBackside?: boolean;
	'aria-label'?: string;
}

/**
 * Componente contenedor para las tarjetas de entidad
 * Gestiona la estructura, eventos y transiciones
 */
export function CardContainer({
	id,
	className,
	children,
	onClick,
	onKeyDown,
	options,
	flipped = false,
	enableBackside = false,
	'aria-label': ariaLabel,
	...props
}: CardContainerProps) {
	return (
		<div
			id={id}
			className={cn(
				'entity-card-container relative w-full h-full transition-colors',
				{
					'entity-card-flipped': flipped,
					'entity-card-with-backside': enableBackside,
				},
				className
			)}
			{...props}
		>
			{/* El botón solo se activa si hay una cara posterior */}
			{enableBackside ? (
				<button
					type="button"
					className="entity-card-flipper w-full h-full p-0 m-0 border-0 bg-transparent"
					onClick={onClick}
					onKeyDown={onKeyDown}
					aria-label={ariaLabel || 'Entity card'}
				>
					<div
						className={cn(
							'entity-card-flipper-inner relative w-full h-full transition-transform duration-500',
							flipped && 'rotate-y-180'
						)}
					>
						{children}
					</div>
				</button>
			) : (
				<div className="entity-card-static w-full h-full">{children}</div>
			)}
		</div>
	);
}
