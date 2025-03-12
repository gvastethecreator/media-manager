'use client';

import { Button } from '@/components/ui/button';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils/utils';
import type { TagFormData } from '@/types/tag-form-data';
import { Palette } from 'lucide-react';
import * as React from 'react';
import { CompactPicker } from 'react-color';

interface TagFormProps {
	initialData?: TagFormData;
	onSubmit: (data: TagFormData) => Promise<void>;
	onCancel?: () => void;
	isLoading?: boolean;
}

export function TagForm({ initialData, onSubmit, onCancel, isLoading }: TagFormProps) {
	const [formData, setFormData] = React.useState<TagFormData>(
		initialData || {
			name: '',
			emoji: '🏷️',
			color: '#3b82f6',
			description: '',
			shortcut: '',
			category: null,
			featuredImage: null,
			isFavorite: false,
		}
	);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.name?.trim()) {
			return;
		}
		await onSubmit(formData);
	};

	const handleChange = (field: keyof TagFormData, value: string | boolean) => {
		setFormData((prev: TagFormData) => ({
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
				<div className="flex-1 min-w-0 space-y-1">
					<Input
						value={formData.name}
						onChange={(e) => handleChange('name', e.target.value)}
						className="h-8 text-base"
						placeholder="Nombre"
					/>
					<div className="flex gap-2">
						<Input
							value={formData.description || ''}
							onChange={(e) => handleChange('description', e.target.value)}
							className="h-6 text-xs"
							placeholder="Descripción (opcional)"
						/>
						<Input
							value={formData.shortcut || ''}
							onChange={(e) => handleChange('shortcut', e.target.value)}
							className="h-6 text-xs w-24"
							placeholder="Atajo"
						/>
					</div>
				</div>
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
