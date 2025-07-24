import { Check, Loader2, Pencil, X } from 'lucide-react';
import { useCallback, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
// import { updateMetadata } from '@/services/metadata/metadata.service';
import type { AnyEntityWithStats } from '@/types/migration';

export interface BulkMetadataEditorProps {
	items: AnyEntityWithStats[];
}

/**
 * Componente para editar metadatos de múltiples elementos seleccionados
 */
export function BulkMetadataEditor({ items }: BulkMetadataEditorProps) {
	// Estados
	const [isEditing, setIsEditing] = useState(false);
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [isPending, startTransition] = useTransition();
	const { toast } = useToast();

	// Manejar el inicio de la edición
	const handleStartEditing = useCallback(() => {
		setTitle('');
		setDescription('');
		setIsEditing(true);
	}, []);

	// Manejar el guardado de los cambios
	const handleSave = useCallback(() => {
		if (!title && !description) {
			toast({
				title: 'No hay cambios que guardar',
				description: 'Por favor, introduce un título o descripción para aplicar a los elementos seleccionados.',
				variant: 'default',
			});
			return;
		}

		startTransition(async () => {
			const updates = items
				.map((item) => item.id)
				.filter((id): id is string => !!id)
				.map((id) => ({
					id,
					data: {
						title: title || undefined,
						description: description || undefined,
					},
				}));

			if (updates.length === 0) {
				toast({
					title: 'No hay elementos para actualizar',
					description: 'No se encontraron elementos válidos para actualizar.',
					variant: 'destructive',
				});
				return;
			}

			try {
				const response = await fetch('/api/metadata/bulk-update', {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ updates }),
				});

				const result = await response.json();

				if (!response.ok) {
					throw new Error(result.error || 'Error en la respuesta del servidor');
				}

				if (result.updated > 0) {
					toast({
						title: 'Metadatos actualizados',
						description: `Se han actualizado ${result.updated} de ${updates.length} elementos.`,
					});
				}

				if (result.errors && result.errors.length > 0) {
					toast({
						title: `Ocurrieron ${result.errors.length} errores`,
						description: 'Algunos metadatos no se pudieron actualizar. Revisa la consola para más detalles.',
						variant: 'destructive',
					});
					console.error('Errores en la actualización masiva:', result.errors);
				}

				setIsEditing(false);
				setTitle('');
				setDescription('');
			} catch (error) {
				console.error('Error al actualizar metadatos en masa:', error);
				toast({
					title: 'Error al guardar',
					description: (error as Error).message || 'No se pudieron actualizar los metadatos.',
					variant: 'destructive',
				});
			}
		});
	}, [items, title, description, toast]);

	// Manejar la cancelación de la edición
	const handleCancel = useCallback(() => {
		setIsEditing(false);
		setTitle('');
		setDescription('');
	}, []);

	// Si está en modo edición, mostrar formulario
	if (isEditing) {
		return (
			<div className="space-y-3 p-3 border rounded-md bg-muted/20">
				<h3 className="text-sm font-medium">Editar {items.length} elementos</h3>

				<div className="space-y-1.5">
					<Label htmlFor="bulk-title" className="text-xs">
						Título
					</Label>
					<Input
						id="bulk-title"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder="Aplicar este título a todos los elementos"
						className="h-8 text-sm"
					/>
				</div>

				<div className="space-y-1.5">
					<Label htmlFor="bulk-description" className="text-xs">
						Descripción
					</Label>
					<Textarea
						id="bulk-description"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder="Aplicar esta descripción a todos los elementos"
						className="min-h-[80px] text-sm"
					/>
				</div>

				<div className="flex justify-end gap-2 pt-1">
					<Button variant="ghost" size="sm" onClick={handleCancel} disabled={isPending} className="h-8">
						<X className="h-4 w-4 mr-1" />
						Cancelar
					</Button>
					<Button
						variant="default"
						size="sm"
						onClick={handleSave}
						disabled={isPending || (!title && !description)}
						className="h-8"
					>
						{isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
						Aplicar a todos
					</Button>
				</div>
			</div>
		);
	}

	// Modo visualización - botón para iniciar edición
	return (
		<Button variant="outline" size="sm" onClick={handleStartEditing} className="w-full h-8 text-xs">
			<Pencil className="h-3.5 w-3.5 mr-1.5" />
			Editar metadatos en masa
		</Button>
	);
}
