'use client';

import { Button } from '@/components/ui/button';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { CompactPicker } from 'react-color';

// Tipos base para las entidades
export interface BaseEntityFormData {
	id?: string;
	name: string;
	emoji: string;
	color: string;
	description?: string;
	featuredImage?: string | null;
	isFavorite: boolean;
}

// Props específicas para el formulario
export interface EntityFormProps<T extends BaseEntityFormData> {
	initialData?: T;
	onSubmit: (data: T) => Promise<void>;
	onCancel?: () => void;
	isLoading?: boolean;
	title?: string;
	submitLabel?: string;
	className?: string;
	extraFields?: React.ReactNode;
}

// Componente genérico del formulario
export function EntityForm<T extends BaseEntityFormData>({
	initialData,
	onSubmit,
	onCancel,
	isLoading = false,
	submitLabel = 'Guardar',
	className,
	extraFields,
}: EntityFormProps<T>) {
	const [formData, setFormData] = React.useState<T>(
		initialData ||
			({
				name: '',
				emoji: '🌟',
				color: '#3b82f6',
				description: '',
				featuredImage: null,
				isFavorite: false,
			} as T)
	);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.name.trim()) {
			return;
		}
		try {
			await onSubmit(formData);
		} catch (error) {
			console.error('Error al enviar el formulario:', error);
		}
	};

	const handleColorChange = (color: { hex: string }) => {
		setFormData((prev) => ({ ...prev, color: color.hex }));
	};

	return (
		<form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
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
							<EmojiPicker onEmojiSelect={(emoji: string) => setFormData((prev) => ({ ...prev, emoji }))} />
							<Separator className="my-2" />
							<div className="p-2">
								<CompactPicker color={formData.color} onChange={handleColorChange} />
							</div>
						</PopoverContent>
					</Popover>
				</div>

				<div className="flex-1 min-w-0">
					<Input
						value={formData.name}
						onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
						className="h-8 text-base"
						placeholder="Nombre"
					/>
					<Input
						value={formData.description || ''}
						onChange={(e) =>
							setFormData((prev) => ({
								...prev,
								description: e.target.value,
							}))
						}
						className="h-6 text-xs mt-1"
						placeholder="Descripción (opcional)"
					/>
				</div>
			</div>

			{extraFields}

			<div className="flex justify-end gap-2">
				{onCancel && (
					<Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
						Cancelar
					</Button>
				)}
				<Button type="submit" disabled={isLoading || !formData.name.trim()}>
					{isLoading ? 'Guardando...' : submitLabel}
				</Button>
			</div>
		</form>
	);
}
