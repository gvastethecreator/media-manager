'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
// 📝 Importar desde el índice centralizado de acciones de carpetas
import { createFolder } from '@/app/actions/folders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function CreateFolderPage() {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setIsSubmitting(true);
		setError(null);

		const formData = new FormData(event.currentTarget);
		const name = formData.get('name') as string;
		const path = formData.get('path') as string;
		const description = formData.get('description') as string;
		const emoji = formData.get('emoji') as string;
		const color = formData.get('color') as string;

		try {
			const result = await createFolder({
				name,
				path,
				description: description || undefined,
				emoji: emoji || undefined,
				color: color || undefined,
			});

			if (result.success) {
				router.push('/folders');
				router.refresh();
			} else {
				setError(result.error || 'Error al crear la carpeta');
			}
		} catch (err) {
			setError('Error al procesar la solicitud');
			console.error(err);
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<div className="p-8 max-w-2xl mx-auto">
			<h1 className="text-2xl font-bold mb-6">Crear Nueva Carpeta</h1>

			{error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

			<form onSubmit={handleSubmit} className="space-y-6">
				<div className="space-y-2">
					<Label htmlFor="name">Nombre</Label>
					<Input id="name" name="name" placeholder="Mi Carpeta" required />
				</div>

				<div className="space-y-2">
					<Label htmlFor="path">Ruta</Label>
					<Input id="path" name="path" placeholder="/ruta/a/mi-carpeta" required />
				</div>

				<div className="space-y-2">
					<Label htmlFor="description">Descripción (opcional)</Label>
					<Textarea id="description" name="description" placeholder="Descripción de la carpeta" rows={3} />
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label htmlFor="emoji">Emoji (opcional)</Label>
						<Input id="emoji" name="emoji" placeholder="📁" />
					</div>

					<div className="space-y-2">
						<Label htmlFor="color">Color (opcional)</Label>
						<Input id="color" name="color" type="color" defaultValue="#3b82f6" />
					</div>
				</div>

				<div className="flex justify-end gap-4">
					<Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
						Cancelar
					</Button>
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting ? 'Creando...' : 'Crear Carpeta'}
					</Button>
				</div>
			</form>
		</div>
	);
}
