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
		<div className={cn('relative flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden', className)}>
			{showHeader && (title || description || headerControls) && (
				<>
					{/* Header con información */}
					<div className="border-border border-b bg-background/50 p-4 pb-3 backdrop-blur-sm">
						<div className="flex items-center justify-between">
							<div>
								{title && (
									<h2 className="mb-1 flex items-center gap-2 font-bold text-foreground text-xl">
										{icon && <span className="text-2xl">{icon}</span>}
										{title}
									</h2>
								)}
								{description && <p className="text-muted-foreground text-sm">{description}</p>}
							</div>
							{headerControls && <div className="flex gap-2">{headerControls}</div>}
						</div>
					</div>
				</>
			)}

			{/* Contenido principal */}
			<div className="min-h-0 flex-1 overflow-hidden">{children}</div>
		</div>
	);
};

export { BaseContentView };
export type { BaseContentViewProps };
