'use client';

import { deleteFolder } from '@/app/actions/folder';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface DeleteFolderButtonProps {
	id: string;
}

export default function DeleteFolderButton({ id }: DeleteFolderButtonProps) {
	const router = useRouter();
	const [isDeleting, setIsDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isOpen, setIsOpen] = useState(false);

	async function handleDelete() {
		setIsDeleting(true);
		setError(null);

		try {
			const result = await deleteFolder(id);

			if (result.success) {
				setIsOpen(false);
				router.push('/folders');
				router.refresh();
			} else {
				setError(result.error || 'Error al eliminar la carpeta');
			}
		} catch (err) {
			setError('Error al procesar la solicitud');
			console.error(err);
		} finally {
			setIsDeleting(false);
		}
	}

	return (
		<AlertDialog open={isOpen} onOpenChange={setIsOpen}>
			<AlertDialogTrigger asChild>
				<Button variant="destructive">Eliminar</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
					<AlertDialogDescription>
						Esta acción no se puede deshacer. Se eliminará permanentemente la carpeta y todo su contenido.
					</AlertDialogDescription>
				</AlertDialogHeader>
				{error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
					<AlertDialogAction
						onClick={(e) => {
							e.preventDefault();
							handleDelete();
						}}
						disabled={isDeleting}
						className="bg-red-600 hover:bg-red-700"
					>
						{isDeleting ? 'Eliminando...' : 'Eliminar'}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
