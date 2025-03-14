import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import type { ExplodeLayerTransformFunction } from '../../types/base-card-types';

interface ParticleShaderProps {
	isExploded: boolean;
	isHovered: boolean;
	activeLayer: string | null;
	getExplodeLayerTransform: ExplodeLayerTransformFunction;
	options?: {
		visibleOnHover?: boolean;
		intensity?: number;
		duration?: number;
	};
	uniforms?: {
		time?: number;
		resolution?: number[];
		mousePos?: number[];
		particleCount?: number;
		particleSize?: number;
		particleSpeed?: number;
		[key: string]: number | number[] | undefined;
	};
}

export function ParticleShader({
	isExploded,
	isHovered,
	activeLayer,
	getExplodeLayerTransform,
	options = {},
	uniforms = {},
}: ParticleShaderProps) {
	const { visibleOnHover = true, intensity = 1, duration = 1 } = options;
	const { time = 0, particleCount = 100, particleSize = 2, particleSpeed = 1 } = uniforms;

	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationFrameRef = useRef<number | null>(null);
	const [internalTime, setInternalTime] = useState(time);

	// Función para renderizar las partículas
	const renderParticles = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
		// Limpiar el canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Configurar el estilo de las partículas
		ctx.fillStyle = `rgba(255, 255, 255, ${intensity * 0.5})`;

		// Generar y dibujar partículas
		for (let i = 0; i < particleCount; i++) {
			// Usar el tiempo y el índice para calcular la posición
			const t = internalTime * particleSpeed * 0.1;
			const angle = (i / particleCount) * Math.PI * 2;

			// Calcular posiciones con movimiento basado en seno y coseno
			const x = canvas.width / 2 + Math.cos(angle + t) * (canvas.width / 4);
			const y = canvas.height / 2 + Math.sin(angle + t) * (canvas.height / 4);

			// Dibujar la partícula
			ctx.beginPath();
			ctx.arc(x, y, particleSize * (0.5 + Math.sin(t + i) * 0.5), 0, Math.PI * 2);
			ctx.fill();
		}
	};

	// Efecto para configurar y animar las partículas
	useEffect(() => {
		if (!canvasRef.current) {
			return;
		}

		const canvas = canvasRef.current;
		const ctx = canvas.getContext('2d');

		if (!ctx) {
			return;
		}

		// Función de animación
		const animate = () => {
			setInternalTime((prev) => prev + 0.01);

			if (ctx && canvas) {
				renderParticles(ctx, canvas);
			}

			animationFrameRef.current = requestAnimationFrame(animate);
		};

		// Ajustar tamaño del canvas
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;

		// Iniciar animación
		animate();

		// Limpiar al desmontar
		return () => {
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
		};
	}, [particleCount, particleSize, particleSpeed, intensity]);

	// Actualizar el tiempo interno cuando cambia time en uniforms
	useEffect(() => {
		setInternalTime(time);
	}, [time]);

	if (!isHovered && visibleOnHover) {
		return null;
	}

	return (
		<canvas
			ref={canvasRef}
			className={cn(
				'absolute inset-0 pointer-events-none z-30 particle-shader-layer',
				isExploded ? 'exploded-layer' : ''
			)}
			style={{
				...(isExploded ? getExplodeLayerTransform(5) : {}),
				opacity: intensity,
				transition: `opacity ${duration}s ease-in-out`,
			}}
			data-layer-active={activeLayer === 'particle' || null}
		/>
	);
}
