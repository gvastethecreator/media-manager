/**
 * @file Tipos para manejo de formularios
 * @module types/form
 */

import { z } from 'zod';

/**
 * Tipos de campos de formulario
 */
export enum FieldType {
	TEXT = 'text',
	TEXTAREA = 'textarea',
	NUMBER = 'number',
	SELECT = 'select',
	MULTISELECT = 'multiselect',
	CHECKBOX = 'checkbox',
	SWITCH = 'switch',
	RADIO = 'radio',
	DATE = 'date',
	TIME = 'time',
	DATETIME = 'datetime',
	FILE = 'file',
	IMAGE = 'image',
	COLOR = 'color',
	EMOJI = 'emoji',
	SLIDER = 'slider',
	RATING = 'rating',
	TAGS = 'tags',
	ENTITY = 'entity',
	JSON = 'json',
}

/**
 * Opciones para campos select/radio
 */
export interface FieldOption {
	value: string | number | boolean;
	label: string;
	description?: string;
	icon?: string;
	disabled?: boolean;
}

/**
 * Validadores de campo
 */
export interface FieldValidation {
	required?: boolean;
	min?: number;
	max?: number;
	minLength?: number;
	maxLength?: number;
	pattern?: string;
	custom?: (value: any) => boolean;
	message?: string;
}

/**
 * Props base para campos
 */
export interface BaseFieldProps {
	id: string;
	name: string;
	label?: string;
	type: FieldType;
	defaultValue?: any;
	placeholder?: string;
	description?: string;
	disabled?: boolean;
	readonly?: boolean;
	hidden?: boolean;
	validation?: FieldValidation;
	className?: string;
	onChange?: (value: any) => void;
	onBlur?: () => void;
}

/**
 * Props específicas por tipo de campo
 */
export interface TextFieldProps extends BaseFieldProps {
	type: FieldType.TEXT | FieldType.TEXTAREA;
	maxLength?: number;
	rows?: number;
}

export interface NumberFieldProps extends BaseFieldProps {
	type: FieldType.NUMBER | FieldType.SLIDER;
	min?: number;
	max?: number;
	step?: number;
}

export interface SelectFieldProps extends BaseFieldProps {
	type: FieldType.SELECT | FieldType.MULTISELECT | FieldType.RADIO;
	options: FieldOption[];
	searchable?: boolean;
	clearable?: boolean;
}

export interface FileFieldProps extends BaseFieldProps {
	type: FieldType.FILE | FieldType.IMAGE;
	accept?: string;
	maxSize?: number;
	multiple?: boolean;
}

export interface EntityFieldProps extends BaseFieldProps {
	type: FieldType.ENTITY;
	entityType: string;
	multiple?: boolean;
	showPreview?: boolean;
}

/**
 * Estado de campo
 */
export interface FieldState {
	value: any;
	touched: boolean;
	dirty: boolean;
	error?: string;
}

/**
 * Estado de formulario
 */
export interface FormState {
	values: Record<string, any>;
	touched: Record<string, boolean>;
	dirty: boolean;
	errors: Record<string, string>;
	isValid: boolean;
	isSubmitting: boolean;
}

// Validaciones Zod
export const fieldTypeSchema = z.nativeEnum(FieldType);

export const fieldOptionSchema = z.object({
	value: z.union([z.string(), z.number(), z.boolean()]),
	label: z.string(),
	description: z.string().optional(),
	icon: z.string().optional(),
	disabled: z.boolean().optional(),
});

export const fieldValidationSchema = z.object({
	required: z.boolean().optional(),
	min: z.number().optional(),
	max: z.number().optional(),
	minLength: z.number().optional(),
	maxLength: z.number().optional(),
	pattern: z.string().optional(),
	message: z.string().optional(),
});

export const baseFieldSchema = z.object({
	id: z.string(),
	name: z.string(),
	label: z.string().optional(),
	type: fieldTypeSchema,
	defaultValue: z.any().optional(),
	placeholder: z.string().optional(),
	description: z.string().optional(),
	disabled: z.boolean().optional(),
	readonly: z.boolean().optional(),
	hidden: z.boolean().optional(),
	validation: fieldValidationSchema.optional(),
	className: z.string().optional(),
});

// Tipos inferidos
export type FieldOptionValidated = z.infer<typeof fieldOptionSchema>;
export type FieldValidationValidated = z.infer<typeof fieldValidationSchema>;
export type BaseFieldValidated = z.infer<typeof baseFieldSchema>;
