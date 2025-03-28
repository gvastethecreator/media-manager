import { serverLogger } from '@/lib/logger/server-logger';
import type { PromptBase } from '@/types/entities/prompt';
import { PromptCategory, PromptModel } from '@/types/entities/prompt/enums';
import { extractVariablesFromContent, replaceVariablesInContent } from './helpers';

const templatesLogger = serverLogger.withContext('PromptTemplates');

/**
 * Tipos de plantillas disponibles
 */
export enum TemplateType {
	TEXT_GENERATION = 'text_generation',
	TEXT_COMPLETION = 'text_completion',
	DIALOGUE = 'dialogue',
	SUMMARIZATION = 'summarization',
	IMAGE_DESCRIPTION = 'image_description',
	TRANSLATION = 'translation',
	INSTRUCTION = 'instruction',
	CODE_GENERATION = 'code_generation',
	QUESTION_ANSWERING = 'question_answering',
	CUSTOM = 'custom',
}

/**
 * Estructura de una plantilla de prompt
 */
interface PromptTemplate {
	id: string;
	name: string;
	description: string;
	category: PromptCategory;
	model: PromptModel;
	content: string;
	templateType: TemplateType;
	parameters: Record<string, any>;
	exampleVariables?: Record<string, any>;
	tags: string[];
}

/**
 * Plantillas básicas predefinidas
 */
export const PREDEFINED_TEMPLATES: Record<string, PromptTemplate> = {
	text_completion: {
		id: 'template_text_completion',
		name: 'Completar texto',
		description: 'Plantilla para completar un texto existente',
		category: PromptCategory.TEXT,
		model: PromptModel.GPT_3_5,
		content: 'Continúa el siguiente texto de manera coherente y creativa:\n\n{{texto_inicial}}',
		templateType: TemplateType.TEXT_COMPLETION,
		parameters: {
			texto_inicial: 'Érase una vez...',
		},
		exampleVariables: {
			texto_inicial: 'Érase una vez un reino olvidado donde la magia y la tecnología coexistían.',
		},
		tags: ['completar', 'texto', 'creativo'],
	},

	summarization: {
		id: 'template_summarization',
		name: 'Resumir texto',
		description: 'Plantilla para resumir un texto largo',
		category: PromptCategory.TEXT,
		model: PromptModel.GPT_3_5,
		content: 'Resume el siguiente texto en {{longitud}} párrafos, destacando los puntos principales:\n\n{{texto}}',
		templateType: TemplateType.SUMMARIZATION,
		parameters: {
			texto: '[Texto a resumir]',
			longitud: 2,
		},
		exampleVariables: {
			texto:
				'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat...',
			longitud: 1,
		},
		tags: ['resumen', 'síntesis', 'texto'],
	},

	character_creation: {
		id: 'template_character_creation',
		name: 'Crear personaje',
		description: 'Plantilla para crear un personaje detallado',
		category: PromptCategory.CHARACTER,
		model: PromptModel.GPT_4,
		content:
			'Crea un personaje con las siguientes características:\n\n' +
			'Nombre: {{nombre}}\n' +
			'Género: {{genero}}\n' +
			'Edad: {{edad}}\n' +
			'Ocupación: {{ocupacion}}\n' +
			'Personalidad: {{personalidad}}\n\n' +
			'Desarrolla una biografía detallada, motivaciones, fortalezas, debilidades y apariencia física.',
		templateType: TemplateType.TEXT_GENERATION,
		parameters: {
			nombre: '[Nombre del personaje]',
			genero: '[Género]',
			edad: 30,
			ocupacion: '[Ocupación]',
			personalidad: '[Rasgos de personalidad]',
		},
		exampleVariables: {
			nombre: 'Elena Vargas',
			genero: 'Femenino',
			edad: 34,
			ocupacion: 'Arqueóloga',
			personalidad: 'Intrépida, curiosa, tenaz, reservada',
		},
		tags: ['personaje', 'creación', 'worldbuilding', 'narrativa'],
	},

	image_description: {
		id: 'template_image_description',
		name: 'Describir imagen',
		description: 'Plantilla para generar descripciones detalladas de imágenes',
		category: PromptCategory.IMAGE,
		model: PromptModel.CLAUDE_3_SONNET,
		content:
			'Describe la siguiente imagen con gran detalle, incluyendo:\n' +
			'- Elementos principales presentes\n' +
			'- Colores, luces y sombras\n' +
			'- Composición y estilo\n' +
			'- Emoción o atmósfera que transmite\n' +
			'- Contexto o historia que sugiere\n\n' +
			'Tema o categoría de la imagen: {{categoria}}\n' +
			'Nivel de detalle deseado: {{nivel_detalle}}',
		templateType: TemplateType.IMAGE_DESCRIPTION,
		parameters: {
			categoria: '[Categoría de la imagen]',
			nivel_detalle: 'Alto',
		},
		exampleVariables: {
			categoria: 'Paisaje natural',
			nivel_detalle: 'Máximo',
		},
		tags: ['imagen', 'descripción', 'visual', 'detalle'],
	},

	code_generator: {
		id: 'template_code_generator',
		name: 'Generar código',
		description: 'Plantilla para generar código basado en requisitos',
		category: PromptCategory.CODE,
		model: PromptModel.GPT_4,
		content:
			'Genera código {{lenguaje}} que cumpla con los siguientes requisitos:\n\n' +
			'{{requisitos}}\n\n' +
			'Consideraciones adicionales:\n' +
			'- Lenguaje: {{lenguaje}}\n' +
			'- Estilo de código: {{estilo}}\n' +
			'- Incluir comentarios: {{comentarios}}\n\n' +
			'Proporciona el código completo con explicaciones de las decisiones de implementación.',
		templateType: TemplateType.CODE_GENERATION,
		parameters: {
			lenguaje: 'JavaScript',
			requisitos: '[Descripción de funcionalidad]',
			estilo: 'Moderno',
			comentarios: true,
		},
		exampleVariables: {
			lenguaje: 'TypeScript',
			requisitos:
				'Crear una función que ordene un array de objetos por una propiedad específica, con soporte para ordenación ascendente y descendente.',
			estilo: 'Funcional',
			comentarios: true,
		},
		tags: ['código', 'programación', 'desarrollo'],
	},
};

