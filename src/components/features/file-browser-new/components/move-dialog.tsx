/**
 * @file Modal para seleccionar carpeta destino al mover archivos
 * @module file-browser-new/components/move-dialog
 */

import { FolderIcon, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { useFolders } from '@/lib/api/folders';
import { cn } from '@/lib/utils';
import type { FolderWithStats } from '@/types/entities/folder';
import type { BrowserItem } from '../types/item.types';

export interface MoveDialogProps {
	/** Si está procesando */
	isLoading?: boolean;
	/** Si el diálogo está abierto */
	isOpen: boolean;
	/** Archivos a mover */
	items: BrowserItem[];
	/** Callback al cancelar */
	onCancel: () => void;
	/** Callback al confirmar */
	onConfirm: (targetFolderId: string) => void;
}

export function MoveDialog({ isOpen, items, onConfirm, onCancel, isLoading = false }: MoveDialogProps) {
	const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
	const { data: foldersResponse, isLoading: foldersLoading } = useFolders({
		limit: 100,
		sortBy: 'name',
		sortOrder: 'asc',
	});
	const folders = foldersResponse?.data;

	const itemCount = items.length;

	useEffect(() => {
		if (isOpen) setSelectedFolderId(null);
	}, [isOpen]);

	return (
		<Dialog onOpenChange={(open) => !open && onCancel()} open={isOpen}>
			<DialogContent className="sm:max-w-[500px]" onEscapeKeyDown={onCancel}>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<FolderIcon className="h-5 w-5" />
						Mover {itemCount} {itemCount === 1 ? 'elemento' : 'elementos'}
					</DialogTitle>
					<DialogDescription>Selecciona la carpeta destino donde deseas mover los archivos.</DialogDescription>
				</DialogHeader>

				<div className="py-4">
					{/* Lista de carpetas */}
					<div className="max-h-[300px] overflow-y-auto rounded-lg border">
						{foldersLoading ? (
							<div className="flex items-center justify-center py-8">
								<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
							</div>
						) : folders && folders.length > 0 ? (
							<div className="divide-y">
								{/* Carpetas */}
								{folders.map((folder: FolderWithStats) => (
									<button
										className={cn(
											'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted',
											selectedFolderId === folder.id && 'bg-primary/10 hover:bg-primary/10'
										)}
										key={folder.id}
										onClick={() => setSelectedFolderId(folder.id)}
										type="button"
									>
										<FolderIcon className="h-4 w-4 text-yellow-500" />
										<span className="flex-1 truncate">{folder.name}</span>
										{selectedFolderId === folder.id && <div className="h-2 w-2 rounded-full bg-primary" />}
									</button>
								))}
							</div>
						) : (
							<div className="py-8 text-center text-muted-foreground">No hay carpetas disponibles</div>
						)}
					</div>

					{/* Preview de items a mover */}
					<div className="mt-4 rounded-lg bg-muted p-3">
						<p className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">Items a mover</p>
						<div className="space-y-1">
							{items.slice(0, 3).map((item) => (
								<div className="flex items-center gap-2 text-sm" key={item.id}>
									<span className="truncate">{item.name}</span>
								</div>
							))}
							{items.length > 3 && <p className="text-muted-foreground text-xs">... y {items.length - 3} más</p>}
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button disabled={isLoading} onClick={onCancel} variant="outline">
						Cancelar
					</Button>
					<Button
						disabled={!selectedFolderId || isLoading}
						onClick={() => selectedFolderId && onConfirm(selectedFolderId)}
					>
						{isLoading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Moviendo...
							</>
						) : (
							<>
								Mover {itemCount} {itemCount === 1 ? 'item' : 'items'}
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
