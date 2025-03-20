import { useEffect, useState } from 'react';
import type { ExplodeLayerTransformFunction } from '../../../../types/base-card-types';
import { BaseShader } from './base-shader';

const vertexShader = `
    attribute vec2 position;
    varying vec2 vUv;
    void main() {
        vUv = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
    }
`;

const fragmentShader = `
    precision highp float;
    varying vec2 vUv;
    uniform float time;
    uniform float intensity;
    uniform vec2 resolution;
    uniform vec2 mouse;

    void main() {
        vec2 uv = vUv;
        vec2 center = vec2(0.5, 0.5);
        float dist = length(uv - center);

        // Efecto de distorsión
        float distortion = sin(dist * 10.0 - time) * intensity;
        vec2 distortedUv = uv + normalize(uv - center) * distortion;

        // Efecto de ondulación
        float wave = sin(distortedUv.x * 10.0 + time) * 0.1;
        distortedUv.y += wave;

        // Efecto de color
        vec3 color = vec3(
            sin(distortedUv.x * 10.0 + time),
            cos(distortedUv.y * 10.0 + time),
            sin(distortedUv.x * distortedUv.y * 10.0 + time)
        );

        gl_FragColor = vec4(color, 0.5);
    }
`;

interface DistortionShaderProps {
	isExploded: boolean;
	isHovered: boolean;
	activeLayer: string | null;
	getExplodeLayerTransform: ExplodeLayerTransformFunction;
	options?: {
		visibleOnHover?: boolean;
		intensity?: number;
		duration?: number;
	};
}

export function DistortionShader(props: DistortionShaderProps) {
	const { intensity = 0.1 } = props.options || {};
	const [time, setTime] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			setTime((prev) => prev + 0.016); // Aproximadamente 60fps
		}, 16);

		return () => clearInterval(interval);
	}, []);

	return (
		<BaseShader
			{...props}
			vertexShader={vertexShader}
			fragmentShader={fragmentShader}
			uniforms={{
				time,
				intensity,
				resolution: [window.innerWidth, window.innerHeight],
				mouse: [0.5, 0.5], // Posición del mouse normalizada
			}}
		/>
	);
}
