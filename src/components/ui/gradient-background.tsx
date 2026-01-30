// Componente temporalmente deshabilitado durante migración a GSAP
// Original: gradient-background
import React from 'react';

interface GradientBackgroundProps {
	children?: React.ReactNode;
	className?: string;
	[key: string]: any; // Aceptar cualquier prop para compatibilidad
}

export function GradientBackground({ children, className, ...props }: GradientBackgroundProps) {
	return (
		<div className={className} {...props}>
			{children}
		</div>
	);
}

export default GradientBackground;
