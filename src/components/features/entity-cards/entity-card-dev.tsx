import { cn } from '@/lib/utils';
import type * as React from 'react';
import { useCallback, useMemo } from 'react';
import type { EntityBasicInfo } from './types/unified-types';

export interface EntityCardDevProps extends EntityBasicInfo {
	className?: string;
	onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
	children?: React.ReactNode;
	options?: {
		primaryColor?: string;
		secondaryColor?: string;
	};
}

/**
 * Versión simplificada para desarrollo de EntityCard
 * Sin implementación de capas ni otros elementos complejos
 */
export function EntityCardDev({
	id,
	title,
	description,
	image,
	metadata,
	className,
	onClick,
	children,
	options = {},
}: EntityCardDevProps) {
	// Manejo de eventos de teclado para accesibilidad
	const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
		if (onClick && (e.key === 'Enter' || e.key === ' ')) {
			e.preventDefault();
			// Creamos un evento sintético que contenga la información relevante
			const syntheticEvent = {
				currentTarget: e.currentTarget,
				target: e.target,
				preventDefault: () => { },
				stopPropagation: () => { },
			} as React.MouseEvent<HTMLButtonElement>;

			onClick(syntheticEvent);
		}
	}, [onClick]);

	// Contenido de la tarjeta memoizado para evitar re-renderizados innecesarios
	const CardContent = useCallback(() => (
		<>
			{/* Contenido principal */}
			<div className="flex flex-col h-full">
				{/* Imagen */}
				<div className="relative w-full aspect-[3/4]">
					{image ? (
						<img
							src={image}
							alt={title}
							className="object-cover w-full h-full rounded-t-lg"
							loading="lazy"
						/>
					) : (
						<div className="w-full h-full bg-muted/30 rounded-t-lg flex items-center justify-center">
							<span className="text-muted-foreground text-sm">Sin imagen</span>
						</div>
					)}
				</div>

				{/* Información */}
				<div className="p-3 flex flex-col flex-grow">
					<h3 className="text-base font-medium truncate">{title}</h3>

					{description && (
						<p className="text-sm text-muted-foreground line-clamp-2 mt-1">
							{description}
						</p>
					)}

					{/* Metadata */}
					{metadata && Object.keys(metadata).length > 0 && (
						<div className="mt-2 space-y-1">
							{Object.entries(metadata).map(([key, value]) => (
								<div key={key} className="flex justify-between text-xs">
									<span className="text-muted-foreground">{key}</span>
									<span className="font-medium">{value}</span>
								</div>
							))}
						</div>
					)}

					{/* Contenido adicional */}
					{children && <div className="mt-auto pt-3">{children}</div>}
				</div>
			</div>
		</>
	), [title, description, image, metadata, children]);

	// Estilos personalizados
	const customStyle = useMemo(() => {
		const style: React.CSSProperties = {};

		if (options?.primaryColor) {
			style.borderColor = options.primaryColor;
		}

		return style;
	}, [options]);

	return (
		<button
			type="button"
			className={cn(
				// Base
				'relative bg-card text-left',
				'w-[240px] h-[320px] rounded-lg shadow-sm overflow-hidden border',
				'transition-all duration-300 ease-in-out',
				'outline-none focus:ring-2 focus:ring-primary/50',
				// Hover
				'hover:shadow-md hover:scale-[1.02]',
				// Clase personalizada
				className,
			)}
			onClick={onClick}
			onKeyDown={handleKeyDown}
			tabIndex={0}
			aria-label={`Tarjeta: ${title}`}
			style={customStyle}
			data-entity-id={id}
			data-entity-type="basic-card"
		>
			<CardContent />
		</button>
	);
}