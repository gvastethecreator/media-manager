// Componente temporalmente deshabilitado durante migración a GSAP
// Original: blur-fade
import React from 'react';

interface BlurFadeProps {
	children?: React.ReactNode;
	className?: string;
	[key: string]: any; // Aceptar cualquier prop para compatibilidad
}

export function BlurFade({ children, className, ...props }: BlurFadeProps) {
	return (
		<div className={className} {...props}>
			{children}
		</div>
	);
}

export default BlurFade;
