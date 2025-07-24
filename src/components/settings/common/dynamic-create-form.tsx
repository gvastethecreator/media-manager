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
	name: string;
	label: string;
	render: (props: { value: T; onChange: (v: T) => void }) => React.ReactNode;
}

export interface DynamicCreateFormProps<T extends Record<string, unknown> = Record<string, unknown>> {
	/**
	 * Lista de campos opcionales disponibles para la entidad (ej: emoji, color, categoría...)
	 * Cada campo debe tener: name, label, render (función que retorna el campo JSX)
	 */
	optionalFields: FormField[];
	/**
	 * Función de submit (recibe los datos del formulario)
	 */
	onSubmit: (data: T & { name: string }) => Promise<void>;
	/**
	 * Texto del botón principal
	 */
	submitLabel?: string;
	/**
	 * Validación de nombre (opcional)
	 */
	validateName?: (name: string) => string | null;
}

export function DynamicCreateForm<T extends Record<string, unknown> = Record<string, unknown>>({
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
		if (error) setError(null);
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
			await onSubmit(formData);
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
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="name">Nombre</Label>
				<Input
					id="name"
					value={formData.name || ''}
					onChange={handleNameChange}
					placeholder="Nombre de la entidad"
					required
					className={error ? 'border-red-500' : ''}
					disabled={isSubmitting}
				/>
				{error && <p className="text-sm text-red-500">{error}</p>}
			</div>

			{/* Selector para agregar campos opcionales */}
			{availableFields.length > 0 && (
				<div className="flex gap-2 items-end">
					<Select value={selectedField} onValueChange={setSelectedField}>
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
					<Button type="button" onClick={handleAddField} disabled={!selectedField}>
						Agregar campo
					</Button>
				</div>
			)}

			{/* Renderizar campos opcionales agregados */}
			{addedFields.map((fieldName) => {
				const field = optionalFields.find((f) => f.name === fieldName);
				if (!field) return null;
				return (
					<div key={fieldName} className="space-y-2">
						<Label>{field.label}</Label>
						{field.render({
							value: formData[fieldName],
							onChange: (v) => handleFieldChange(fieldName, v),
						})}
					</div>
				);
			})}

			<Button type="submit" disabled={isSubmitting || !formData.name}>
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
