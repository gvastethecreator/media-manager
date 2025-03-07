'use client';

import { Button } from '@/components/ui/button';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { CheckIcon, Loader2, XIcon } from 'lucide-react';
import * as React from 'react';
import { CompactPicker } from 'react-color';
import type { CollectionFormData } from './entity-types';

interface CollectionFormProps {
	initialData?: CollectionFormData;
	onSubmit: (data: CollectionFormData) => Promise<void>;
	onCancel?: () => void;
	isLoading?: boolean;
}

const PLATFORMS = ['Steam', 'Epic Games', 'GOG', 'Humble Bundle', 'Itch.io', 'Other'];

export function CollectionForm({ initialData, onSubmit, onCancel, isLoading = false }: CollectionFormProps) {
	const [formData, setFormData] = React.useState<CollectionFormData>(
		initialData || {
			name: '',
			emoji: '🌟',
			description: '',
			color: '#3b82f6',
			filters: '[]',
			sortBy: 'name',
			editions: '[]',
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

	const handleColorChange = (color: { hex: string }) => {
		setFormData((prev) => ({ ...prev, color: color.hex }));
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="grid gap-4">
				<div className="flex items-center gap-2">
					<Popover>
						<PopoverTrigger asChild>
							<Button
								type="button"
								variant="outline"
								size="icon"
								className="h-8 w-8"
								style={{
									backgroundColor: formData.color,
								}}
							>
								<span className="text-lg">{formData.emoji}</span>
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-full p-0" side="right" align="start">
							<EmojiPicker
								onEmojiSelect={(emoji: string) =>
									setFormData((prev) => ({
										...prev,
										emoji,
									}))
								}
							/>
							<Separator className="my-2" />
							<div className="p-2">
								<CompactPicker color={formData.color} onChange={handleColorChange} />
							</div>
						</PopoverContent>
					</Popover>
					<Input
						placeholder="Nombre de la colección"
						value={formData.name}
						onChange={(e) =>
							setFormData((prev) => ({
								...prev,
								name: e.target.value,
							}))
						}
						className="h-8"
					/>
				</div>

				<Textarea
					placeholder="Descripción (opcional)"
					value={formData.description}
					onChange={(e) =>
						setFormData((prev) => ({
							...prev,
							description: e.target.value,
						}))
					}
					className="h-20 resize-none"
				/>

				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label>Plataforma</Label>
						<Select
							value={formData.platform}
							onValueChange={(value) => setFormData((prev) => ({ ...prev, platform: value }))}
						>
							<SelectTrigger>
								<SelectValue placeholder="Selecciona plataforma" />
							</SelectTrigger>
							<SelectContent>
								{PLATFORMS.map((platform) => (
									<SelectItem key={platform} value={platform}>
										{platform}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label>Precio</Label>
						<Input
							type="number"
							placeholder="Precio"
							value={formData.price || ''}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									price: Number.parseFloat(e.target.value) || undefined,
								}))
							}
							className="h-8"
						/>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label>URL</Label>
						<Input
							placeholder="URL"
							value={formData.url || ''}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									url: e.target.value,
								}))
							}
							className="h-8"
						/>
					</div>

					<div className="space-y-2">
						<Label>URL Alternativa</Label>
						<Input
							placeholder="URL Alternativa"
							value={formData.alternativeUrl || ''}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									alternativeUrl: e.target.value,
								}))
							}
							className="h-8"
						/>
					</div>
				</div>

				<div className="space-y-2">
					<Label>Ediciones (JSON)</Label>
					<Textarea
						placeholder='["Standard", "Deluxe", ...]'
						value={formData.editions}
						onChange={(e) =>
							setFormData((prev) => ({
								...prev,
								editions: e.target.value,
							}))
						}
						className="font-mono text-sm h-20 resize-none"
					/>
				</div>
			</div>

			<div className="flex items-center justify-end gap-2">
				{onCancel && (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={onCancel}
						className="h-7 text-xs text-destructive hover:text-destructive/90"
					>
						<XIcon className="h-3.5 w-3.5 mr-1" />
						Cancelar
					</Button>
				)}
				<Button
					type="submit"
					variant="ghost"
					size="sm"
					disabled={isLoading || !formData.name.trim()}
					className="h-7 text-xs text-green-500 hover:text-green-600"
				>
					{isLoading ? (
						<Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
					) : (
						<CheckIcon className="h-3.5 w-3.5 mr-1" />
					)}
					{initialData ? 'Guardar' : 'Crear'}
				</Button>
			</div>
		</form>
	);
}
