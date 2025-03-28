'use client';

import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { withBaseLayer } from '../../components/base-layer';
import { BaseShader } from '../base-shader';
import { DistortionShader } from '../distortion-shader';
import { HologramShader } from '../hologram-shader';
import { ParticleShader } from '../particle-shader';
import type { ShaderConfig } from '../shader-config-schema';
import { WaveShader } from '../wave-shader';

interface ShaderLayerProps {
	processedConfig: ShaderConfig;
	style: React.CSSProperties;
	isVisible: boolean;
	isActive: boolean;
	safeMousePosition: { x: number; y: number };
}

/**
 * 🌟 Componente interno de shader
 */
const ShaderLayerComponent = ({ processedConfig, style, isVisible, isActive, safeMousePosition }: ShaderLayerProps) => {
	const [time, setTime] = useState(0);
	const [animationFrame, setAnimationFrame] = useState<number | null>(null);

	// Efecto para animar el shader si está habilitado
	useEffect(() => {
		if (processedConfig.animated && isVisible) {
			let frame: number;

			const animate = () => {
				setTime((prevTime) => prevTime + 0.01 * processedConfig.speed);
				frame = requestAnimationFrame(animate);
				return frame;
			};

			frame = requestAnimationFrame(animate);

			return () => {
				if (frame) {
					cancelAnimationFrame(frame);
				}
			};
		}
	}, [processedConfig.animated, processedConfig.speed, isVisible]);

	// Configuración base para todos los shaders
	const baseOptions = {
		visibleOnHover: processedConfig.visibleOnHover,
		intensity: processedConfig.intensity,
		duration: 0.3,
	};

	// Uniforms comunes para todos los shaders
	const commonUniforms = {
		time: time,
		resolution: [window.innerWidth, window.innerHeight],
		mousePos: [safeMousePosition.x, safeMousePosition.y],
		intensity: processedConfig.intensity,
	};

	// Renderizar el shader según el tipo seleccionado
	const renderShader = useCallback(() => {
		switch (processedConfig.type) {
			case 'distortion':
				return (
					<DistortionShader
						isExploded={isActive}
						isHovered={isVisible}
						activeLayer={isActive ? 'shader' : null}
						getExplodeLayerTransform={() => ({})}
						options={baseOptions}
						uniforms={{
							...commonUniforms,
							distortionAmount: processedConfig.intensity * 0.1,
							distortionSpeed: processedConfig.speed,
						}}
					/>
				);

			case 'hologram':
				return (
					<HologramShader
						isExploded={isActive}
						isHovered={isVisible}
						activeLayer={isActive ? 'shader' : null}
						getExplodeLayerTransform={() => ({})}
						options={baseOptions}
						uniforms={{
							...commonUniforms,
							scanlineFrequency: 50.0,
							scanlineIntensity: processedConfig.intensity * 0.5,
							hologramColor: [0.0, 0.8, 1.0, 1.0],
						}}
					/>
				);

			case 'wave':
				return (
					<WaveShader
						isExploded={isActive}
						isHovered={isVisible}
						activeLayer={isActive ? 'shader' : null}
						getExplodeLayerTransform={() => ({})}
						options={baseOptions}
						uniforms={{
							...commonUniforms,
							waveAmplitude: processedConfig.intensity * 0.05,
							waveFrequency: 10.0 * processedConfig.speed,
						}}
					/>
				);

			case 'particle':
				return (
					<ParticleShader
						isExploded={isActive}
						isHovered={isVisible}
						activeLayer={isActive ? 'shader' : null}
						getExplodeLayerTransform={() => ({})}
						options={baseOptions}
						uniforms={{
							...commonUniforms,
							particleCount: 100,
							particleSize: processedConfig.intensity * 5.0,
							particleSpeed: processedConfig.speed,
						}}
					/>
				);

			// Caso por defecto: shader base personalizado
			default: {
				// Si hay shaders personalizados definidos en configuración avanzada, los usamos
				if (processedConfig.advanced?.fragmentShader && processedConfig.advanced?.vertexShader) {
					return (
						<BaseShader
							isExploded={isActive}
							isHovered={isVisible}
							activeLayer={isActive ? 'shader' : null}
							getExplodeLayerTransform={() => ({})}
							options={baseOptions}
							vertexShader={processedConfig.advanced.vertexShader}
							fragmentShader={processedConfig.advanced.fragmentShader}
							uniforms={{
								...commonUniforms,
								...(processedConfig.advanced.uniforms || {}),
							}}
						/>
					);
				}

				// Shader básico por defecto
				const defaultVertexShader = `
			attribute vec2 position;
			varying vec2 vUv;
			void main() {
			vUv = 0.5 * (position + 1.0);
			gl_Position = vec4(position, 0.0, 1.0);
			}
		`;

				const defaultFragmentShader = `
			precision mediump float;
			varying vec2 vUv;
			uniform float time;
			uniform vec2 resolution;
			uniform float intensity;

			void main() {
			vec2 uv = vUv;
			vec3 color = 0.5 + 0.5 * cos(time + uv.xyx + vec3(0, 2, 4));
			gl_FragColor = vec4(color * intensity, 1.0);
			}
		`;

				return (
					<BaseShader
						isExploded={isActive}
						isHovered={isVisible}
						activeLayer={isActive ? 'shader' : null}
						getExplodeLayerTransform={() => ({})}
						options={baseOptions}
						vertexShader={defaultVertexShader}
						fragmentShader={defaultFragmentShader}
						uniforms={commonUniforms}
					/>
				);
			}
		}
	}, [processedConfig, isVisible, isActive, safeMousePosition, time]);

	return (
		<motion.div
			style={style}
			className="absolute inset-0 pointer-events-none"
			initial={{ opacity: 0 }}
			animate={{ opacity: isVisible ? processedConfig.opacity || 1 : 0 }}
			transition={{ duration: 0.3 }}
		>
			{renderShader()}
		</motion.div>
	);
};

/**
 * 🌟 Capa de shader con funcionalidad base
 */
export const ShaderLayer = withBaseLayer<ShaderConfig>(ShaderLayerComponent);
