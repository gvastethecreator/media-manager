import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import type { CSSProperties, MouseEvent, ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

// Tipos flexibles para permitir diferentes sistemas de tipos
interface Card3DProps {
	children: ReactNode;
	className?: string;
	style?: CSSProperties;
	options?: Record<string, unknown>; // Reemplazado any por un tipo más seguro
	onClick?: () => void;
	// Props de accesibilidad
	'aria-labelledby'?: string;
	'aria-describedby'?: string;
}

/**
 * Componente Card3D para efectos de tarjeta 3D
 *
 * Este componente añade un efecto de perspectiva y movimiento 3D a las tarjetas
 * basado en la posición del mouse para crear una sensación de profundidad.
 */
export function Card3D({
	children,
	className,
	style,
	options = {},
	onClick,
	'aria-labelledby': ariaLabelledby,
	'aria-describedby': ariaDescribedby,
}: Card3DProps) {
	// Referencias y estado
	const cardRef = useRef<HTMLDivElement>(null);
	const [isTouchDevice, setIsTouchDevice] = useState(false);
	const [isHovering, setIsHovering] = useState(false);

	// Determinar si es dispositivo táctil al cargar
	useEffect(() => {
		setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
	}, []);

	// Valores de movimiento para la animación
	const rotateX = useMotionValue(0);
	const rotateY = useMotionValue(0);
	const shadowBlur = useTransform(rotateX, [-15, 0, 15], [10, 15, 10]);
	const shadowOpacity = useTransform(rotateX, [-15, 0, 15], [0.3, 0.2, 0.3]);

	// Obtener valores de configuración o usar valores predeterminados
	const enable3DEffect = options.enable3DEffect !== undefined ? options.enable3DEffect : true;
	const maxRotation = options.maxRotation || 5;
	const hoverLiftHeight = options.hoverLiftHeight || 5;

	// Manejar movimiento del ratón
	const handleMouseMove = useCallback(
		(e: MouseEvent<HTMLDivElement>) => {
			if (!cardRef.current || !enable3DEffect || isTouchDevice) return;

			const rect = cardRef.current.getBoundingClientRect();
			const width = rect.width;
			const height = rect.height;

			// Calcular posición relativa del ratón
			const mouseX = e.clientX - rect.left;
			const mouseY = e.clientY - rect.top;

			// Calcular rotación basada en la posición del ratón
			const rY = ((mouseX / width) * 2 - 1) * maxRotation;
			const rX = ((mouseY / height) * 2 - 1) * -maxRotation;

			// Aplicar valores
			rotateX.set(rX);
			rotateY.set(rY);
		},
		[enable3DEffect, isTouchDevice, maxRotation, rotateX, rotateY]
	);

	// Restablecer rotación al salir
	const handleMouseLeave = useCallback(() => {
		if (enable3DEffect) {
			animate(rotateX, 0, { duration: 0.5 });
			animate(rotateY, 0, { duration: 0.5 });
		}
		setIsHovering(false);
	}, [enable3DEffect, rotateX, rotateY]);

	// Establecer hover al entrar
	const handleMouseEnter = useCallback(() => {
		setIsHovering(true);
	}, []);

	// Estilos dinámicos basados en hover y opciones
	const dynamicStyles: CSSProperties = {
		transform: enable3DEffect
			? `perspective(1000px) rotateX(${rotateX.get()}deg) rotateY(${rotateY.get()}deg)`
			: undefined,
		boxShadow: enable3DEffect ? `0 ${shadowBlur.get()}px 30px rgba(0, 0, 0, ${shadowOpacity.get()})` : undefined,
		transition: 'transform 0.1s ease, box-shadow 0.3s ease, translate 0.2s ease',
		translate: isHovering && enable3DEffect ? `0 -${hoverLiftHeight}px` : undefined,
	};

	return (
		<motion.div
			ref={cardRef}
			className={cn('card-3d', className)}
			style={{
				...style,
				...dynamicStyles,
			}}
			onMouseMove={handleMouseMove}
			onMouseLeave={handleMouseLeave}
			onMouseEnter={handleMouseEnter}
			onClick={onClick}
			aria-labelledby={ariaLabelledby}
			aria-describedby={ariaDescribedby}
		>
			{children}
		</motion.div>
	);
}
