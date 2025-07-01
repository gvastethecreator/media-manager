/**
 * @file Tipos de utilidad para el sistema
 * @module types/utils/types/utility-types
 */

export type EntityId = string;
export type JSONString = string;

export type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredKeys<T, K extends keyof T> = Required<Pick<T, K>> & Omit<T, K>;
