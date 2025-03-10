'use client';

import * as React from 'react';
import type { InfoItemProps } from './details-panel-types';

/**
 * Componente simple para mostrar un elemento de información con icono, etiqueta y valor
 */
export function InfoItem({ icon, label, value }: InfoItemProps) {
	return (
		<div className="flex items-center justify-between text-sm">
			<div className="flex items-center gap-2">
				{icon}
				<span className="text-muted-foreground">{label}</span>
			</div>
			<span className="font-medium">{value?.toString() || 'N/A'}</span>
		</div>
	);
}
