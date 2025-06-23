'use client';

import { truncateText } from '@/lib/utils/format';
import type { InfoItemProps } from './details-panel-types';

/**
 * Componente reutilizable para mostrar un ítem de información con etiqueta y valor.
 * Muestra un par label-value con un icono opcional.
 * Trunca el texto si excede `maxLength`.
 */
export function InfoItem({ icon, label, value, className, maxLength }: InfoItemProps) {
	const renderValue = () => {
		if (typeof value === 'string' && maxLength && value.length > maxLength) {
			return truncateText(value, maxLength);
		}
		if (value instanceof Date) {
			return value.toLocaleString();
		}
		if (typeof value === 'number' || typeof value === 'boolean' || value === null || value === undefined) {
			return String(value);
		}
		return value;
	};

	return (
		<div className={`flex items-start justify-between gap-2 py-1 ${className}`}>
			<div className="flex items-center gap-1.5">
				{icon && <div className="flex-shrink-0 w-4 h-4 text-muted-foreground">{icon}</div>}
				<span className="text-xs font-medium text-muted-foreground">{label}</span>
			</div>
			<div className="text-xs text-right break-words max-w-[60%]">{renderValue()}</div>
		</div>
	);
}
