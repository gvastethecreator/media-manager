// Componente temporalmente deshabilitado durante migración a GSAP
// Original: card-3d
import React from 'react';

interface Card3dProps {
	children?: React.ReactNode;
	className?: string;
	[key: string]: any; // Aceptar cualquier prop para compatibilidad
}

export function Card3d({ children, className, ...props }: Card3dProps) {
	return (
		<div className={className} {...props}>
			{children}
		</div>
	);
}

export default Card3d;
