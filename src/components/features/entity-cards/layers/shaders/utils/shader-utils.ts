import type { ShaderConfig } from '../actions/shader-config.action';

// Vertex shader base
const baseVertexShader = `
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

// Fragment shaders por tipo
const fragmentShaders = {
  distortion: `
    precision mediump float;
    varying vec2 vUv;
    uniform float time;
    uniform float intensity;
    uniform vec2 resolution;

    void main() {
      vec2 uv = vUv;
      float distortion = sin(uv.y * 10.0 + time) * intensity;
      uv.x += distortion;
      gl_FragColor = vec4(uv, 0.5 + sin(time) * 0.5, 1.0);
    }
  `,
  hologram: `
    precision mediump float;
    varying vec2 vUv;
    uniform float time;
    uniform vec3 color;
    uniform float scanlineIntensity;

    void main() {
      float scanline = sin(vUv.y * 100.0 + time * 5.0) * scanlineIntensity;
      vec3 hologramColor = color + vec3(scanline);
      float alpha = 0.5 + sin(time) * 0.2;
      gl_FragColor = vec4(hologramColor, alpha);
    }
  `,
  wave: `
    precision mediump float;
    varying vec2 vUv;
    uniform float time;
    uniform float amplitude;
    uniform float frequency;

    void main() {
      float wave = sin(vUv.x * frequency + time) * amplitude;
      vec2 uv = vUv + vec2(0.0, wave);
      gl_FragColor = vec4(uv, 0.5 + sin(time) * 0.5, 1.0);
    }
  `,
  particle: `
    precision mediump float;
    varying vec2 vUv;
    uniform float time;
    uniform float particleSize;
    uniform float particleDensity;

    void main() {
      vec2 uv = vUv;
      float particles = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
      particles = step(1.0 - particleDensity, particles);
      gl_FragColor = vec4(vec3(particles), 1.0) * particleSize;
    }
  `,
};

// Crear y compilar shader
function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Error compilando shader:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

// Inicializar shader
export function initializeShader(gl: WebGLRenderingContext, type: string): WebGLProgram | null {
  // Crear vertex shader
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, baseVertexShader);
  if (!vertexShader) return null;

  // Crear fragment shader
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaders[type as keyof typeof fragmentShaders]);
  if (!fragmentShader) {
    gl.deleteShader(vertexShader);
    return null;
  }

  // Crear programa
  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return null;
  }

  // Adjuntar shaders
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  // Verificar estado
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Error enlazando programa:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return null;
  }

  // Configurar geometría
  const positions = new Float32Array([
    -1, -1,
    1, -1,
    -1, 1,
    -1, 1,
    1, -1,
    1, 1,
  ]);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  const positionLocation = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  return program;
}

// Actualizar uniforms del shader
export function updateShaderUniforms(gl: WebGLRenderingContext, program: WebGLProgram, config: ShaderConfig): void {
  gl.useProgram(program);

  // Uniforms comunes
  const timeLocation = gl.getUniformLocation(program, 'time');
  if (timeLocation) gl.uniform1f(timeLocation, performance.now() * 0.001);

  const resolutionLocation = gl.getUniformLocation(program, 'resolution');
  if (resolutionLocation) gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

  // Uniforms específicos por tipo
  switch (config.type) {
    case 'distortion':
      const intensityLocation = gl.getUniformLocation(program, 'intensity');
      if (intensityLocation) gl.uniform1f(intensityLocation, config.intensity || 0.1);
      break;

    case 'hologram':
      const colorLocation = gl.getUniformLocation(program, 'color');
      if (colorLocation) gl.uniform3f(colorLocation, ...(config.color || [0, 1, 1]));
      const scanlineLocation = gl.getUniformLocation(program, 'scanlineIntensity');
      if (scanlineLocation) gl.uniform1f(scanlineLocation, config.scanlineIntensity || 0.1);
      break;

    case 'wave':
      const amplitudeLocation = gl.getUniformLocation(program, 'amplitude');
      if (amplitudeLocation) gl.uniform1f(amplitudeLocation, config.amplitude || 0.1);
      const frequencyLocation = gl.getUniformLocation(program, 'frequency');
      if (frequencyLocation) gl.uniform1f(frequencyLocation, config.frequency || 10.0);
      break;

    case 'particle':
      const particleSizeLocation = gl.getUniformLocation(program, 'particleSize');
      if (particleSizeLocation) gl.uniform1f(particleSizeLocation, config.particleSize || 0.5);
      const particleDensityLocation = gl.getUniformLocation(program, 'particleDensity');
      if (particleDensityLocation) gl.uniform1f(particleDensityLocation, config.particleDensity || 0.5);
      break;
  }
}