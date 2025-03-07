'use client';

import type * as React from 'react';
import { useState } from 'react';
import { CompactPicker } from 'react-color';
import { Button } from '../ui/button';
import { EmojiPicker } from '../ui/emoji-picker';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { Textarea } from '../ui/textarea';

const NOTE_CATEGORIES = [
	{ value: 'personal', label: 'Personal' },
	{ value: 'work', label: 'Trabajo' },
	{ value: 'study', label: 'Estudio' },
	{ value: 'project', label: 'Proyecto' },
	{ value: 'other', label: 'Otro' },
];

const NOTE_STATUS = [
	{ value: 'draft', label: 'Borrador' },
	{ value: 'active', label: 'Activo' },
	{ value: 'archived', label: 'Archivado' },
];

const NOTE_PRIORITY = [
	{ value: 0, label: 'Baja' },
	{ value: 1, label: 'Media' },
	{ value: 2, label: 'Alta' },
] as const;

interface NoteFormData {
	name: string;
	emoji: string;
	color: string;
	description: string;
	title: string;
	content: string;
	category: string;
	priority: number;
	status: string;
	tags: string[];
	featuredImage?: string | null;
	isFavorite: boolean;
}

interface NoteFormProps {
	initialData?: Partial<NoteFormData>;
	onSubmit: (data: NoteFormData) => void;
	onCancel?: () => void;
	isLoading?: boolean;
}

export function NoteForm({ initialData, onSubmit, onCancel, isLoading }: NoteFormProps) {
	const [formData, setFormData] = useState<NoteFormData>({
		name: initialData?.name || '',
		emoji: initialData?.emoji || '📝',
		color: initialData?.color || '#3b82f6',
		description: initialData?.description || '',
		title: initialData?.title || '',
		content: initialData?.content || '',
		category: initialData?.category || 'personal',
		priority: initialData?.priority || 0,
		status: initialData?.status || 'draft',
		tags: initialData?.tags || [],
		featuredImage: initialData?.featuredImage || null,
		isFavorite: initialData?.isFavorite || false,
	});

	const [tagsError, setTagsError] = useState<string>('');

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.name.trim() || !formData.title.trim()) {
			alert('El nombre y título son requeridos');
			return;
		}
		onSubmit(formData);
	};

	const handleChange = <T extends keyof NoteFormData>(field: T, value: NoteFormData[T]) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleTagsChange = (value: string) => {
		try {
			const parsedTags = JSON.parse(value);
			if (Array.isArray(parsedTags)) {
				handleChange('tags', parsedTags);
				setTagsError('');
			} else {
				setTagsError('Los tags deben ser un array de strings');
			}
		} catch (_error) {
			setTagsError('JSON inválido');
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="flex items-center space-x-4">
				<Popover>
					<PopoverTrigger asChild>
						<Button type="button" variant="outline" className="w-12 h-12 text-2xl">
							{formData.emoji}
						</Button>
					</PopoverTrigger>
					<PopoverContent className="p-0">
						<EmojiPicker
							onEmojiSelect={(emoji: string) => {
								handleChange('emoji', emoji);
							}}
						/>
					</PopoverContent>
				</Popover>

				<Popover>
					<PopoverTrigger asChild>
						<Button type="button" variant="outline" className="w-12 h-12" style={{ backgroundColor: formData.color }} />
					</PopoverTrigger>
					<PopoverContent className="p-0">
						<CompactPicker
							color={formData.color}
							onChange={(color) => {
								handleChange('color', color.hex);
							}}
						/>
					</PopoverContent>
				</Popover>

				<Input
					placeholder="Nombre de la nota"
					value={formData.name}
					onChange={(e) => handleChange('name', e.target.value)}
					required
				/>
			</div>

			<div className="space-y-2">
				<Label>Título</Label>
				<Input
					value={formData.title}
					onChange={(e) => handleChange('title', e.target.value)}
					className="h-8"
					placeholder="Título de la nota..."
				/>
			</div>

			<div className="space-y-2">
				<Label>Descripción</Label>
				<Textarea
					value={formData.description}
					onChange={(e) => handleChange('description', e.target.value)}
					className="h-6 text-xs mt-1"
					placeholder="Descripción (opcional)"
				/>
			</div>

			<div className="space-y-2">
				<Label>Contenido</Label>
				<Textarea
					value={formData.content}
					onChange={(e) => handleChange('content', e.target.value)}
					className="min-h-[200px]"
					placeholder="Contenido de la nota..."
				/>
			</div>

			<div className="grid grid-cols-3 gap-4">
				<div className="space-y-2">
					<Label>Categoría</Label>
					<Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
						<SelectTrigger>
							<SelectValue placeholder="Selecciona categoría" />
						</SelectTrigger>
						<SelectContent>
							{NOTE_CATEGORIES.map((category) => (
								<SelectItem key={category.value} value={category.value}>
									{category.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-2">
					<Label>Estado</Label>
					<Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
						<SelectTrigger>
							<SelectValue placeholder="Selecciona estado" />
						</SelectTrigger>
						<SelectContent>
							{NOTE_STATUS.map((status) => (
								<SelectItem key={status.value} value={status.value}>
									{status.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-2">
					<Label>Prioridad</Label>
					<Select
						value={formData.priority.toString()}
						onValueChange={(value) => handleChange('priority', Number.parseInt(value, 10))}
					>
						<SelectTrigger>
							<SelectValue placeholder="Selecciona prioridad" />
						</SelectTrigger>
						<SelectContent>
							{NOTE_PRIORITY.map((priority) => (
								<SelectItem key={priority.value} value={priority.value.toString()}>
									{priority.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="space-y-2">
				<Label>Etiquetas (JSON)</Label>
				<Textarea
					value={JSON.stringify(formData.tags, null, 2)}
					onChange={(e) => handleTagsChange(e.target.value)}
					className="font-mono text-sm min-h-[80px]"
					placeholder='["tag1", "tag2", ...]'
				/>
				{tagsError && <p className="text-red-500 text-sm mt-1">{tagsError}</p>}
			</div>

			<div className="flex justify-end gap-2">
				{onCancel && (
					<Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
						Cancelar
					</Button>
				)}
				<Button type="submit" disabled={isLoading || !formData.name.trim() || !formData.title.trim()}>
					{isLoading ? 'Guardando...' : initialData ? 'Actualizar' : 'Crear'}
				</Button>
			</div>
		</form>
	);
}
