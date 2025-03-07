export interface BaseFormData {
	id?: string;
	name: string;
	description?: string;
	emoji?: string;
	shortcut?: string;
	color?: string;
	featuredImage?: string;
	isFavorite?: boolean;
}

export type FormFieldType = 'text' | 'textarea' | 'select' | 'tags' | 'color' | 'image' | 'emoji' | 'shortcut';

export interface FormFieldOption {
	value: string;
	label: string;
}

export interface FormField {
	name: string;
	label: string;
	type: FormFieldType;
	required?: boolean;
	placeholder?: string;
	options?: FormFieldOption[];
	defaultValue?: string | number | boolean | string[] | null | undefined;
}

export interface EntityFormProps<T extends BaseFormData> {
	title: string;
	submitLabel: string;
	initialData?: T;
	onSubmit: (data: T) => Promise<void>;
	onCancel?: () => void;
	isLoading?: boolean;
	fields?: FormField[];
}

export interface TagFormData extends BaseFormData {
	emoji: string;
	color: string;
	shortcut?: string;
}
