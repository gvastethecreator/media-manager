/**
 * Tipo para los parámetros de generación por IA
 */
export interface AIGenerationParams {
	prompt?: string;
	negative_prompt?: string;
	seed?: number | string;
	width?: number;
	height?: number;
	steps?: number;
	cfg_scale?: number;
	sampler?: string;
	strength?: number;
	model?: string;
	[key: string]: string | number | boolean | undefined | null | string[] | number[]; // Para otros parámetros extra que puedan existir
}

/**
 * Interfaz para la información de generación por IA
 */
export interface AIGenerationMetadata {
	type?: string;
	model?: string;
	prompt?: string;
	negative_prompt?: string;
	seed?: number | string;
	extra_params?: AIGenerationParams;
	raw_info?: string | Record<string, unknown>;
}
