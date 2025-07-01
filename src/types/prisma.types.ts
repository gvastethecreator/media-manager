/**
 * @file Tipos base de Prisma con conteos
 * @module types/prisma.types
 */

export interface WithCounts {
	_count?: {
		images?: number;
		children?: number;
		collections?: number;
		albums?: number;
		tags?: number;
		characters?: number;
		places?: number;
		concepts?: number;
		prompts?: number;
		notes?: number;
		groups?: number;
		properties?: number;
		wildcards?: number;
		worldItems?: number;
		[key: string]: number | undefined;
	};
}
