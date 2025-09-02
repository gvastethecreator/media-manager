import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { motion } from '@/components/ui/motion-shim';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useSeamlessNavigation } from '@/hooks/use-seamless-navigation';
import { toastService } from '@/lib/ui/toast';
import { cn } from '@/lib/utils';

// Tipos de campos soportados por el formulario
export type EntityFieldType =
	| 'text'
	| 'textarea'
	| 'select'
	| 'multiselect'
	| 'switch'
	| 'color'
	| 'emoji'
	| 'tags'
	| 'date'
	| 'number'
	| 'url';

// Definición de un campo para el formulario
export interface EntityFormField {
	/**
	 * Nombre del campo (corresponde a la propiedad en el objeto de datos)
	 */
	name: string;

	/**
	 * Etiqueta para mostrar en el formulario
	 */
	label: string;

	/**
	 * Tipo de campo
	 */
	type: EntityFieldType;

	/**
	 * Texto de ayuda para mostrar debajo del campo
	 */
	description?: string;

	/**
	 * Indica si el campo es requerido
	 */
	required?: boolean;

	/**
	 * Placeholder del campo
	 */
	placeholder?: string;

	/**
	 * Orden del campo en el formulario
	 */
	order?: number;

	/**
	 * Opciones para campos select o multiselect
	 */
	options?: Array<{
		label: string;
		value: string;
	}>;

	/**
	 * Si debe ocupar ancho completo (en diseño de columnas)
	 */
	fullWidth?: boolean;

	/**
	 * Validación personalizada (además de required)
	 */
	validation?: {
		min?: number;
		max?: number;
		minLength?: number;
		maxLength?: number;
		pattern?: RegExp;
		customMessage?: string;
	};

	/**
	 * Propiedades adicionales específicas para cada tipo de campo
	 */
	props?: Record<string, any>;
}

// Props del componente EntityForm
export interface EntityFormProps {
	/**
	 * Título del formulario
	 */
	title?: string;

	/**
	 * Descripción del formulario
	 */
	description?: string;

	/**
	 * Campos a mostrar en el formulario
	 */
	fields: EntityFormField[];

	/**
	 * Datos iniciales para el formulario
	 */
	initialData?: Record<string, any>;

	/**
	 * Función a ejecutar al enviar el formulario (después de validación)
	 */
	onSubmit: (data: Record<string, any>) => Promise<void> | void;

	/**
	 * Función a ejecutar al cancelar
	 */
	onCancel?: () => void;

	/**
	 * Texto del botón de envío
	 */
	submitLabel?: string;

	/**
	 * Texto del botón de cancelar
	 */
	cancelLabel?: string;

	/**
	 * Indicador de validación asíncrona en curso
	 */
	isLoading?: boolean;

	/**
	 * Si debe mostrar un modal de confirmación antes de enviar
	 */
	confirmBeforeSubmit?: boolean;

	/**
	 * Mensaje de confirmación
	 */
	confirmMessage?: string;

	/**
	 * Si debe mostrar un mensaje toast al completar
	 */
	showToastOnSuccess?: boolean;

	/**
	 * Mensaje para el toast de éxito
	 */
	successMessage?: string;

	/**
	 * URL a la que redirigir después de enviar con éxito
	 */
	redirectUrl?: string;

	/**
	 * Estilo del formulario
	 */
	formStyle?: 'default' | 'compact' | 'card';

	/**
	 * Clases adicionales
	 */
	className?: string;
}

/**
 * Componente reutilizable para formularios de entidades.
 * Soporta múltiples tipos de campos y validación con Zod.
 */
