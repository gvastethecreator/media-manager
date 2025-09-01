// Componente temporalmente deshabilitado durante migración a GSAP
// Original: text-reveal
import React from 'react';

interface TextRevealProps {
	children?: React.ReactNode;
	className?: string;
	[key: string]: any; // Aceptar cualquier prop para compatibilidad
}

export function TextReveal({ children, className, ...props }: TextRevealProps) {
	return (
		<div className={className} {...props}>
			{children}
		</div>
	);
}

export default TextReveal;
