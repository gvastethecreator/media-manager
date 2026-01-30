/**
 * @file Componente para encabezados de página con estilo consistente
 * @module components/ui/page-heading
 * @version 2.0 - Integrado con Design Tokens v2
 */

import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PageHeadingProps {
	title: string;
	description?: string;
	actions?: ReactNode;
	backLink?: string;
	backLabel?: string;
	className?: string;
	titleClassName?: string;
	descriptionClassName?: string;
	actionsClassName?: string;
	/** Icono opcional junto al título */
	icon?: ReactNode;
	/** Badge o etiqueta junto al título */
	badge?: ReactNode;
}

/**
 * 📄 Componente para encabezados de página con estilo consistente
 * Proporciona un título, descripción opcional y acciones opcionales
 * Usa Design Tokens v2 para tipografía y espaciado
 */
export default function PageHeading({
	title,
	description,
	actions,
	backLink,
	backLabel = 'Volver',
	className,
	titleClassName,
	descriptionClassName,
	actionsClassName,
	icon,
	badge,
}: PageHeadingProps) {
	return (
		<div className={cn('stack-sm mb-6', className)}>
			{/* Back link */}
			{backLink && (
				<Button
					asChild
					className="w-fit gap-1 pl-0 text-muted-foreground hover:text-foreground"
					size="sm"
					variant="link"
				>
					<Link to={backLink}>
						<ChevronLeft className="h-4 w-4" />
						{backLabel}
					</Link>
				</Button>
			)}

			{/* Header row */}
			<div className="flex items-start justify-between gap-4">
				<div className="stack-xs min-w-0 flex-1">
					{/* Title with icon and badge */}
					<div className="flex items-center gap-3">
						{icon && (
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-dt-md bg-primary/10 text-primary">
								{icon}
							</div>
						)}
						<h1 className={cn('display-lg truncate', titleClassName)}>{title}</h1>
						{badge}
					</div>

					{/* Description */}
					{description && (
						<p className={cn('body-md max-w-2xl text-muted-foreground', descriptionClassName)}>{description}</p>
					)}
				</div>

				{/* Actions */}
				{actions && <div className={cn('inline-sm shrink-0', actionsClassName)}>{actions}</div>}
			</div>
		</div>
	);
}