export function EntityForm({
	title,
	description,
	fields,
	initialData = {},
	onSubmit,
	onCancel,
	submitLabel = 'Guardar',
	cancelLabel = 'Cancelar',
	isLoading = false,
	confirmBeforeSubmit = false,
	confirmMessage = '¿Estás seguro de guardar los cambios?',
	showToastOnSuccess = true,
	successMessage = 'Cambios guardados correctamente',
	redirectUrl,
	formStyle = 'default',
	className,
}: EntityFormProps) {
	const { navigateWithTransition } = useSeamlessNavigation();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showConfirmation, setShowConfirmation] = useState(false);

	// Construir el esquema de validación dinámicamente basado en los campos
	const generateZodSchema = () => {
		const schemaMap: Record<string, any> = {};

		for (const field of fields) {
			let fieldSchema: any = z.any();

			// Configurar el tipo base del campo según su tipo
			switch (field.type) {
				case 'text':
				case 'textarea':
				case 'emoji':
				case 'url':
					fieldSchema = z.string();
					break;
				case 'number':
					fieldSchema = z.number();
					break;
				case 'switch':
					fieldSchema = z.boolean().default(false);
					break;
				case 'date':
					fieldSchema = z.date().nullable().optional();
					break;
				case 'select':
					fieldSchema = z.string();
					break;
				case 'multiselect':
					fieldSchema = z.array(z.string()).default([]);
					break;
				case 'tags':
					fieldSchema = z.string().default('');
					break;
				case 'color':
					fieldSchema = z.string().default('#3b82f6');
					break;
				default:
					fieldSchema = z.string().optional();
			}

			// Aplicar validaciones adicionales
			if (field.required) {
				if (field.type === 'text' || field.type === 'textarea' || field.type === 'select' || field.type === 'url') {
					fieldSchema = fieldSchema.min(1, `${field.label} es requerido`);
				} else if (field.type === 'multiselect') {
					fieldSchema = fieldSchema.min(1, `Seleccione al menos un ${field.label.toLowerCase()}`);
				}
			} else {
				fieldSchema = fieldSchema.optional();
			}

			// Agregar validaciones específicas
			if (field.validation) {
				if (field.validation.minLength && (field.type === 'text' || field.type === 'textarea')) {
					fieldSchema = fieldSchema.min(
						field.validation.minLength,
						field.validation.customMessage ||
							`${field.label} debe tener al menos ${field.validation.minLength} caracteres`
					);
				}

				if (field.validation.maxLength && (field.type === 'text' || field.type === 'textarea')) {
					fieldSchema = fieldSchema.max(
						field.validation.maxLength,
						field.validation.customMessage ||
							`${field.label} no puede tener más de ${field.validation.maxLength} caracteres`
					);
				}

				if (field.validation.min && field.type === 'number') {
					fieldSchema = fieldSchema.min(
						field.validation.min,
						field.validation.customMessage || `${field.label} debe ser al menos ${field.validation.min}`
					);
				}

				if (field.validation.max && field.type === 'number') {
					fieldSchema = fieldSchema.max(
						field.validation.max,
						field.validation.customMessage || `${field.label} no puede ser mayor a ${field.validation.max}`
					);
				}

				if (field.validation.pattern && (field.type === 'text' || field.type === 'url')) {
					fieldSchema = fieldSchema.regex(
						field.validation.pattern,
						field.validation.customMessage || `Formato de ${field.label.toLowerCase()} inválido`
					);
				}
			}

			schemaMap[field.name] = fieldSchema;
		}

		return z.object(schemaMap);
	};

	const formSchema = generateZodSchema();
	type FormData = z.infer<typeof formSchema>;

	// Inicializar el formulario con react-hook-form
	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: initialData as any,
	});

	// Actualizar valores por defecto cuando cambian los datos iniciales
	useEffect(() => {
		if (initialData) {
			// Resetear el formulario con los nuevos valores
			const defaultValues: Record<string, any> = {};

			for (const field of fields) {
				// Si el campo existe en initialData, usar ese valor
				if (field.name in initialData) {
					defaultValues[field.name] = initialData[field.name];
				} else {
					// Si no, usar un valor por defecto según el tipo
					switch (field.type) {
						case 'switch':
							defaultValues[field.name] = false;
							break;
						case 'multiselect':
							defaultValues[field.name] = [];
							break;
						case 'color':
							defaultValues[field.name] = '#3b82f6';
							break;
						case 'emoji':
							defaultValues[field.name] = '📝';
							break;
						case 'number':
							defaultValues[field.name] = 0;
							break;
						default:
							defaultValues[field.name] = '';
					}
				}
			}

			form.reset(defaultValues as FormData);
		}
	}, [initialData, fields, form]);

	// Manejar envío del formulario
	const handleSubmit = async (data: FormData) => {
		if (confirmBeforeSubmit && !showConfirmation) {
			setShowConfirmation(true);
			return;
		}

		setIsSubmitting(true);

		try {
			await onSubmit(data);

			if (showToastOnSuccess) {
				toastService.success(successMessage);
			}

			if (redirectUrl) {
				navigateWithTransition(redirectUrl);
			}
		} catch (error: any) {
			toastService.error(error.message || 'Error al guardar los cambios');
		} finally {
			setIsSubmitting(false);
			setShowConfirmation(false);
		}
	};

	// Cancelar el formulario
	const handleCancel = () => {
		if (onCancel) {
			onCancel();
		}
	};

	// Ordenar campos por propiedad order
	const sortedFields = [...fields].sort(
		(a, b) => (a.order || Number.MAX_SAFE_INTEGER) - (b.order || Number.MAX_SAFE_INTEGER)
	);

	// Renderizar un campo según su tipo
	const renderField = (field: EntityFormField) => {
		switch (field.type) {
			case 'text':
				return (
					<FormField
						control={form.control}
						key={field.name}
						name={field.name}
						render={({ field: formField }) => (
							<FormItem className={cn('space-y-2', field.fullWidth ? 'col-span-2' : '')}>
								<FormLabel>{field.label}</FormLabel>
								<FormControl>
									<Input
										placeholder={field.placeholder}
										{...formField}
										className={cn(form.formState.errors[field.name] && 'border-destructive')}
										value={
											typeof formField.value === 'string' || typeof formField.value === 'number'
												? String(formField.value)
												: ''
										}
										{...field.props}
									/>
								</FormControl>
								{field.description && <FormDescription>{field.description}</FormDescription>}
								<FormMessage />
							</FormItem>
						)}
					/>
				);

			case 'textarea':
				return (
					<FormField
						control={form.control}
						key={field.name}
						name={field.name}
						render={({ field: formField }) => (
							<FormItem className={cn('space-y-2', field.fullWidth ? 'col-span-2' : '')}>
								<FormLabel>{field.label}</FormLabel>
								<FormControl>
									<Textarea
										placeholder={field.placeholder}
										{...formField}
										className={cn(form.formState.errors[field.name] && 'border-destructive')}
										rows={field.props?.rows || 3}
										value={
											typeof formField.value === 'string' || typeof formField.value === 'number'
												? String(formField.value)
												: ''
										}
										{...field.props}
									/>
								</FormControl>
								{field.description && <FormDescription>{field.description}</FormDescription>}
								<FormMessage />
							</FormItem>
						)}
					/>
				);

			case 'select':
				return (
					<FormField
						control={form.control}
						key={field.name}
						name={field.name}
						render={({ field: formField }) => (
							<FormItem className={cn('space-y-2', field.fullWidth ? 'col-span-2' : '')}>
								<FormLabel>{field.label}</FormLabel>
								<Select
									defaultValue={typeof formField.value === 'string' ? formField.value : undefined}
									onValueChange={formField.onChange}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder={field.placeholder || `Seleccionar ${field.label.toLowerCase()}`} />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{field.options?.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{field.description && <FormDescription>{field.description}</FormDescription>}
								<FormMessage />
							</FormItem>
						)}
					/>
				);

			case 'switch':
				return (
					<FormField
						control={form.control}
						key={field.name}
						name={field.name}
						render={({ field: formField }) => (
							<FormItem
								className={cn(
									'flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm',
									field.fullWidth ? 'col-span-2' : '',
									form.formState.errors[field.name] && 'border-destructive'
								)}
							>
								<div className="space-y-0.5">
									<FormLabel>{field.label}</FormLabel>
									{field.description && <FormDescription>{field.description}</FormDescription>}
								</div>
								<FormControl>
									<Switch checked={Boolean(formField.value)} onCheckedChange={formField.onChange} {...field.props} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				);

			case 'color':
				return (
					<FormField
						control={form.control}
						key={field.name}
						name={field.name}
						render={({ field: formField }) => (
							<FormItem className={cn('space-y-2', field.fullWidth ? 'col-span-2' : '')}>
								<FormLabel>{field.label}</FormLabel>
								<Popover>
									<PopoverTrigger asChild>
										<FormControl>
											<div className="flex items-center gap-2">
												<div
													className="h-5 w-5 cursor-pointer rounded-md border"
													style={{
														backgroundColor:
															typeof formField.value === 'string' ? (formField.value as string) : undefined,
													}}
												/>
												<Input
													className="w-20 font-mono"
													onChange={formField.onChange}
													placeholder="#RRGGBB"
													value={typeof formField.value === 'string' ? formField.value : ''}
												/>
											</div>
										</FormControl>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-3">
										<HexColorPicker
											color={typeof formField.value === 'string' ? formField.value : '#000000'}
											onChange={formField.onChange}
										/>
									</PopoverContent>
								</Popover>
								{field.description && <FormDescription>{field.description}</FormDescription>}
								<FormMessage />
							</FormItem>
						)}
					/>
				);

			case 'emoji':
				return (
					<FormField
						control={form.control}
						key={field.name}
						name={field.name}
						render={({ field: formField }) => (
							<FormItem className={cn('space-y-2', field.fullWidth ? 'col-span-2' : '')}>
								<FormLabel>{field.label}</FormLabel>
								<FormControl>
									<EmojiPicker
										onChange={formField.onChange}
										value={typeof formField.value === 'string' ? formField.value : undefined}
									/>
								</FormControl>
								{field.description && <FormDescription>{field.description}</FormDescription>}
								<FormMessage />
							</FormItem>
						)}
					/>
				);

			// Para los otros tipos de campos se pueden implementar según se necesiten
			default:
				return null;
		}
	};

	// Estilos según el tipo de formulario
	const formContainerStyles = cn(
		className,
		'space-y-6',
		formStyle === 'compact' && 'mx-auto max-w-md',
		formStyle === 'card' && 'rounded-lg border bg-card p-6 shadow'
	);

	return (
		<Form {...form}>
			<div className={formContainerStyles}>
				{/* Encabezado del formulario */}
				{(title || description) && (
					<div className="mb-6 space-y-1.5">
						{title && <h2 className="font-bold text-2xl">{title}</h2>}
						{description && <p className="text-muted-foreground">{description}</p>}
					</div>
				)}

				<form className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
					{/* Grid de campos */}
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2">{sortedFields.map(renderField)}</div>

					{/* Botones de acción */}
					<div className="flex justify-end gap-3 pt-2">
						{onCancel && (
							<Button disabled={isSubmitting || isLoading} onClick={handleCancel} type="button" variant="outline">
								{cancelLabel}
							</Button>
						)}

						<Button className="min-w-24" disabled={isSubmitting || isLoading} type="submit">
							{isSubmitting || isLoading ? (
								<motion.div
									animate={{ rotate: 360 }}
									className="h-4 w-4 rounded-full border-2 border-current border-t-transparent"
									transition={{ duration: 1, ease: 'linear' }}
								/>
							) : (
								submitLabel
							)}
						</Button>
					</div>
				</form>

				{/* Confirmación antes de enviar (esto podría expandirse a un componente de diálogo) */}
				{showConfirmation && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
						<div className="w-full max-w-md rounded-lg bg-card p-6 shadow-lg">
							<h3 className="mb-4 font-medium text-lg">Confirmar acción</h3>
							<p className="mb-6">{confirmMessage}</p>
							<div className="flex justify-end gap-3">
								<Button onClick={() => setShowConfirmation(false)} variant="outline">
									Cancelar
								</Button>
								<Button onClick={() => form.handleSubmit(handleSubmit)()}>Confirmar</Button>
							</div>
						</div>
					</div>
				)}
			</div>
		</Form>
	);
}
