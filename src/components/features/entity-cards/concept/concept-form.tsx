'use client';

import { Button } from '@/components/ui/button';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import * as React from 'react';
import { CompactPicker } from 'react-color';
import type { ConceptFormData } from '../entity-types';

interface ConceptFormProps {
	initialData?: ConceptFormData;
	onSubmit: (data: ConceptFormData) => Promise<void>;
	onCancel?: () => void;
	isLoading?: boolean;
}

export function ConceptForm({ initialData, onSubmit, onCancel, isLoading }: ConceptFormProps) {
	const [formData, setFormData] = React.useState<ConceptFormData>(
		initialData || {
			name: '',
			emoji: '💡',
			color: '#3b82f6',
			description: '',
			content: '',
			category: 'general',
			tags: [],
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

	const handleChange = <T extends keyof ConceptFormData>(field: T, value: ConceptFormData[T]) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleTagsChange = (value: string) => {
		try {
			const tags = JSON.parse(value);
			if (Array.isArray(tags)) {
				handleChange('tags', tags);
			}
		} catch {
			// Si no es JSON válido o no es un array, mantener el valor anterior
		}
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

			<div className="space-y-2">
				<Label>Contenido</Label>
				<Textarea
					value={formData.content}
					onChange={(e) => handleChange('content', e.target.value)}
					className="min-h-[100px]"
					placeholder="Contenido del concepto..."
				/>
			</div>

			<div className="space-y-2">
				<Label>Categoría</Label>
				<Input
					value={formData.category}
					onChange={(e) => handleChange('category', e.target.value)}
					className="h-8"
					placeholder="Categoría del concepto..."
				/>
			</div>

			<div className="space-y-2">
				<Label>Etiquetas (JSON)</Label>
				<Textarea
					value={JSON.stringify(formData.tags, null, 2)}
					onChange={(e) => handleTagsChange(e.target.value)}
					className="font-mono text-sm min-h-[80px]"
					placeholder='["tag1", "tag2", ...]'
				/>
				<p className="text-xs text-muted-foreground">Formato: array de strings en JSON</p>
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
