'use client';

import { Button } from '@/components/ui/button';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import * as React from 'react';
import { CompactPicker } from 'react-color';
import type { AttributeFormData } from './entity-types';

const ATTRIBUTE_TYPES = [
	{ value: 'text', label: 'Texto' },
	{ value: 'number', label: 'Número' },
	{ value: 'boolean', label: 'Booleano' },
	{ value: 'date', label: 'Fecha' },
	{ value: 'color', label: 'Color' },
	{ value: 'range', label: 'Rango' },
	{ value: 'select', label: 'Selección' },
	{ value: 'multiselect', label: 'Selección Múltiple' },
];

const ATTRIBUTE_CATEGORIES = [
	{ value: 'general', label: 'General' },
	{ value: 'character', label: 'Personaje' },
	{ value: 'place', label: 'Lugar' },
	{ value: 'object', label: 'Objeto' },
	{ value: 'concept', label: 'Concepto' },
	{ value: 'prompt', label: 'Prompt' },
	{ value: 'note', label: 'Nota' },
	{ value: 'system', label: 'Sistema' },
];

interface AttributeFormProps {
	initialData?: AttributeFormData;
	onSubmit: (data: AttributeFormData) => Promise<void>;
	onCancel?: () => void;
	isLoading?: boolean;
}

export function AttributeForm({ initialData, onSubmit, onCancel, isLoading }: AttributeFormProps) {
	const [formData, setFormData] = React.useState<AttributeFormData>(
		initialData || {
			name: '',
			emoji: '⚡',
			color: '#3b82f6',
			description: '',
			type: 'text',
			value: '',
			category: 'general',
			metadata: '{}',
			featuredImage: null,
			isFavorite: false,
		}
	);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.name.trim()) {
			return;
		}
		await onSubmit(formData);
	};

	const handleChange = <T extends keyof AttributeFormData>(field: T, value: AttributeFormData[T]) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="flex items-center gap-2">
				<div
					className="h-8 w-8 rounded-full flex items-center justify-center shadow-xs"
					style={{ backgroundColor: formData.color }}
				>
					<Popover>
						<PopoverTrigger asChild>
							<Button variant="ghost" size="icon" className="h-8 w-8 p-0">
								<span className="text-lg">{formData.emoji}</span>
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-full p-0" align="start">
							<EmojiPicker onEmojiSelect={(emoji: string) => handleChange('emoji', emoji)} />
							<Separator className="my-2" />
							<div className="p-2">
								<CompactPicker color={formData.color} onChange={(color) => handleChange('color', color.hex)} />
							</div>
						</PopoverContent>
					</Popover>
				</div>

				<div className="flex-1 min-w-0">
					<Input
						value={formData.name}
						onChange={(e) => handleChange('name', e.target.value)}
						className="h-8 text-base"
						placeholder="Nombre"
					/>
					<Input
						value={formData.description || ''}
						onChange={(e) => handleChange('description', e.target.value)}
						className="h-6 text-xs mt-1"
						placeholder="Descripción (opcional)"
					/>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label>Tipo</Label>
					<Select value={formData.type} onValueChange={(value) => handleChange('type', value)}>
						<SelectTrigger className="h-8">
							<SelectValue placeholder="Selecciona un tipo" />
						</SelectTrigger>
						<SelectContent>
							{ATTRIBUTE_TYPES.map((type) => (
								<SelectItem key={type.value} value={type.value}>
									{type.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-2">
					<Label>Categoría</Label>
					<Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
						<SelectTrigger className="h-8">
							<SelectValue placeholder="Selecciona una categoría" />
						</SelectTrigger>
						<SelectContent>
							{ATTRIBUTE_CATEGORIES.map((category) => (
								<SelectItem key={category.value} value={category.value}>
									{category.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="space-y-2">
				<Label>Valor</Label>
				<Input
					value={formData.value}
					onChange={(e) => handleChange('value', e.target.value)}
					className="h-8"
					placeholder="Valor del atributo"
				/>
			</div>

			<div className="space-y-2">
				<Label>Metadata (JSON)</Label>
				<Textarea
					value={formData.metadata}
					onChange={(e) => {
						try {
							JSON.parse(e.target.value);
							handleChange('metadata', e.target.value);
						} catch {
							// Si no es JSON válido, mantener el valor anterior
						}
					}}
					className="font-mono text-sm min-h-[100px]"
					placeholder="{}"
				/>
			</div>

			<div className="flex items-center justify-between rounded-lg border p-3 shadow-xs">
				<div className="space-y-0.5">
					<Label>Favorito</Label>
					<p className="text-sm text-muted-foreground">Marcar como favorito</p>
				</div>
				<Switch checked={formData.isFavorite} onCheckedChange={(checked) => handleChange('isFavorite', checked)} />
			</div>

			<div className="flex justify-end gap-2">
				{onCancel && (
					<Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
						Cancelar
					</Button>
				)}
				<Button type="submit" disabled={isLoading || !formData.name.trim()}>
					{isLoading ? 'Guardando...' : initialData ? 'Actualizar' : 'Crear'}
				</Button>
			</div>
		</form>
	);
}
