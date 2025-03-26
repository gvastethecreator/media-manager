'use client';

import type React from 'react';

interface InfoItemProps {
	icon: React.ReactNode;
	label: string;
	value: string | number | Date;
	className?: string;
}

/**
 * Componente que muestra un par label-value con un icono
 */
export function InfoItem({ icon, label, value, className }: InfoItemProps) {
	// Convertir el valor a cadena si es un número o fecha
	const displayValue =
		typeof value === 'number' ? value.toString() : value instanceof Date ? value.toLocaleString() : value;

	return (
		<div className={`flex items-center justify-between gap-1 py-0.5 ${className}`}>
			<div className="flex items-center gap-1">
				{icon}
				<span className="text-[10px] text-muted-foreground">{label}</span>
			</div>
			<span className="text-[10px] font-medium truncate max-w-[65%] text-right">{displayValue}</span>
		</div>
	);
}
