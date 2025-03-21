/**
 * Utilidades para la gestión de shaders WebGL
 */

import type { ShaderConfig } from '../shader-config-schema';

/**
 * Inicializa un shader WebGL
 */
export function initializeShader(gl: WebGLRenderingContext, type: string): WebGLProgram | null {
	// Determinar qué shaders usar según el tipo
	const { vertexShader, fragmentShader } = getShaderSources(type);

	// Compilar shaders
	const vertexShaderObj = compileShader(gl, gl.VERTEX_SHADER, vertexShader);
	const fragmentShaderObj = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShader);

	if (!vertexShaderObj || !fragmentShaderObj) {
		return null;
	}

	// Crear programa y vincular shaders
	const program = gl.createProgram();
	if (!program) {
		console.error('No se pudo crear el programa WebGL');
		return null;
	}

	gl.attachShader(program, vertexShaderObj);
	gl.attachShader(program, fragmentShaderObj);
	gl.linkProgram(program);

	// Verificar estado del programa
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.error('Error al vincular el programa:', gl.getProgramInfoLog(program));
		gl.deleteProgram(program);
		return null;
	}

	// Configurar buffer de geometría (un cuadrado que cubre toda la pantalla)
	setupGeometry(gl, program);

	return program;
}

/**
 * Actualiza los uniformes del shader
 */
export function updateShaderUniforms(
	gl: WebGLRenderingContext,
	program: WebGLProgram,
	config: ShaderConfig
): void {
	gl.useProgram(program);

	// Uniforms comunes
	setUniform(gl, program, 'time', 'float', config.speed || 0);
	setUniform(gl, program, 'intensity', 'float', config.intensity || 0.5);

	// Uniforms específicos según tipo
	if (config.type === 'wave') {
		setUniform(gl, program, 'waveAmplitude', 'float', config.intensity * 0.05);
		setUniform(gl, program, 'waveFrequency', 'float', 10.0 * (config.speed || 1));
	} else if (config.type === 'distortion') {
		setUniform(gl, program, 'distortionAmount', 'float', config.intensity * 0.1);
		setUniform(gl, program, 'distortionSpeed', 'float', config.speed || 1);
	} else if (config.type === 'hologram') {
		setUniform(gl, program, 'scanlineFrequency', 'float', 50.0);
		setUniform(gl, program, 'scanlineIntensity', 'float', config.intensity * 0.5);
		// Convertir color hexadecimal a RGB
		const color = hexToRgb(config.color || '#00aaff');
		setUniform(gl, program, 'hologramColor', 'vec3', [color.r / 255, color.g / 255, color.b / 255]);
	} else if (config.type === 'particle') {
		setUniform(gl, program, 'particleCount', 'float', 100);
		setUniform(gl, program, 'particleSize', 'float', config.intensity * 5.0);
		setUniform(gl, program, 'particleSpeed', 'float', config.speed || 1);
	}

	// Uniforms personalizados adicionales
	if (config.advanced?.uniforms) {
		Object.entries(config.advanced.uniforms).forEach(([name, value]) => {
			if (Array.isArray(value)) {
				if (value.length === 2) {
					setUniform(gl, program, name, 'vec2', value);
				} else if (value.length === 3) {
					setUniform(gl, program, name, 'vec3', value);
				} else if (value.length === 4) {
					setUniform(gl, program, name, 'vec4', value);
				}
			} else {
				setUniform(gl, program, name, 'float', value);
			}
		});
	}
}

/**
 * Obtiene el código fuente de los shaders según el tipo
 */