/**
 * Obtiene una plantilla predefinida por su ID
 * @param templateId ID de la plantilla
 * @returns Plantilla encontrada o undefined
 */
export function getTemplateById(templateId: string): PromptTemplate | undefined {
	try {
		return PREDEFINED_TEMPLATES[templateId];
	} catch (error) {
		templatesLogger.error('❌ Error al obtener plantilla por ID:', error);
		return undefined;
	}
}

/**
 * Crea un prompt a partir de una plantilla
 * @param templateId ID de la plantilla
 * @param variables Variables para reemplazar en la plantilla
 * @returns Nuevo prompt basado en la plantilla
 */
export function createPromptFromTemplate(templateId: string, variables?: Record<string, any>): PromptBase | null {
	try {
		// Obtener plantilla
		const template = getTemplateById(templateId);
		if (!template) {
			templatesLogger.error('❌ Plantilla no encontrada:', templateId);
			return null;
		}

		// Variables a usar (variables proporcionadas o ejemplos)
		const varsToUse = variables || template.exampleVariables || template.parameters;

		// Reemplazar variables en contenido
		const content = replaceVariablesInContent(template.content, varsToUse);

		// Crear nuevo prompt
		const newPrompt: PromptBase = {
			id: `prompt_${Date.now()}`,
			title: template.name,
			model: template.model,
			content,
			category: template.category,
			parameters: JSON.stringify(template.parameters),
			tags: JSON.stringify(template.tags),
			isFavorite: false,
			emoji: '📝',
			color: '#3b82f6',
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		return newPrompt;
	} catch (error) {
		templatesLogger.error('❌ Error al crear prompt desde plantilla:', error);
		return null;
	}
}

/**
 * Obtiene las plantillas filtradas por categoría
 * @param category Categoría para filtrar
 * @returns Plantillas encontradas
 */
export function getTemplatesByCategory(category: PromptCategory): PromptTemplate[] {
	try {
		return Object.values(PREDEFINED_TEMPLATES).filter((template) => template.category === category);
	} catch (error) {
		templatesLogger.error('❌ Error al filtrar plantillas por categoría:', error);
		return [];
	}
}

/**
 * Convierte un prompt existente en una plantilla
 * @param prompt Prompt existente
 * @param templateType Tipo de plantilla
 * @param templateName Nombre para la plantilla
 * @returns Nueva plantilla
 */
export function convertPromptToTemplate(
	prompt: PromptBase,
	templateType: TemplateType,
	templateName?: string
): PromptTemplate {
	try {
		// Extraer variables del contenido
		const variables = extractVariablesFromContent(prompt.content);

		// Crear parámetros básicos
		const parameters: Record<string, any> = {};
		variables.forEach((variable) => {
			parameters[variable] = `[${variable.replace(/_/g, ' ')}]`;
		});

		// Parsear tags
		let tags: string[] = [];
		try {
			if (typeof prompt.tags === 'string') {
				tags = prompt.tags === 'empty_array' ? [] : JSON.parse(prompt.tags);
			} else if (Array.isArray(prompt.tags)) {
				tags = prompt.tags;
			}
		} catch (e) {
			tags = [];
		}

		return {
			id: `template_${Date.now()}`,
			name: templateName || prompt.title,
			description: `Plantilla basada en el prompt: ${prompt.title}`,
			category: prompt.category as PromptCategory,
			model: prompt.model as PromptModel,
			content: prompt.content,
			templateType,
			parameters,
			tags,
		};
	} catch (error) {
		templatesLogger.error('❌ Error al convertir prompt a plantilla:', error);

		// Devolver una plantilla básica en caso de error
		return {
			id: `template_${Date.now()}`,
			name: 'Plantilla personalizada',
			description: 'Plantilla creada desde un prompt existente',
			category: PromptCategory.GENERAL,
			model: PromptModel.GPT_3_5,
			content: prompt.content || '',
			templateType: TemplateType.CUSTOM,
			parameters: {},
			tags: [],
		};
	}
}
