'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import type { ImageItem } from '@/types/image-item';
import { Check, Loader2, Pencil, X } from 'lucide-react';
import { useCallback, useState, useTransition } from 'react';

export interface EditableMetadataProps {
	item: ImageItem;
	onUpdate?: (id: string, data: { title?: string; description?: string }) => Promise<void>;
}

/**
 * Componente para editar metadatos básicos de una imagen
 */
export function EditableMetadata({ item, onUpdate }: EditableMetadataProps) {
	// Estados
	const [isEditing, setIsEditing] = useState(false);
	const [title, setTitle] = useState(item.name || '');
	const [description, setDescription] = useState(item.description || '');
	const [isPending, startTransition] = useTransition();
	const { toast } = useToast();

	// Manejar el inicio de la edición
	const handleStartEditing = useCallback(() => {
		setTitle(item.name || '');
		setDescription(item.description || '');
		setIsEditing(true);
	}, [item]);

	// Manejar el guardado de los cambios
	const handleSave = useCallback(() => {
		if (!onUpdate) {
			setIsEditing(false);
			return;
		}

		startTransition(async () => {
			try {
				await onUpdate(item.id, {
					title: title !== item.name ? title : undefined,
					description: description !== item.description ? description : undefined
				});

				toast({
					title: 'Metadatos actualizados',
					description: 'Los cambios se han guardado correctamente',
				});

				setIsEditing(false);
			} catch (error) {
				console.error('Error al actualizar metadatos:', error);
				toast({
					title: 'Error al guardar',
					description: 'No se pudieron actualizar los metadatos',
					variant: 'destructive',
				});
			}
		});
	}, [item, title, description, onUpdate, toast]);

	// Manejar la cancelación de la edición
	const handleCancel = useCallback(() => {
		setIsEditing(false);
		setTitle(item.name || '');
		setDescription(item.description || '');
	}, [item]);

	// Si está en modo edición, mostrar formulario
	if (isEditing) {
		return (
			<div className="space-y-3">
				<div className="space-y-1.5">
					<Label htmlFor="title" className="text-xs">Título</Label>
					<Input
						id="title"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder="Título de la imagen"
						className="h-8 text-sm"
					/>
				</div>

				<div className="space-y-1.5">
					<Label htmlFor="description" className="text-xs">Descripción</Label>
					<Textarea
						id="description"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder="Descripción de la imagen"
						className="min-h-[80px] text-sm"
					/>
				</div>

				<div className="flex justify-end gap-2 pt-1">
					<Button
						variant="ghost"
						size="sm"
						onClick={handleCancel}
						disabled={isPending}
						className="h-8"
					>
						<X className="h-4 w-4 mr-1" />
						Cancelar
					</Button>
					<Button
						variant="default"
						size="sm"
						onClick={handleSave}
						disabled={isPending}
						className="h-8"
					>
						{isPending ? (
							<Loader2 className="h-4 w-4 mr-1 animate-spin" />
						) : (
							<Check className="h-4 w-4 mr-1" />
						)}
						Guardar
					</Button>
				</div>
			</div>
		);
	}

	// Modo visualización
	return (
		<div className="space-y-2">
			<div className="flex justify-between items-start">
				<div>
					<h3 className="text-sm font-medium truncate">{item.name || 'Sin título'}</h3>
					{item.description && (
						<p className="text-xs text-muted-foreground mt-1">{item.description}</p>
					)}
					{!item.description && (
						<p className="text-xs text-muted-foreground italic mt-1">Sin descripción</p>
					)}
				</div>

				{onUpdate && (
					<Button
						variant="ghost"
						size="icon"
						onClick={handleStartEditing}
						className="h-6 w-6 rounded-full hover:bg-accent"
						title="Editar metadatos"
					>
						<Pencil className="h-3.5 w-3.5" />
					</Button>
				)}
			</div>
		</div>
	);
}