'use client';

import { useEffect, useState } from 'react';
import type { BaseLayerConfig, LayerComponentProps } from '../layer-plugin-system';
import { BaseShader } from './base-shader';
import { DistortionShader } from './distortion-shader';
import { HologramShader } from './hologram-shader';
import { ParticleShader } from './particle-shader';
import { WaveShader } from './wave-shader';

// Definición del tipo de configuración para la capa de shader
export interface ShaderConfig extends BaseLayerConfig {
	type: 'base' | 'distortion' | 'hologram' | 'wave' | 'particle';
	intensity: number;
	speed: number;
	color: string;
	blendMode: 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten';
	visibleOnHover: boolean;
	animated: boolean;
	advanced?: {
		fragmentShader?: string;
		vertexShader?: string;
		uniforms?: Record<string, number | number[]>;
	};
}

// Componente principal para la capa de Shader
export function ShaderEffectLayer({
	isExploded,
	isHovered,
	mousePosition,
	activeLayer,
	getExplodeLayerTransform,
	config,
	entityType,
	entityId,
}: LayerComponentProps<ShaderConfig>) {
	const [time, setTime] = useState(0);
	const [animationFrame, setAnimationFrame] = useState<number | null>(null);

	// Efecto para animar el shader si está habilitado
	useEffect(() => {
		if (config.animated) {
			let frame: number;

			const animate = () => {
				setTime((prevTime) => prevTime + 0.01 * config.speed);
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
	}, [config.animated, config.speed]);

	// Configuración base para todos los shaders
	const baseOptions = {
		visibleOnHover: config.visibleOnHover,
		intensity: config.intensity,
		duration: 0.3,
	};

	// Uniforms comunes para todos los shaders
	const commonUniforms = {
		time: time,
		resolution: [window.innerWidth, window.innerHeight],
		mousePos: [mousePosition.x, mousePosition.y],
		intensity: config.intensity,
	};

	// Renderizar el shader según el tipo seleccionado
	switch (config.type) {
		case 'distortion':
			return (
				<DistortionShader
					isExploded={isExploded}
					isHovered={isHovered}
					activeLayer={activeLayer}
					getExplodeLayerTransform={getExplodeLayerTransform}
					options={baseOptions}
					uniforms={{
						...commonUniforms,
						distortionAmount: config.intensity * 0.1,
						distortionSpeed: config.speed,
					}}
				/>
			);

		case 'hologram':
			return (
				<HologramShader
					isExploded={isExploded}
					isHovered={isHovered}
					activeLayer={activeLayer}
					getExplodeLayerTransform={getExplodeLayerTransform}
					options={baseOptions}
					uniforms={{
						...commonUniforms,
						scanlineFrequency: 50.0,
						scanlineIntensity: config.intensity * 0.5,
						hologramColor: [0.0, 0.8, 1.0, 1.0],
					}}
				/>
			);

		case 'wave':
			return (
				<WaveShader
					isExploded={isExploded}
					isHovered={isHovered}
					activeLayer={activeLayer}
					getExplodeLayerTransform={getExplodeLayerTransform}
					options={baseOptions}
					uniforms={{
						...commonUniforms,
						waveAmplitude: config.intensity * 0.05,
						waveFrequency: 10.0 * config.speed,
					}}
				/>
			);

		case 'particle':
			return (
				<ParticleShader
					isExploded={isExploded}
					isHovered={isHovered}
					activeLayer={activeLayer}
					getExplodeLayerTransform={getExplodeLayerTransform}
					options={baseOptions}
					uniforms={{
						...commonUniforms,
						particleCount: 100,
						particleSize: config.intensity * 5.0,
						particleSpeed: config.speed,
					}}
				/>
			);

		// Caso por defecto: shader base personalizado
		default: {
			// Si hay shaders personalizados definidos en configuración avanzada, los usamos
			if (config.advanced?.fragmentShader && config.advanced?.vertexShader) {
				return (
					<BaseShader
						isExploded={isExploded}
						isHovered={isHovered}
						activeLayer={activeLayer}
						getExplodeLayerTransform={getExplodeLayerTransform}
						options={baseOptions}
						vertexShader={config.advanced.vertexShader}
						fragmentShader={config.advanced.fragmentShader}
						uniforms={{
							...commonUniforms,
							...(config.advanced.uniforms || {}),
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
					isExploded={isExploded}
					isHovered={isHovered}
					activeLayer={activeLayer}
					getExplodeLayerTransform={getExplodeLayerTransform}
					options={baseOptions}
					vertexShader={defaultVertexShader}
					fragmentShader={defaultFragmentShader}
					uniforms={commonUniforms}
				/>
			);
		}
	}
}
