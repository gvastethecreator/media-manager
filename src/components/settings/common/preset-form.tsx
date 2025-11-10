/**
 * @file Formulario dinámico con soporte para presets
 * @module components/settings/common/preset-form
 * @description Formulario que adapta los campos mostrados según el preset seleccionado
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ColorPicker } from '@/components/ui/color-picker';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { FeaturedImageSelector } from '@/components/ui/featured-image-selector';
import { PresetSelector } from './preset-selector';
import {
	type FieldConfig,
	type FieldPreset,
	getEntityPresets,
	getDefaultPreset,
	getPresetFields,
} from '@/config/entity-field-presets';

interface PresetFormProps<T extends Record<string, any> = Record<string, any>> {
	/** Tipo de entidad (character, place, concept, etc.) */
	entityType: string;
	/** Función de submit (recibe los datos del formulario) */
	onSubmit: (data: T & { name: string }) => Promise<void>;
	/** Texto del botón principal */
	submitLabel?: string;
	/** Callback al cancelar */
	onCancel?: () => void;
	/** Datos iniciales (para edición) */
	initialData?: Partial<T>;
	/** Si está en modo edición */
	isEditing?: boolean;
	/** IDs de imágenes asociadas (para FeaturedImageSelector) */
	imageIds?: string[];
	/** Imágenes disponibles (para FeaturedImageSelector) */
	images?: Array<{
		id: string;
		name: string;
		thumbnailUrl?: string | null;
		path?: string;
	}>;
}

/**
 * Renderiza un campo según su configuración
 */
