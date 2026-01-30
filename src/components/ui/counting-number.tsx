// Componente temporalmente deshabilitado durante migración a GSAP
// Original: counting-number
import React from 'react';

interface CountingNumberProps {
	children?: React.ReactNode;
	className?: string;
	[key: string]: any; // Aceptar cualquier prop para compatibilidad
}

export function CountingNumber({ children, className, ...props }: CountingNumberProps) {
	return (
		<div className={className} {...props}>
			{children}
		</div>
	);
}

export default CountingNumber;
