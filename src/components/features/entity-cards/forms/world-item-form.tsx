'use client';

import { Button } from '@/components/ui/button';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import type { WorldItemFormData } from '@/types/world-item-form-data';
import * as React from 'react';
import { CompactPicker } from 'react-color';

interface WorldItemFormProps {
	initialData?: WorldItemFormData;
	onSubmit: (data: WorldItemFormData) => Promise<void>;
	onCancel?: () => void;
	isLoading?: boolean;
}

const WORLD_ITEM_CATEGORIES = [
	'Arma',
	'Armadura',
	'Accesorio',
	'Poción',
	'Pergamino',
	'Gema',
	'Reliquia',
	'Herramienta',
	'Contenedor',
	'Vestimenta',
	'Otro',
];

const WORLD_ITEM_RARITIES = ['Común', 'Poco común', 'Raro', 'Muy raro', 'Legendario', 'Mítico'];

export function WorldItemForm({ initialData, onSubmit, onCancel, isLoading }: WorldItemFormProps) {
	const [formData, setFormData] = React.useState<WorldItemFormData>(
		initialData || {
			name: '',
			emoji: '🎯',
			color: '#3b82f6',
			description: '',
			type: 'Item',
			category: 'Arma',
			rarity: 'Común',
			properties: '[]',
			requirements: '{}',
			origin: '',
			stats: '{}',
			sortBy: 'name',
			filters: '[]',
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

	const handleChange = <T extends keyof WorldItemFormData>(field: T, value: WorldItemFormData[T]) => {
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
					<Label>Categoría</Label>
					<Select
						value={formData.category || 'Arma'}
						onValueChange={(value: string) => handleChange('category', value)}
					>
						<SelectTrigger className="h-8">
							<SelectValue placeholder="Selecciona una categoría" />
						</SelectTrigger>
						<SelectContent>
							{WORLD_ITEM_CATEGORIES.map((category) => (
								<SelectItem key={category} value={category}>
									{category}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-2">
					<Label>Rareza</Label>
					<Select value={formData.rarity || 'Común'} onValueChange={(value: string) => handleChange('rarity', value)}>
						<SelectTrigger className="h-8">
							<SelectValue placeholder="Selecciona rareza" />
						</SelectTrigger>
						<SelectContent>
							{WORLD_ITEM_RARITIES.map((rarity) => (
								<SelectItem key={rarity} value={rarity}>
									{rarity}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="space-y-2">
				<Label>Propiedades (JSON)</Label>
				<Textarea
					placeholder='["Mágico", "Indestructible", ...]'
					value={formData.properties}
					onChange={(e) => handleChange('properties', e.target.value)}
					className="font-mono text-sm min-h-[80px]"
				/>
			</div>

			<div className="space-y-2">
				<Label>Requisitos (JSON)</Label>
				<Textarea
					placeholder='{"nivel": 5, "clase": "Mago", ...}'
					value={formData.requirements}
					onChange={(e) => handleChange('requirements', e.target.value)}
					className="font-mono text-sm min-h-[80px]"
				/>
			</div>

			<div className="space-y-2">
				<Label>Origen</Label>
				<Input
					placeholder="Origen del objeto..."
					value={formData.origin}
					onChange={(e) => handleChange('origin', e.target.value)}
					className="h-8"
				/>
			</div>

			<div className="space-y-2">
				<Label>Estadísticas (JSON)</Label>
				<Textarea
					placeholder='{"daño": "2d6", "defensa": 5, ...}'
					value={formData.stats}
					onChange={(e) => handleChange('stats', e.target.value)}
					className="font-mono text-sm min-h-[80px]"
				/>
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
