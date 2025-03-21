import { z } from 'zod';
import { layerBaseConfigSchema } from '../layer-config-base';

// Esquema para los uniforms de shader
export const shaderUniformsSchema = z.record(z.string(), z.union([z.number(), z.array(z.number())]));

// Esquema para la configuración avanzada del shader
export const shaderAdvancedConfigSchema = z.object({
	fragmentShader: z.string().optional(),
	vertexShader: z.string().optional(),
	uniforms: z.record(z.string(), z.union([z.number(), z.array(z.number())])).optional(),
});

// Esquema principal para la configuración de shaders
export const shaderConfigSchema = layerBaseConfigSchema.extend({
	type: z.enum(['base', 'distortion', 'hologram', 'wave', 'particle']),
	intensity: z.number().min(0).max(1).default(0.5),
	speed: z.number().min(0).max(5).default(1),
	color: z.string().default('#ffffff'),
	blendMode: z.enum(['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten']).default('screen'),
	visibleOnHover: z.boolean().default(false),
	animated: z.boolean().default(true),
	advanced: shaderAdvancedConfigSchema.optional(),
});

// Tipo para la configuración del shader
export type ShaderConfig = z.infer<typeof shaderConfigSchema>;

// Esquema para la respuesta del servidor
export const shaderConfigResponseSchema = z.object({
	success: z.boolean(),
	data: shaderConfigSchema.optional(),
	error: z.string().optional(),
});

// Esquema para los parámetros de la entidad
export const entityParamsSchema = z.object({
	entityType: z.string(),
	entityId: z.string().optional(),
});

/**
 * 🎨 Crea una configuración por defecto para los shaders
 */
export function createDefaultShaderConfig(): ShaderConfig {
	return {
		enabled: true,
		layerIndex: 5,
		type: 'base',
		intensity: 0.5,
		speed: 1,
		color: '#00aaff',
		blendMode: 'screen',
		visibleOnHover: false,
		animated: true,
		opacity: 1,
	};
}

// Configuración por defecto para shaders
export const defaultShaderConfig: ShaderConfig = createDefaultShaderConfig();
