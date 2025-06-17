/**
 * @file Componente para encabezados de página con estilo consistente
 * @module components/ui/page-heading
 */

import Link from 'next/link';
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PageHeadingProps {
	title: string;
	description?: string;
	actions?: ReactNode;
	backLink?: string;
	className?: string;
	titleClassName?: string;
	descriptionClassName?: string;
	actionsClassName?: string;
}

/**
 * 📄 Componente para encabezados de página con estilo consistente
 * Proporciona un título, descripción opcional y acciones opcionales
 */
export default function PageHeading({
	title,
	description,
	actions,
	backLink,
	className,
	titleClassName,
	descriptionClassName,
	actionsClassName,
}: PageHeadingProps) {
	return (
		<div className={cn('mb-8 flex flex-col space-y-2', className)}>
			<div className="flex items-center justify-between">
				<div className="space-y-1">
					{backLink && (
						<Button variant="link" className="pl-0 text-muted-foreground" asChild>
							<Link href={backLink}>← Volver</Link>
						</Button>
					)}
					<h1 className={cn('text-3xl font-bold tracking-tight', titleClassName)}>{title}</h1>
					{description && <p className={cn('text-lg text-muted-foreground', descriptionClassName)}>{description}</p>}
				</div>
				{actions && <div className={cn('flex items-center space-x-2', actionsClassName)}>{actions}</div>}
			</div>
		</div>
	);
}
