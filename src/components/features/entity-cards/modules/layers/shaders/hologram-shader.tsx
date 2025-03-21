import { useEffect, useState } from 'react';
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
    uniform vec3 primaryColor;
    uniform vec3 secondaryColor;

    // Función para generar ruido
    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    // Función para generar líneas de escaneo
    float scanline(vec2 uv) {
        return sin(uv.y * resolution.y * 2.0 + time * 2.0) * 0.5 + 0.5;
    }

    // Función para generar efecto de distorsión
    float distortion(vec2 uv) {
        return sin(uv.y * 10.0 + time) * 0.02;
    }

    void main() {
        vec2 uv = vUv;
        vec2 center = vec2(0.5, 0.5);

        // Efecto de distorsión
        float dist = length(uv - center);
        float distortionAmount = distortion(uv) * smoothstep(0.5, 0.0, dist);
        vec2 distortedUv = uv + vec2(distortionAmount, 0.0);

        // Efecto de escaneo
        float scan = scanline(distortedUv);

        // Efecto de color
        vec3 color = mix(
            primaryColor,
            secondaryColor,
            scan * intensity
        );

        // Efecto de brillo
        float glow = smoothstep(0.5, 0.0, dist);

        // Efecto de ruido
        float noise = random(distortedUv + time) * 0.1;

        // Color final
        vec3 finalColor = mix(
            color,
            vec3(1.0),
            glow * 0.5 + noise * intensity
        );

        // Transparencia
        float alpha = smoothstep(0.0, 0.5, scan) * intensity;

        gl_FragColor = vec4(finalColor, alpha);
    }
`;

interface HologramShaderProps {
    isExploded: boolean;
    isHovered: boolean;
    activeLayer: string | null;
    options?: {
        visibleOnHover?: boolean;
        intensity?: number;
        duration?: number;
        primaryColor?: [number, number, number];
        secondaryColor?: [number, number, number];
    };
}

export function HologramShader(props: HologramShaderProps) {
    const { intensity = 0.5, primaryColor = [0.0, 0.8, 1.0], secondaryColor = [0.8, 0.0, 1.0] } = props.options || {};
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
                primaryColor,
                secondaryColor,
            }}
        />
    );
}
