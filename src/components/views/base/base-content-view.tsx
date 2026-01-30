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
					{/* Header compacto y minimalista */}
					<div className="border-border border-b bg-background/40 px-3 py-2 backdrop-blur-sm">
						<div className="flex items-center justify-between gap-3">
							<div className="flex min-w-0 items-center gap-3">
								{icon && <span className="flex-shrink-0 text-lg leading-none">{icon}</span>}
								<div className="min-w-0">
									{title && <h2 className="truncate font-semibold text-foreground text-sm leading-tight">{title}</h2>}
									{description && <p className="truncate text-muted-foreground text-xs leading-tight">{description}</p>}
								</div>
							</div>
							{headerControls && <div className="flex items-center gap-2">{headerControls}</div>}
						</div>
					</div>
				</>
			)}

			{/* Contenido principal */}
			<div className="flex min-h-0 flex-1 flex-col">{children}</div>
		</div>
	);
};

export { BaseContentView };
export type { BaseContentViewProps };
