'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getFolderById, updateFolder } from '@/app/actions/folders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { Folder } from '@/types/entities/folder';

interface EditFolderPageProps {
	params: {
		id: string;
	};
}

export default function EditFolderPage({ params }: EditFolderPageProps) {
	const { id } = params;
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [folder, setFolder] = useState<Folder | null>(null);

	useEffect(() => {
		async function loadFolder() {
			try {
				const result = await getFolderById(id);
				if (result.success && result.data) {
					setFolder(result.data);
				} else {
					setError(result.error || 'No se pudo cargar la carpeta');
				}
			} catch (err) {
				setError('Error al cargar la carpeta');
				console.error(err);
			} finally {
				setIsLoading(false);
			}
		}

		loadFolder();
	}, [id]);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setIsSubmitting(true);
		setError(null);

		const formData = new FormData(event.currentTarget);
		const name = formData.get('name') as string;
		const description = formData.get('description') as string;
		const emoji = formData.get('emoji') as string;
		const color = formData.get('color') as string;
		const isFavorite = formData.get('isFavorite') === 'on';

		try {
			const result = await updateFolder(id, {
				name,
				description: description || undefined,
				emoji: emoji || undefined,
				color: color || undefined,
				isFavorite,
			});

			if (result.success) {
				router.push(`/folders/${id}`);
				router.refresh();
			} else {
				setError(result.error || 'Error al actualizar la carpeta');
			}
		} catch (err) {
			setError('Error al procesar la solicitud');
			console.error(err);
		} finally {
			setIsSubmitting(false);
		}
	}

	if (isLoading) {
		return (
			<div className="p-8 max-w-2xl mx-auto">
				<h1 className="text-2xl font-bold mb-6">Cargando...</h1>
			</div>
		);
	}

	if (error && !folder) {
		return (
			<div className="p-8 max-w-2xl mx-auto">
				<h1 className="text-2xl font-bold mb-6">Error</h1>
				<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
				<div className="mt-4">
					<Button onClick={() => router.back()}>Volver</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="p-8 max-w-2xl mx-auto">
			<h1 className="text-2xl font-bold mb-6">Editar Carpeta</h1>

			{error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

			<form onSubmit={handleSubmit} className="space-y-6">
				<div className="space-y-2">
					<Label htmlFor="name">Nombre</Label>
					<Input id="name" name="name" defaultValue={folder.name} required />
				</div>

				<div className="space-y-2">
					<Label htmlFor="path">Ruta (no editable)</Label>
					<Input id="path" value={folder.path} disabled className="bg-gray-50" />
				</div>

				<div className="space-y-2">
					<Label htmlFor="description">Descripción (opcional)</Label>
					<Textarea id="description" name="description" defaultValue={folder.description || ''} rows={3} />
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label htmlFor="emoji">Emoji (opcional)</Label>
						<Input id="emoji" name="emoji" defaultValue={folder.emoji || ''} placeholder="📁" />
					</div>

					<div className="space-y-2">
						<Label htmlFor="color">Color (opcional)</Label>
						<Input id="color" name="color" type="color" defaultValue={folder.color || '#3b82f6'} />
					</div>
				</div>

				<div className="flex items-center space-x-2">
					<Switch id="isFavorite" name="isFavorite" defaultChecked={folder.isFavorite} />
					<Label htmlFor="isFavorite">Marcar como favorito</Label>
				</div>

				<div className="flex justify-end gap-4">
					<Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
						Cancelar
					</Button>
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
					</Button>
				</div>
			</form>
		</div>
	);
}
