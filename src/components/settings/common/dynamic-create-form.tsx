// src/components/settings/common/dynamic-create-form.tsx
// 🧩 Formulario dinámico reutilizable para creación de entidades en settings
// Muestra solo el campo nombre inicialmente y permite agregar campos opcionales uno a uno
// ⚠️ No usar para carpetas (folders)

import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React, { useState } from 'react';

// Tipos genéricos para flexibilidad
export interface DynamicCreateFormProps {
	/**
	 * Lista de campos opcionales disponibles para la entidad (ej: emoji, color, categoría...)
	 * Cada campo debe tener: name, label, render (función que retorna el campo JSX)
	 */
	optionalFields: Array<{
		name: string;
		label: string;
		render: (props: { value: any; onChange: (v: any) => void }) => React.ReactNode;
	}>;
	/**
	 * Función de submit (recibe los datos del formulario)
	 */
	onSubmit: (data: any) => Promise<void>;
	/**
	 * Texto del botón principal
	 */
	submitLabel?: string;
	/**
	 * Validación de nombre (opcional)
	 */
	validateName?: (name: string) => string | null;
}

export function DynamicCreateForm({
	optionalFields,
	onSubmit,
	submitLabel = 'Crear',
	validateName,
}: DynamicCreateFormProps) {
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
	const handleFieldChange = (name: string, value: any) => {
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
			<FormField
				name="name"
				render={() => (
					<FormItem>
						<FormLabel>Nombre</FormLabel>
						<FormControl>
							<Input
								value={formData.name || ''}
								onChange={handleNameChange}
								placeholder="Nombre de la entidad"
								required
								className={error ? 'border-red-500' : ''}
								disabled={isSubmitting}
							/>
						</FormControl>
						{error && <FormMessage>{error}</FormMessage>}
					</FormItem>
				)}
			/>

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
					<FormField
						key={fieldName}
						name={fieldName}
						render={() => (
							<FormItem>
								<FormLabel>{field.label}</FormLabel>
								<FormControl>
									{field.render({
										value: formData[fieldName],
										onChange: (v) => handleFieldChange(fieldName, v),
									})}
								</FormControl>
							</FormItem>
						)}
					/>
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
