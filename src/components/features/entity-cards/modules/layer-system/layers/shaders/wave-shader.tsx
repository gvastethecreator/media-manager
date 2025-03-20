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
    uniform vec3 waveColor;

    // Función para generar ondas
    float wave(vec2 uv, float frequency, float amplitude, float speed) {
        return sin(uv.x * frequency + time * speed) * amplitude;
    }

    void main() {
        vec2 uv = vUv;
        vec2 center = vec2(0.5, 0.5);

        // Generar múltiples ondas
        float totalWave = 0.0;
        for(int i = 0; i < 3; i++) {
            float frequency = 10.0 + float(i) * 5.0;
            float amplitude = 0.02 - float(i) * 0.005;
            float speed = 2.0 + float(i) * 0.5;
            totalWave += wave(uv, frequency, amplitude, speed);
        }

        // Efecto de color
        vec3 color = mix(
            waveColor,
            vec3(1.0),
            totalWave * intensity
        );

        // Efecto de transparencia
        float alpha = smoothstep(0.0, 0.5, abs(totalWave)) * intensity;

        gl_FragColor = vec4(color, alpha);
    }
`;

interface WaveShaderProps {
    isExploded: boolean;
    isHovered: boolean;
    activeLayer: string | null;
    getExplodeLayerTransform: ExplodeLayerTransformFunction;
    options?: {
        visibleOnHover?: boolean;
        intensity?: number;
        duration?: number;
        waveColor?: [number, number, number];
    };
}

export function WaveShader(props: WaveShaderProps) {
    const { intensity = 0.5, waveColor = [0.2, 0.4, 0.8] } = props.options || {};
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
                mouse: [0.5, 0.5],
                waveColor,
            }}
        />
    );
}
