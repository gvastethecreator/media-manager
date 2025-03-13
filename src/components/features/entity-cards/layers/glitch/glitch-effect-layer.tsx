'use client';

import { cn } from '@/lib/utils';
import { motion, useAnimate } from 'framer-motion';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { type GlitchEffectConfig, getGlitchEffectConfig } from './actions/glitch-effect-config.action';

interface GlitchEffectLayerProps {
	entityType: string;
	entityId?: string;
	children: React.ReactNode;
	className?: string;
	config?: GlitchEffectConfig;
}

export function GlitchEffectLayer({
	entityType,
	entityId,
	children,
	className,
	config: initialConfig,
}: GlitchEffectLayerProps) {
	const [scope, animate] = useAnimate();
	const [config, setConfig] = useState<GlitchEffectConfig | null>(initialConfig || null);
	const [isActive, setIsActive] = useState(false);
	const [isHovering, setIsHovering] = useState(false);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);

	// Cargar la configuración
	useEffect(() => {
		if (!initialConfig) {
			const fetchConfig = async () => {
				try {
					const response = await getGlitchEffectConfig(entityType, entityId);
					if (response.success && response.data) {
						setConfig(response.data);
					}
				} catch (error) {
					console.error('Error al cargar la configuración del efecto glitch:', error);
				}
			};

			fetchConfig();
		}
	}, [entityType, entityId, initialConfig]);

	// Configurar la activación aleatoria
	useEffect(() => {
		if (!config || !config.enabled || !config.randomTrigger) {
			return;
		}

		const setupRandomTrigger = () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}

			const triggerProbability = config.randomFrequency;
			const checkInterval = 1000; // Verificar cada segundo

			intervalRef.current = setInterval(() => {
				if (Math.random() < triggerProbability) {
					triggerGlitchEffect();
				}
			}, checkInterval);
		};

		setupRandomTrigger();

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, [config]);

	// Función para activar el efecto glitch
	const triggerGlitchEffect = () => {
		if (!config || !config.enabled) {
			return;
		}

		setIsActive(true);

		// Limpiar timeout existente si hay uno
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}

		// Aplicar animaciones
		applyGlitchAnimations();

		// Detener después del tiempo configurado
		if (config.stopAfterSeconds && config.stopAfterSeconds > 0) {
			timeoutRef.current = setTimeout(() => {
				setIsActive(false);
			}, config.stopAfterSeconds * 1000);
		}
	};

	// Función para aplicar las animaciones de glitch
	const applyGlitchAnimations = async () => {
		if (!config || !scope.current) {
			return;
		}

		// Crear varios keyframes para simular cortes y desplazamiento
		const createGlitchKeyframes = () => {
			const keyframes = [];
			const steps = Math.max(10, config.sliceCount * 2);

			for (let i = 0; i < steps; i++) {
				// Crear un keyframe con transformaciones aleatorias
				const xShift = Math.random() * config.sliceOffset * (Math.random() > 0.5 ? 1 : -1);
				const yShift = Math.random() * (config.sliceOffset / 2) * (Math.random() > 0.5 ? 1 : -1);
				const skewX = Math.random() * 2 * (Math.random() > 0.5 ? 1 : -1);

				// Desplazamiento de color RGB
				const rgbShiftX = config.rgbShiftEnabled ?
					Math.random() * config.colorShiftAmount * 10 : 0;

				// Ajuste de brillo aleatorio
				const brightness = 1 + (Math.random() * config.brightnessNoise * 2 - config.brightnessNoise);

				keyframes.push({
					clipPath: generateRandomClipPath(config.sliceCount),
					transform: `translate(${xShift}px, ${yShift}px) skewX(${skewX}deg)`,
					filter: `brightness(${brightness}) contrast(${1 + Math.random() * 0.3}) blur(${Math.random() > 0.8 ? Math.random() * 2 : 0}px)`,
					boxShadow: config.rgbShiftEnabled ?
						`rgba(255,0,0,${config.colorShiftAmount}) ${-rgbShiftX}px 0px,
						 rgba(0,255,0,${config.colorShiftAmount}) 0px 0px,
						 rgba(0,0,255,${config.colorShiftAmount}) ${rgbShiftX}px 0px` : 'none',
				});
			}

			return keyframes;
		};

		// Generar un clip-path aleatorio para simular cortes
		const generateRandomClipPath = (slices: number): string => {
			if (slices <= 0) {
				return 'none';
			}

			const clipPoints = [];
			const sliceHeight = 100 / slices;

			for (let i = 0; i <= slices; i++) {
				const y = i * sliceHeight;
				const xOffset = i % 2 === 0 ? 0 : Math.random() * config.sliceOffset;

				clipPoints.push(`${xOffset}% ${y}%`);
				clipPoints.push(`${100 - xOffset}% ${y}%`);
			}

			return `polygon(${clipPoints.join(', ')})`;
		};

		// Animar el contenedor
		await animate(
			scope.current,
			createGlitchKeyframes(),
			{
				duration: config.duration,
				times: Array.from({ length: Math.max(10, config.sliceCount * 2) }, (_, i) => i / (Math.max(10, config.sliceCount * 2) - 1)),
				ease: 'linear',
			}
		);

		// Si no se debe detener automáticamente, continuar con la animación
		if (!config.stopAfterSeconds && isActive) {
			applyGlitchAnimations();
		}
	};

	// Manejar eventos de ratón
	const handleMouseEnter = () => {
		setIsHovering(true);
		if (config?.triggerOnHover) {
			triggerGlitchEffect();
		}
	};

	const handleMouseLeave = () => {
		setIsHovering(false);
	};

	// Si no hay configuración o no está habilitado, mostrar solo los hijos
	if (!config || !config.enabled) {
		return <>{children}</>;
	}

	return (
		<div
			className={cn("relative w-full h-full overflow-hidden", className)}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			{/* Capa con el contenido original */}
			<div className="w-full h-full z-10 relative">
				{children}
			</div>

			{/* Capa del efecto glitch */}
			{(isActive || (config.visibleOnHover && isHovering)) && (
				<>
					{/* Contenedor principal del efecto */}
					<motion.div
						ref={scope}
						className={cn(
							"absolute inset-0 z-20 mix-blend-overlay",
							{
								"pointer-events-none": true,
								"mix-blend-normal": config.blendMode === 'normal',
								"mix-blend-overlay": config.blendMode === 'overlay',
								"mix-blend-screen": config.blendMode === 'screen',
								"mix-blend-multiply": config.blendMode === 'multiply',
								"mix-blend-difference": config.blendMode === 'difference',
							}
						)}
						style={{
							backgroundColor: `rgba(255,255,255,${config.noiseIntensity / 10})`,
						}}
					>
						{/* Contenido clonado para el efecto si debe afectar también al contenido */}
						{config.affectContent && (
							<div className="w-full h-full relative">
								{children}
							</div>
						)}
					</motion.div>

					{/* Capa de ruido estático */}
					{config.staticNoise > 0 && (
						<div
							className="absolute inset-0 z-20 pointer-events-none opacity-30 mix-blend-overlay"
							style={{
								backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 250 250\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
								backgroundSize: 'cover',
								opacity: config.staticNoise,
							}}
						/>
					)}

					{/* Capa de líneas de escaneo */}
					{config.scanlineEffect && (
						<div
							className="absolute inset-0 z-20 pointer-events-none mix-blend-overlay"
							style={{
								backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 2px)',
								backgroundSize: '100% 3px',
								opacity: 0.3,
							}}
						/>
					)}
				</>
			)}
		</div>
	);
}
