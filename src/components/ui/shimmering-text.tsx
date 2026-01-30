// Componente temporalmente deshabilitado durante migración a GSAP
// Original: shimmering-text
import React from 'react';

interface ShimmeringTextProps {
	children?: React.ReactNode;
	className?: string;
	[key: string]: any; // Aceptar cualquier prop para compatibilidad
}

export function ShimmeringText({ children, className, ...props }: ShimmeringTextProps) {
	return (
		<div className={className} {...props}>
			{children}
		</div>
	);
}

export default ShimmeringText;
