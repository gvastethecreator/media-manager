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
import type { CharacterFormData } from '../entity-types';

const CHARACTER_CLASSES = [
	'Guerrero',
	'Mago',
	'Clérigo',
	'Pícaro',
	'Paladín',
	'Druida',
	'Bárbaro',
	'Bardo',
	'Monje',
	'Hechicero',
	'Brujo',
	'Explorador',
];

const CHARACTER_RACES = [
	'Humano',
	'Elfo',
	'Enano',
	'Mediano',
	'Gnomo',
	'Semielfo',
	'Semiorco',
	'Dracónido',
	'Tiefling',
];

const CHARACTER_ALIGNMENTS = [
	'Legal Bueno',
	'Neutral Bueno',
	'Caótico Bueno',
	'Legal Neutral',
	'Neutral',
	'Caótico Neutral',
	'Legal Malvado',
	'Neutral Malvado',
	'Caótico Malvado',
];

interface CharacterFormProps {
	initialData?: CharacterFormData;
	onSubmit: (data: CharacterFormData) => Promise<void>;
	onCancel?: () => void;
	isLoading?: boolean;
}

export function CharacterForm({ initialData, onSubmit, onCancel, isLoading }: CharacterFormProps) {
	const [formData, setFormData] = React.useState<CharacterFormData>(
		initialData || {
			name: '',
			emoji: '👤',
			color: '#3b82f6',
			description: '',
			level: 1,
			class: 'Guerrero',
			race: 'Humano',
			alignment: 'Neutral',
			backstory: '',
			stats: '{}',
			sortBy: 'name',
			filters: '[]',
			psychologicalProfile: '',
			socialProfile: '',
			relationships: '[]',
			goals: '[]',
			fears: '[]',
			beliefs: '[]',
			personality: '[]',
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

	const handleChange = <T extends keyof CharacterFormData>(field: T, value: CharacterFormData[T]) => {
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
					<Label>Nivel</Label>
					<Input
						type="number"
						min={1}
						max={20}
						value={formData.level}
						onChange={(e) => handleChange('level', Number.parseInt(e.target.value) || 1)}
						className="h-8"
						placeholder="Nivel"
					/>
				</div>
				<div className="space-y-2">
					<Label>Clase</Label>
					<Select value={formData.class} onValueChange={(value) => handleChange('class', value)}>
						<SelectTrigger className="h-8">
							<SelectValue placeholder="Selecciona una clase" />
						</SelectTrigger>
						<SelectContent>
							{CHARACTER_CLASSES.map((cls) => (
								<SelectItem key={cls} value={cls}>
									{cls}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label>Raza</Label>
					<Select value={formData.race} onValueChange={(value) => handleChange('race', value)}>
						<SelectTrigger className="h-8">
							<SelectValue placeholder="Selecciona una raza" />
						</SelectTrigger>
						<SelectContent>
							{CHARACTER_RACES.map((race) => (
								<SelectItem key={race} value={race}>
									{race}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-2">
					<Label>Alineamiento</Label>
					<Select value={formData.alignment} onValueChange={(value) => handleChange('alignment', value)}>
						<SelectTrigger className="h-8">
							<SelectValue placeholder="Selecciona alineamiento" />
						</SelectTrigger>
						<SelectContent>
							{CHARACTER_ALIGNMENTS.map((alignment) => (
								<SelectItem key={alignment} value={alignment}>
									{alignment}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="space-y-2">
				<Label>Historia del Personaje</Label>
				<Textarea
					value={formData.backstory}
					onChange={(e) => handleChange('backstory', e.target.value)}
					className="min-h-[100px]"
					placeholder="Escribe la historia del personaje..."
				/>
			</div>

			<div className="space-y-2">
				<Label>Perfil Psicológico</Label>
				<Textarea
					value={formData.psychologicalProfile}
					onChange={(e) => handleChange('psychologicalProfile', e.target.value)}
					className="min-h-[100px]"
					placeholder="Describe el perfil psicológico del personaje..."
				/>
			</div>

			<div className="space-y-2">
				<Label>Perfil Social</Label>
				<Textarea
					value={formData.socialProfile}
					onChange={(e) => handleChange('socialProfile', e.target.value)}
					className="min-h-[100px]"
					placeholder="Describe el perfil social del personaje..."
				/>
			</div>

			<div className="space-y-2">
				<Label>Relaciones (JSON)</Label>
				<Textarea
					value={formData.relationships}
					onChange={(e) => {
						try {
							JSON.parse(e.target.value);
							handleChange('relationships', e.target.value);
						} catch {
							// Si no es JSON válido, mantener el valor anterior
						}
					}}
					className="font-mono text-sm min-h-[80px]"
					placeholder='["Amigo de X", "Enemigo de Y", ...]'
				/>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label>Objetivos (JSON)</Label>
					<Textarea
						value={formData.goals}
						onChange={(e) => {
							try {
								JSON.parse(e.target.value);
								handleChange('goals', e.target.value);
							} catch {
								// Si no es JSON válido, mantener el valor anterior
							}
						}}
						className="font-mono text-sm min-h-[80px]"
						placeholder='["Venganza", "Poder", ...]'
					/>
				</div>
				<div className="space-y-2">
					<Label>Miedos (JSON)</Label>
					<Textarea
						value={formData.fears}
						onChange={(e) => {
							try {
								JSON.parse(e.target.value);
								handleChange('fears', e.target.value);
							} catch {
								// Si no es JSON válido, mantener el valor anterior
							}
						}}
						className="font-mono text-sm min-h-[80px]"
						placeholder='["Oscuridad", "Altura", ...]'
					/>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label>Creencias (JSON)</Label>
					<Textarea
						value={formData.beliefs}
						onChange={(e) => {
							try {
								JSON.parse(e.target.value);
								handleChange('beliefs', e.target.value);
							} catch {
								// Si no es JSON válido, mantener el valor anterior
							}
						}}
						className="font-mono text-sm min-h-[80px]"
						placeholder='["Honor", "Justicia", ...]'
					/>
				</div>
				<div className="space-y-2">
					<Label>Personalidad (JSON)</Label>
					<Textarea
						value={formData.personality}
						onChange={(e) => {
							try {
								JSON.parse(e.target.value);
								handleChange('personality', e.target.value);
							} catch {
								// Si no es JSON válido, mantener el valor anterior
							}
						}}
						className="font-mono text-sm min-h-[80px]"
						placeholder='["Valiente", "Leal", ...]'
					/>
				</div>
			</div>

			<div className="space-y-2">
				<Label>Estadísticas (JSON)</Label>
				<Textarea
					value={formData.stats}
					onChange={(e) => {
						try {
							JSON.parse(e.target.value);
							handleChange('stats', e.target.value);
						} catch {
							// Si no es JSON válido, mantener el valor anterior
						}
					}}
					className="font-mono text-sm"
					placeholder='{"fuerza": 10, "destreza": 10, ...}'
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
