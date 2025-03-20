import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

// 🎨 Tipos para la configuración de la capa holográfica
interface HolographicConfig {
	intensity?: number; // Intensidad del efecto (0-1)
	color?: string; // Color base del efecto
	speed?: number; // Velocidad de la animación
	pattern?: 'lines' | 'grid' | 'dots'; // Patrón del holograma
	glowColor?: string; // Color del brillo
	glowIntensity?: number; // Intensidad del brillo (0-1)
	scanlineSpeed?: number; // Velocidad de las líneas de escaneo
	noiseIntensity?: number; // Intensidad del ruido (0-1)
	distortionAmount?: number; // Cantidad de distorsión (0-1)
	enableFlicker?: boolean; // Habilitar efecto de parpadeo
	flickerFrequency?: number; // Frecuencia del parpadeo (Hz)
}

// 🎨 Propiedades del componente
interface HolographicLayerProps {
	enabled: boolean;
	config?: HolographicConfig;
	children?: React.ReactNode;
}

// 🎨 Valores por defecto
const defaultConfig: HolographicConfig = {
	intensity: 0.5,
	color: '#00ffff',
	speed: 1,
	pattern: 'lines',
	glowColor: '#00ffff',
	glowIntensity: 0.5,
	scanlineSpeed: 1,
	noiseIntensity: 0.1,
	distortionAmount: 0.1,
	enableFlicker: true,
	flickerFrequency: 2
};

// 🎨 Componente HolographicLayer
export const HolographicLayer: React.FC<HolographicLayerProps> = ({
	enabled,
	config = {},
	children
}) => {
	const [noiseMap, setNoiseMap] = useState<string>('');
	const mergedConfig = { ...defaultConfig, ...config };

	// 🎨 Generación del mapa de ruido
	useEffect(() => {
		const generateNoiseMap = () => {
			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d');
			if (!ctx) return;

			canvas.width = 256;
			canvas.height = 256;

			const imageData = ctx.createImageData(256, 256);
			const data = imageData.data;

			for (let i = 0; i < data.length; i += 4) {
				const value = Math.random() * 255;
				data[i] = value;
				data[i + 1] = value;
				data[i + 2] = value;
				data[i + 3] = 255;
			}

			ctx.putImageData(imageData, 0, 0);
			setNoiseMap(canvas.toDataURL());
		};

		generateNoiseMap();
	}, []);

	if (!enabled) return null;

	// 🎨 Estilos base
	const baseStyles = {
		position: 'relative' as const,
		overflow: 'hidden',
		isolation: 'isolate' as const
	};

	// 🎨 Estilos del contenedor holográfico
	const hologramStyles = {
		position: 'absolute' as const,
		inset: 0,
		background: `
      linear-gradient(
        ${mergedConfig.color}${Math.round(mergedConfig.intensity! * 255).toString(16)},
        transparent
      )
    `,
		mixBlendMode: 'overlay' as const,
		pointerEvents: 'none' as const
	};

	// 🎨 Animación de escaneo
	const scanlineAnimation = {
		y: ['0%', '100%'],
		opacity: [0.5, 0.8, 0.5],
		transition: {
			y: {
				duration: 2 / mergedConfig.scanlineSpeed!,
				repeat: Number.POSITIVE_INFINITY,
				ease: 'linear'
			},
			opacity: {
				duration: 1 / mergedConfig.scanlineSpeed!,
				repeat: Number.POSITIVE_INFINITY,
				ease: 'linear'
			}
		}
	};

	// 🎨 Animación de distorsión
	const distortionAnimation = {
		scale: [1, 1 + mergedConfig.distortionAmount! * 0.02],
		x: [0, mergedConfig.distortionAmount! * 2],
		transition: {
			duration: 0.2,
			repeat: Number.POSITIVE_INFINITY,
			repeatType: 'reverse' as const
		}
	};

	// 🎨 Animación de parpadeo
	const flickerAnimation = mergedConfig.enableFlicker
		? {
			opacity: [1, 0.95, 1],
			transition: {
				duration: 1 / mergedConfig.flickerFrequency!,
				repeat: Number.POSITIVE_INFINITY,
				repeatType: 'reverse' as const
			}
		}
		: {};

	return (
		<div
			className={cn(
				'holographic-layer',
				mergedConfig.pattern === 'lines' && 'pattern-lines',
				mergedConfig.pattern === 'grid' && 'pattern-grid',
				mergedConfig.pattern === 'dots' && 'pattern-dots'
			)}
			style={baseStyles}
			data-testid="holographic-layer"
		>
			{children}

			{/* Capa base holográfica */}
			<motion.div
				className="hologram-base"
				style={hologramStyles}
				animate={flickerAnimation}
			/>

			{/* Líneas de escaneo */}
			<motion.div
				className="scanline"
				style={{
					position: 'absolute',
					inset: 0,
					background: `linear-gradient(
            to bottom,
            transparent,
            ${mergedConfig.color}${Math.round(mergedConfig.intensity! * 50).toString(16)},
            transparent
          )`,
					pointerEvents: 'none'
				}}
				animate={scanlineAnimation}
			/>

			{/* Efecto de ruido */}
			<motion.div
				className="noise"
				style={{
					position: 'absolute',
					inset: 0,
					backgroundImage: `url(${noiseMap})`,
					opacity: mergedConfig.noiseIntensity,
					mixBlendMode: 'overlay',
					pointerEvents: 'none'
				}}
				animate={distortionAnimation}
			/>

			{/* Efecto de brillo */}
			<div
				className="glow"
				style={{
					position: 'absolute',
					inset: 0,
					boxShadow: `0 0 20px ${mergedConfig.glowColor}${Math.round(
						mergedConfig.glowIntensity! * 255
					).toString(16)}`,
					pointerEvents: 'none'
				}}
			/>

			{/* Patrones */}
			<div
				className="patterns"
				style={{
					position: 'absolute',
					inset: 0,
					backgroundSize: mergedConfig.pattern === 'grid' ? '20px 20px' : '10px 10px',
					backgroundImage: mergedConfig.pattern === 'grid'
						? `linear-gradient(
                to right,
                ${mergedConfig.color}20 1px,
                transparent 1px
              ),
              linear-gradient(
                to bottom,
                ${mergedConfig.color}20 1px,
                transparent 1px
              )`
						: mergedConfig.pattern === 'lines'
							? `linear-gradient(
                to bottom,
                ${mergedConfig.color}20 1px,
                transparent 1px
              )`
							: `radial-gradient(
                circle,
                ${mergedConfig.color}20 1px,
                transparent 1px
              )`,
					pointerEvents: 'none'
				}}
			/>
		</div>
	);
};

// 🔌 Configuración del plugin
export const HolographicLayerPlugin = {
	id: 'holographic-layer',
	name: 'Holographic Layer',
	type: 'visual',
	description: 'Añade un efecto holográfico a la tarjeta',
	Component: HolographicLayer,
	defaultConfig
};