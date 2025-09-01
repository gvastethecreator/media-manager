// Componente temporalmente deshabilitado durante migración a GSAP
// Original: grid-background
import React from 'react';

interface GridBackgroundProps {
	children?: React.ReactNode;
	className?: string;
	[key: string]: any; // Aceptar cualquier prop para compatibilidad
}

export function GridBackground({ children, className, ...props }: GridBackgroundProps) {
	return (
		<div className={className} {...props}>
			{children}
		</div>
	);
}

export default GridBackground;
