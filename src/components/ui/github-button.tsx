// Componente temporalmente deshabilitado durante migración a GSAP
// Original: github-button
import React from 'react';

interface GithubButtonProps {
	children?: React.ReactNode;
	className?: string;
	[key: string]: any; // Aceptar cualquier prop para compatibilidad
}

export function GithubButton({ children, className, ...props }: GithubButtonProps) {
	return (
		<div className={className} {...props}>
			{children}
		</div>
	);
}

export default GithubButton;
