// src/components/settings/common/dynamic-create-form.tsx
// 🧩 Formulario dinámico reutilizable para creación de entidades en settings
// Muestra solo el campo nombre inicialmente y permite agregar campos opcionales uno a uno
// ⚠️ No usar para carpetas (folders)

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Tipos genéricos para flexibilidad
export interface FormField<T = unknown> {
	label: string;
	name: string;
	render: (props: { value: T; onChange: (v: T) => void }) => React.ReactNode;
}

export interface DynamicCreateFormProps<T extends Record<string, any> = Record<string, any>> {
	/**
	 * Función de submit (recibe los datos del formulario)
	 */
	onSubmit: (data: T & { name: string }) => Promise<void>;
	/**
	 * Lista de campos opcionales disponibles para la entidad (ej: emoji, color, categoría...)
	 * Cada campo debe tener: name, label, render (función que retorna el campo JSX)
	 */
	optionalFields: FormField[];
	/**
	 * Texto del botón principal
	 */
	submitLabel?: string;
	/**
	 * Validación de nombre (opcional)
	 */
	validateName?: (name: string) => string | null;
}

export function DynamicCreateForm<T extends Record<string, any> = Record<string, any>>({
	optionalFields,
	onSubmit,
	submitLabel = 'Crear',
	validateName,
}: DynamicCreateFormProps<T>) {
	const [formData, setFormData] = useState<Record<string, any>>({ name: '' });
	const [addedFields, setAddedFields] = useState<string[]>([]);
	const [selectedField, setSelectedField] = useState<string>('');
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Manejar cambio de nombre
	const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData((prev) => ({ ...prev, name: e.target.value }));
		if (error) {
			setError(null);
		}
	};

	// Manejar agregar campo opcional
	const handleAddField = () => {
		if (selectedField && !addedFields.includes(selectedField)) {
			setAddedFields((prev) => [...prev, selectedField]);
			setSelectedField('');
		}
	};

	// Manejar cambio de campo opcional
	const handleFieldChange = (name: string, value: unknown) => {
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	// Manejar submit
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const validationError = validateName ? validateName(formData.name) : null;
		if (!formData.name || validationError) {
			setError(validationError || 'El nombre es obligatorio');
			return;
		}
		setIsSubmitting(true);
		try {
			await onSubmit(formData as T & { name: string });
			setFormData({ name: '' });
			setAddedFields([]);
			setError(null);
		} catch (err: any) {
			setError(err.message || 'Error al crear la entidad');
		} finally {
			setIsSubmitting(false);
		}
	};

	// Campos opcionales aún no agregados
	const availableFields = optionalFields.filter((f) => !addedFields.includes(f.name));

	return (
		<form className="space-y-4" onSubmit={handleSubmit}>
			<div className="space-y-2">
				<Label htmlFor="name">Nombre</Label>
				<Input
					className={error ? 'border-destructive' : ''}
					disabled={isSubmitting}
					id="name"
					onChange={handleNameChange}
					placeholder="Nombre de la entidad"
					required
					value={formData.name || ''}
				/>
				{error && <p className="text-destructive text-sm">{error}</p>}
			</div>

			{/* Selector para agregar campos opcionales */}
			{availableFields.length > 0 && (
				<div className="flex items-end gap-2">
					<Select onValueChange={setSelectedField} value={selectedField}>
						<SelectTrigger className="w-48">
							<SelectValue placeholder="Agregar campo opcional" />
						</SelectTrigger>
						<SelectContent>
							{availableFields.map((f) => (
								<SelectItem key={f.name} value={f.name}>
									{f.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Button disabled={!selectedField} onClick={handleAddField} type="button">
						Agregar campo
					</Button>
				</div>
			)}

			{/* Renderizar campos opcionales agregados */}
			{addedFields.map((fieldName) => {
				const field = optionalFields.find((f) => f.name === fieldName);
				if (!field) {
					return null;
				}
				return (
					<div className="space-y-2" key={fieldName}>
						<Label>{field.label}</Label>
						{field.render({
							value: formData[fieldName],
							onChange: (v) => handleFieldChange(fieldName, v),
						})}
					</div>
				);
			})}

			<Button disabled={isSubmitting || !formData.name} type="submit">
				{isSubmitting ? 'Guardando...' : submitLabel}
			</Button>
		</form>
	);
}

/**
 * 📝 Ejemplo de uso:
 *
 * <DynamicCreateForm
 *   optionalFields=[
 *     { name: 'emoji', label: 'Emoji', render: ({value, onChange}) => <EmojiPicker value={value} onChange={onChange} /> },
 *     { name: 'color', label: 'Color', render: ({value, onChange}) => <ColorPicker value={value} onChange={onChange} /> },
 *     ...
 *   ]
 *   onSubmit={async (data) => { ... }}
 * />
 */