function renderField(
	field: FieldConfig,
	value: any,
	onChange: (value: any) => void,
	imageIds?: string[],
	images?: Array<{ id: string; name: string; thumbnailUrl?: string | null; path?: string }>
) {
	const fieldId = `field-${field.name}`;

	switch (field.type) {
		case 'text':
			return (
				<Input
					id={fieldId}
					type="text"
					value={value || ''}
					onChange={(e) => onChange(e.target.value)}
					placeholder={field.placeholder}
					required={field.required}
					maxLength={field.max}
				/>
			);

		case 'textarea':
			return (
				<Textarea
					id={fieldId}
					value={value || ''}
					onChange={(e) => onChange(e.target.value)}
					placeholder={field.placeholder}
					maxLength={field.max}
					rows={4}
				/>
			);

		case 'number':
			return (
				<Input
					id={fieldId}
					type="number"
					value={value || ''}
					onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
					placeholder={field.placeholder}
					min={field.min}
					max={field.max}
				/>
			);

		case 'select':
			return (
				<Select value={value || ''} onValueChange={onChange}>
					<SelectTrigger id={fieldId}>
						<SelectValue placeholder={field.placeholder || 'Seleccionar...'} />
					</SelectTrigger>
					<SelectContent>
						{field.options?.map((opt) => (
							<SelectItem key={opt.value} value={opt.value}>
								{opt.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			);

		case 'color':
			return <ColorPicker value={value || field.defaultValue || '#3b82f6'} onChange={onChange} compact showLabel={false} />;

		case 'emoji':
			return <EmojiPicker value={value || field.defaultValue || '😀'} onEmojiSelect={onChange} compact showLabel={false} />;

		case 'checkbox':
			return (
				<div className="flex items-center space-x-2">
					<Checkbox id={fieldId} checked={value || false} onCheckedChange={onChange} />
					<Label htmlFor={fieldId} className="text-sm font-normal cursor-pointer">
						{field.label}
					</Label>
				</div>
			);

		case 'date':
			return (
				<Input
					id={fieldId}
					type="date"
					value={value || ''}
					onChange={(e) => onChange(e.target.value)}
					required={field.required}
				/>
			);

		case 'featuredImage':
			return (
				<FeaturedImageSelector
					currentFeaturedImage={value}
					imageIds={imageIds}
					images={images}
					onSelect={onChange}
				/>
			);

		default:
			return null;
	}
}

/**
 * Formulario dinámico con presets configurables
 */
export function PresetForm<T extends Record<string, any> = Record<string, any>>({
	entityType,
	onSubmit,
	submitLabel = 'Crear',
	onCancel,
	initialData,
	isEditing = false,
	imageIds = [],
	images = [],
}: PresetFormProps<T>) {
	const config = getEntityPresets(entityType);
	const defaultPreset = getDefaultPreset(entityType);

	// Estado del preset seleccionado
	const [selectedPresetId, setSelectedPresetId] = useState<string>(defaultPreset?.id || 'minimal');
	const [formData, setFormData] = useState<Record<string, any>>(initialData || {});
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Cargar campos cuando cambia el preset
	const presetFields = config ? getPresetFields(entityType, selectedPresetId) : [];

	// Inicializar valores por defecto cuando cambia el preset
	useEffect(() => {
		if (!initialData) {
			const defaults: Record<string, any> = {};
			for (const field of presetFields) {
				if (field.defaultValue !== undefined && formData[field.name] === undefined) {
					defaults[field.name] = field.defaultValue;
				}
			}
			if (Object.keys(defaults).length > 0) {
				setFormData((prev) => ({ ...prev, ...defaults }));
			}
		}
	}, [selectedPresetId, presetFields, initialData]);

	// Manejar cambio de campo
	const handleFieldChange = (name: string, value: unknown) => {
		setFormData((prev) => ({ ...prev, [name]: value }));
		if (error) {
			setError(null);
		}
	};

	// Manejar submit
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Validar campo name
		if (!formData.name || formData.name.trim() === '') {
			setError('El nombre es obligatorio');
			return;
		}

		// Validar campos requeridos
		for (const field of presetFields) {
			if (field.required && !formData[field.name]) {
				setError(`El campo "${field.label}" es obligatorio`);
				return;
			}
		}

		setIsSubmitting(true);
		try {
			await onSubmit(formData as T & { name: string });
			// Resetear formulario después de crear
			if (!isEditing) {
				setFormData({});
				setSelectedPresetId(defaultPreset?.id || 'minimal');
			}
			setError(null);
		} catch (err: any) {
			setError(err.message || 'Error al guardar la entidad');
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!config) {
		return (
			<div className="text-red-500 p-4">
				Error: No hay configuración de presets disponible para el tipo &quot;{entityType}&quot;
			</div>
		);
	}

	return (
		<form className="space-y-6" onSubmit={handleSubmit}>
			{/* Selector de preset (solo en modo creación) */}
			{!isEditing && (
				<PresetSelector
					presets={config.presets}
					selectedPresetId={selectedPresetId}
					onSelectPreset={setSelectedPresetId}
				/>
			)}

			{/* Campos del formulario */}
			<div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
				{presetFields.map((field) => {
					// Campo especial para checkbox (sin label separado)
					if (field.type === 'checkbox') {
						return (
							<div key={field.name}>
								{renderField(field, formData[field.name], (v) => handleFieldChange(field.name, v), imageIds, images)}
							</div>
						);
					}

					// Campos normales con label (featuredImage no necesita label extra)
					if (field.type === 'featuredImage') {
						return (
							<div key={field.name}>
								{renderField(field, formData[field.name], (v) => handleFieldChange(field.name, v), imageIds, images)}
							</div>
						);
					}

					// Campos normales con label
					return (
						<div key={field.name} className="space-y-2">
							<Label htmlFor={`field-${field.name}`}>
								{field.label}
								{field.required && <span className="text-red-500 ml-1">*</span>}
							</Label>
							{field.description && (
								<p className="text-xs text-gray-500 dark:text-gray-400">{field.description}</p>
							)}
							{renderField(field, formData[field.name], (v) => handleFieldChange(field.name, v), imageIds, images)}
						</div>
					);
				})}
			</div>

			{/* Error */}
			{error && (
				<div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
					<p className="text-sm text-red-600 dark:text-red-400">{error}</p>
				</div>
			)}

			{/* Botones de acción */}
			<div className="flex justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
				{onCancel && (
					<Button onClick={onCancel} type="button" variant="outline" disabled={isSubmitting}>
						Cancelar
					</Button>
				)}
				<Button type="submit" disabled={isSubmitting || !formData.name}>
					{isSubmitting ? 'Guardando...' : submitLabel}
				</Button>
			</div>
		</form>
	);
}
