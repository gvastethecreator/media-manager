// Componente temporalmente deshabilitado durante migración a GSAP
// Original: hover-background
import React from 'react';

interface HoverBackgroundProps {
	children?: React.ReactNode;
	className?: string;
	[key: string]: any; // Aceptar cualquier prop para compatibilidad
}

export function HoverBackground({ children, className, ...props }: HoverBackgroundProps) {
	return (
		<div className={className} {...props}>
			{children}
		</div>
	);
}

export default HoverBackground;