function getShaderSources(type: string): { vertexShader: string; fragmentShader: string } {
	// Shader de vértices básico (común para todos)
	const vertexShader = `
    attribute vec2 position;
    varying vec2 vUv;
    void main() {
      vUv = 0.5 * (position + 1.0);
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

	// Shader de fragmentos según el tipo
	let fragmentShader = '';

	switch (type) {
		case 'wave':
			fragmentShader = `
        precision mediump float;
        varying vec2 vUv;
        uniform float time;
        uniform float intensity;
        uniform float waveAmplitude;
        uniform float waveFrequency;

        void main() {
          vec2 uv = vUv;
          float wave = sin(uv.x * waveFrequency + time) * waveAmplitude;
          uv.y += wave;
          vec3 color = vec3(0.0, 0.6, 1.0) * intensity;
          gl_FragColor = vec4(color, 0.7 * intensity);
        }
      `;
			break;

		case 'distortion':
			fragmentShader = `
        precision mediump float;
        varying vec2 vUv;
        uniform float time;
        uniform float intensity;
        uniform float distortionAmount;
        uniform float distortionSpeed;

        void main() {
          vec2 uv = vUv;
          uv.x += sin(uv.y * 10.0 + time * distortionSpeed) * distortionAmount;
          uv.y += cos(uv.x * 10.0 + time * distortionSpeed) * distortionAmount;
          vec3 color = vec3(uv.x, uv.y, 0.5) * intensity;
          gl_FragColor = vec4(color, 0.7 * intensity);
        }
      `;
			break;

		case 'hologram':
			fragmentShader = `
        precision mediump float;
        varying vec2 vUv;
        uniform float time;
        uniform float intensity;
        uniform float scanlineFrequency;
        uniform float scanlineIntensity;
        uniform vec3 hologramColor;

        void main() {
          vec2 uv = vUv;
          float scanline = sin(uv.y * scanlineFrequency + time) * 0.5 + 0.5;
          scanline = pow(scanline, 1.0) * scanlineIntensity;
          vec3 color = hologramColor * intensity * (0.8 + 0.2 * scanline);
          float alpha = 0.7 * intensity * (0.9 + 0.1 * scanline);
          gl_FragColor = vec4(color, alpha);
        }
      `;
			break;

		case 'particle':
			fragmentShader = `
        precision mediump float;
        varying vec2 vUv;
        uniform float time;
        uniform float intensity;
        uniform float particleCount;
        uniform float particleSize;
        uniform float particleSpeed;

        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
        }

        void main() {
          vec2 uv = vUv;
          float particles = 0.0;

          for (float i = 0.0; i < 20.0; i++) {
            if (i >= particleCount) break;

            vec2 pos = vec2(
              random(vec2(i, 0.0)) * 2.0 - 1.0,
              fract(random(vec2(0.0, i)) + time * 0.1 * particleSpeed) * 2.0 - 1.0
            );

            particles += smoothstep(particleSize * 0.01, 0.0, length(uv - pos));
          }

          vec3 color = vec3(0.3, 0.5, 1.0) * particles * intensity;
          gl_FragColor = vec4(color, particles * intensity);
        }
      `;
			break;

		default:
			fragmentShader = `
        precision mediump float;
        varying vec2 vUv;
        uniform float time;
        uniform float intensity;

        void main() {
          vec2 uv = vUv;
          vec3 color = 0.5 + 0.5 * cos(time + uv.xyx + vec3(0, 2, 4));
          gl_FragColor = vec4(color * intensity, 0.7 * intensity);
        }
      `;
	}

	return { vertexShader, fragmentShader };
}

/**
 * Compila un shader
 */
function compileShader(
	gl: WebGLRenderingContext,
	type: number,
	source: string
): WebGLShader | null {
	const shader = gl.createShader(type);
	if (!shader) {
		console.error('No se pudo crear el shader');
		return null;
	}

	gl.shaderSource(shader, source);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.error(
			'Error al compilar el shader:',
			gl.getShaderInfoLog(shader),
			'\nCódigo fuente:',
			source
		);
		gl.deleteShader(shader);
		return null;
	}

	return shader;
}

/**
 * Configura la geometría del shader (un cuadrado que cubre toda la pantalla)
 */
function setupGeometry(gl: WebGLRenderingContext, program: WebGLProgram): void {
	const positionAttribute = gl.getAttribLocation(program, 'position');
	const positionBuffer = gl.createBuffer();

	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	const positions = new Float32Array([-1, -1, -1, 1, 1, 1, -1, -1, 1, 1, 1, -1]);
	gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

	gl.enableVertexAttribArray(positionAttribute);
	gl.vertexAttribPointer(positionAttribute, 2, gl.FLOAT, false, 0, 0);
}

/**
 * Establece un uniform en el shader
 */
function setUniform(
	gl: WebGLRenderingContext,
	program: WebGLProgram,
	name: string,
	type: 'float' | 'vec2' | 'vec3' | 'vec4',
	value: number | number[]
): void {
	const location = gl.getUniformLocation(program, name);
	if (!location) return;

	switch (type) {
		case 'float':
			gl.uniform1f(location, value as number);
			break;
		case 'vec2':
			gl.uniform2fv(location, value as number[]);
			break;
		case 'vec3':
			gl.uniform3fv(location, value as number[]);
			break;
		case 'vec4':
			gl.uniform4fv(location, value as number[]);
			break;
	}
}

/**
 * Convierte un color hexadecimal a RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
	// Eliminar # si existe
	hex = hex.replace(/^#/, '');

	// Parsear como hexadecimal
	const bigint = Number.parseInt(hex, 16);

	return {
		r: (bigint >> 16) & 255,
		g: (bigint >> 8) & 255,
		b: bigint & 255,
	};
}