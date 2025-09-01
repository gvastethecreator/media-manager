// Componente temporalmente deshabilitado durante migración a GSAP
// Original: word-rotate
import React from 'react';

interface WordRotateProps {
	children?: React.ReactNode;
	className?: string;
	[key: string]: any; // Aceptar cualquier prop para compatibilidad
}

export function WordRotate({ children, className, ...props }: WordRotateProps) {
	return (
		<div className={className} {...props}>
			{children}
		</div>
	);
}

export default WordRotate;
