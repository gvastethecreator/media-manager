// Componente temporalmente deshabilitado durante migración a GSAP
// Original: blur-fade
import React from 'react';

interface BlurFadeProps {
	children?: React.ReactNode;
	className?: string;
	delay?: number;
	inView?: boolean;
	[key: string]: any; // Aceptar cualquier prop para compatibilidad
}

export function BlurFade({ children, className, delay: _delay, inView: _inView, ...props }: BlurFadeProps) {
	return (
		<div className={className} {...props}>
			{children}
		</div>
	);
}

export default BlurFade;
