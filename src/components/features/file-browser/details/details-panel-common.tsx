'use client';

import type { ReactNode } from 'react';
import { truncateText } from '@/lib/utils';
import type { FileMetadata } from '@/types/metadata.types';

/**
 * Propiedades para el componente InfoItem
 */
interface InfoItemProps {
	label: string;
	value: string | number;
	icon?: ReactNode;
	maxLength?: number;
}

/**
 * Componente reutilizable para mostrar un ítem de información con etiqueta y valor
 */
export function InfoItem({ label, value, icon, maxLength = 120 }: InfoItemProps) {
	// Convertir valores numéricos a cadena
	const valueAsString = typeof value === 'number' ? value.toString() : value || 'No disponible';

	// Truncar valor si es demasiado largo
	const displayValue = valueAsString.length > maxLength ? truncateText(valueAsString, maxLength) : valueAsString;

	return (
		<div className="flex flex-col">
			<div className="flex items-center gap-1.5">
				{icon && <div className="flex-shrink-0">{icon}</div>}
				<div className="text-xs font-medium text-muted-foreground">{label}</div>
			</div>
			<div className="text-xs ml-5">{displayValue}</div>
		</div>
	);
}

/**
 * Propiedades para componentes de metadatos
 */
export interface MetadataComponentProps {
	metadata: FileMetadata | null;
}
