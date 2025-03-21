import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

type UniformValue = number | number[];

interface BaseShaderProps {
	isExploded: boolean;
	isHovered: boolean;
	activeLayer: string | null;
	options?: {
		visibleOnHover?: boolean;
		intensity?: number;
		duration?: number;
	};
	vertexShader: string;
	fragmentShader: string;
	uniforms?: Record<string, UniformValue>;
}

export function BaseShader({
	isExploded,
	isHovered,
	activeLayer,
	options = {},
	vertexShader,
	fragmentShader,
	uniforms = {},
}: BaseShaderProps) {
	const { visibleOnHover = true, intensity = 1, duration = 1 } = options;
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const glRef = useRef<WebGLRenderingContext | null>(null);
	const programRef = useRef<WebGLProgram | null>(null);

	useEffect(() => {
		if (!canvasRef.current) {
			return;
		}

		const canvas = canvasRef.current;
		const gl = canvas.getContext('webgl');
		if (!gl) {
			return;
		}

		glRef.current = gl;

		// Crear y compilar shaders
		const program = gl.createProgram();
		if (!program) {
			return;
		}

		const vertexShaderObj = gl.createShader(gl.VERTEX_SHADER);
		const fragmentShaderObj = gl.createShader(gl.FRAGMENT_SHADER);

		if (!vertexShaderObj || !fragmentShaderObj) {
			return;
		}

		gl.shaderSource(vertexShaderObj, vertexShader);
		gl.shaderSource(fragmentShaderObj, fragmentShader);

		gl.compileShader(vertexShaderObj);
		gl.compileShader(fragmentShaderObj);

		gl.attachShader(program, vertexShaderObj);
		gl.attachShader(program, fragmentShaderObj);

		gl.linkProgram(program);
		programRef.current = program;
		gl.useProgram(program);

		// Configurar atributos y uniforms
		const positionAttributeLocation = gl.getAttribLocation(program, 'position');
		const positionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
		gl.enableVertexAttribArray(positionAttributeLocation);
		gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

		// Configurar uniforms
		for (const [name, value] of Object.entries(uniforms)) {
			const location = gl.getUniformLocation(program, name);
			if (location) {
				if (typeof value === 'number') {
					gl.uniform1f(location, value);
				} else if (Array.isArray(value)) {
					if (value.length === 2) {
						gl.uniform2f(location, value[0], value[1]);
					} else if (value.length === 3) {
						gl.uniform3f(location, value[0], value[1], value[2]);
					} else if (value.length === 4) {
						gl.uniform4f(location, value[0], value[1], value[2], value[3]);
					}
				}
			}
		}

		// Función de renderizado
		const render = () => {
			if (!gl || !program) {
				return;
			}

			gl.viewport(0, 0, canvas.width, canvas.height);
			gl.clearColor(0, 0, 0, 0);
			gl.clear(gl.COLOR_BUFFER_BIT);

			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
			requestAnimationFrame(render);
		};

		render();

		return () => {
			gl.deleteProgram(program);
		};
	}, [vertexShader, fragmentShader, uniforms]);

	if (!isHovered && visibleOnHover) {
		return null;
	}

	return (
		<canvas
			ref={canvasRef}
			className={cn('absolute inset-0 pointer-events-none z-30 shader-layer', isExploded ? 'exploded-layer' : '')}
			style={{
				opacity: intensity,
				transition: `opacity ${duration}s ease-in-out`,
			}}
			data-layer-active={activeLayer === 'shader' || null}
			width={window.innerWidth}
			height={window.innerHeight}
		/>
	);
}
