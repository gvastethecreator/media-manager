import React from 'react';
import { cn } from '@/lib/utils';

interface BaseContentViewProps {
	/** Título principal de la vista */
	title?: string;
	/** Descripción opcional */
	description?: string;
	/** Emoji o icono para el título */
	icon?: string;
	/** Contenido principal */
	children: React.ReactNode;
	/** Controles adicionales para el header */
	headerControls?: React.ReactNode;
	/** Clase CSS adicional */
	className?: string;
	/** Si mostrar el header o no */
	showHeader?: boolean;
}

const BaseContentView: React.FC<BaseContentViewProps> = ({
	title,
	description,
	icon,
	children,
	headerControls,
	className,
	showHeader = true,
}) => {
	return (
		<div className={cn('relative h-full w-full min-h-0 min-w-0 flex-1 flex flex-col overflow-hidden', className)}>
			{showHeader && (title || description || headerControls) && (
				<>
					{/* Header con información */}
					<div className="p-4 pb-3 border-b border-border bg-background/50 backdrop-blur-sm">
						<div className="flex items-center justify-between">
							<div>
								{title && (
									<h2 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
										{icon && <span className="text-2xl">{icon}</span>}
										{title}
									</h2>
								)}
								{description && <p className="text-sm text-muted-foreground">{description}</p>}
							</div>
							{headerControls && <div className="flex gap-2">{headerControls}</div>}
						</div>
					</div>
				</>
			)}

			{/* Contenido principal */}
			<div className="flex-1 min-h-0 overflow-hidden">{children}</div>
		</div>
	);
};

export { BaseContentView };
export type { BaseContentViewProps };
