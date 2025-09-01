// Componente temporalmente deshabilitado durante migración a GSAP
// Original: typing-text
import React from 'react';

interface TypingTextProps {
	children?: React.ReactNode;
	className?: string;
	[key: string]: any; // Aceptar cualquier prop para compatibilidad
}

export function TypingText({ children, className, ...props }: TypingTextProps) {
	return (
		<div className={className} {...props}>
			{children}
		</div>
	);
}

export default TypingText;
