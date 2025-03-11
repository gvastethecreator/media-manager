'use client';

import { Button } from '@/components/ui/button';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import * as React from 'react';
import { CompactPicker } from 'react-color';
import type { PlaceFormData } from './entity-types';

interface PlaceFormProps {
	initialData?: PlaceFormData;
	onSubmit: (data: PlaceFormData) => Promise<void>;
	onCancel?: () => void;
	isLoading?: boolean;
}

const PLACE_TYPES = [
	'Ciudad',
	'Pueblo',
	'Castillo',
	'Fortaleza',
	'Ruinas',
	'Mazmorra',
	'Bosque',
	'Montaña',
	'Desierto',
	'Costa',
	'Isla',
	'Templo',
	'Otro',
];

const CLIMATE_TYPES = ['Tropical', 'Templado', 'Continental', 'Polar', 'Árido', 'Mediterráneo', 'Montañoso', 'Otro'];

const GOVERNMENT_TYPES = [
	'Monarquía',
	'República',
	'Oligarquía',
	'Teocracia',
	'Anarquía',
	'Dictadura',
	'Consejo',
	'Otro',
];

export function PlaceForm({ initialData, onSubmit, onCancel, isLoading }: PlaceFormProps) {
	const [formData, setFormData] = React.useState<PlaceFormData>(
		initialData || {
			name: '',
			emoji: '📍',
			color: '#3b82f6',
			description: '',
			region: '',
			type: 'Ciudad',
			climate: 'Templado',
			population: 0,
			government: 'Monarquía',
			dangers: '[]',
			resources: '[]',
			lore: '',
			history: '',
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

	const handleChange = <T extends keyof PlaceFormData>(field: T, value: PlaceFormData[T]) => {
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
					<Label>Región</Label>
					<Input
						placeholder="Nombre de la región..."
						value={formData.region}
						onChange={(e) => handleChange('region', e.target.value)}
						className="h-8"
					/>
				</div>
				<div className="space-y-2">
					<Label>Tipo</Label>
					<Select value={formData.type} onValueChange={(value) => handleChange('type', value)}>
						<SelectTrigger className="h-8">
							<SelectValue placeholder="Selecciona un tipo" />
						</SelectTrigger>
						<SelectContent>
							{PLACE_TYPES.map((type) => (
								<SelectItem key={type} value={type}>
									{type}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label>Clima</Label>
					<Select value={formData.climate} onValueChange={(value) => handleChange('climate', value)}>
						<SelectTrigger className="h-8">
							<SelectValue placeholder="Selecciona un clima" />
						</SelectTrigger>
						<SelectContent>
							{CLIMATE_TYPES.map((climate) => (
								<SelectItem key={climate} value={climate}>
									{climate}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-2">
					<Label>Gobierno</Label>
					<Select value={formData.government} onValueChange={(value) => handleChange('government', value)}>
						<SelectTrigger className="h-8">
							<SelectValue placeholder="Selecciona un gobierno" />
						</SelectTrigger>
						<SelectContent>
							{GOVERNMENT_TYPES.map((government) => (
								<SelectItem key={government} value={government}>
									{government}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="space-y-2">
				<Label>Población</Label>
				<Input
					type="number"
					min={0}
					placeholder="Número de habitantes..."
					value={formData.population}
					onChange={(e) => handleChange('population', Number.parseInt(e.target.value) || 0)}
					className="h-8"
				/>
			</div>

			<div className="space-y-2">
				<Label>Peligros (JSON)</Label>
				<Textarea
					placeholder='["Bandidos", "Monstruos", ...]'
					value={formData.dangers}
					onChange={(e) => handleChange('dangers', e.target.value)}
					className="font-mono text-sm min-h-[80px]"
				/>
			</div>

			<div className="space-y-2">
				<Label>Recursos (JSON)</Label>
				<Textarea
					placeholder='["Oro", "Madera", "Hierro", ...]'
					value={formData.resources}
					onChange={(e) => handleChange('resources', e.target.value)}
					className="font-mono text-sm min-h-[80px]"
				/>
			</div>

			<div className="space-y-2">
				<Label>Historia</Label>
				<Textarea
					placeholder="Historia del lugar..."
					value={formData.history}
					onChange={(e) => handleChange('history', e.target.value)}
					className="min-h-[100px]"
				/>
			</div>

			<div className="space-y-2">
				<Label>Leyendas y Mitos</Label>
				<Textarea
					placeholder="Leyendas y mitos del lugar..."
					value={formData.lore}
					onChange={(e) => handleChange('lore', e.target.value)}
					className="min-h-[100px]"
				/>
			</div>

			<div className="space-y-2">
				<Label>Estadísticas (JSON)</Label>
				<Textarea
					placeholder='{"defensa": 10, "comercio": 8, ...}'
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
