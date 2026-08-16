/**
 * @file Modal de confirmación para eliminar archivos
 * @module file-browser-new/components/delete-dialog
 */

import { AlertTriangle, FileIcon, FolderIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { BrowserItem } from '../types/item.types';

export interface DeleteDialogProps {
	/** Si está procesando */
	isLoading?: boolean;
	/** Si el diálogo está abierto */
	isOpen: boolean;
	/** Items a eliminar */
	items: BrowserItem[];
	/** Callback al cancelar/cerrar */
	onCancel: () => void;
	/** Callback al confirmar la eliminación */
	onConfirm: () => void;
}

export function DeleteDialog({ isOpen, items, onConfirm, onCancel, isLoading = false }: DeleteDialogProps) {
	const itemCount = items.length;
	const isSingleItem = itemCount === 1;
	const firstItem = items[0];

	// Determinar si son archivos o carpetas
	const hasFolders = items.some((item) => item.entityType === 'folder');
	const hasFiles = items.some((item) => item.entityType !== 'folder');
	const isMixed = hasFolders && hasFiles;

	const getItemTypeLabel = () => {
		if (isMixed) return 'items';
		if (hasFolders) return itemCount === 1 ? 'folder' : 'folders';
		return itemCount === 1 ? 'file' : 'files';
	};

	const getWarningMessage = () => {
		if (hasFolders) {
			return `This will permanently delete ${isSingleItem ? 'the folder and all its contents' : 'the selected folders and all their contents'}. This action cannot be undone.`;
		}
		return `This will permanently delete ${isSingleItem ? 'the file' : `${itemCount} files`}. This action cannot be undone.`;
	};

	return (
		<Dialog onOpenChange={(open) => !open && onCancel()} open={isOpen}>
			<DialogContent className="sm:max-w-[425px]" onEscapeKeyDown={onCancel}>
				<DialogHeader>
					<div className="flex items-center gap-2 text-destructive">
						<AlertTriangle className="h-5 w-5" />
						<DialogTitle>
							{isSingleItem ? 'Confirm deletion' : `Delete ${itemCount} ${getItemTypeLabel()}`}
						</DialogTitle>
					</div>
					<DialogDescription className="pt-2">{getWarningMessage()}</DialogDescription>
				</DialogHeader>

				{isSingleItem && firstItem && (
					<div className="py-4">
						<div className="flex items-center gap-3 rounded-lg border bg-muted p-3">
							{firstItem.entityType === 'folder' ? (
								<FolderIcon className="h-8 w-8 text-primary" />
							) : (
								<FileIcon className="h-8 w-8 text-muted-foreground" />
							)}
							<div className="min-w-0 flex-1">
								<p className="truncate font-medium">{firstItem.name}</p>
							</div>
						</div>
					</div>
				)}

				{!isSingleItem && (
					<div className="py-4">
						<div
							className={cn(
								'rounded-lg border p-3',
								hasFolders ? 'border-destructive/20 bg-destructive/10' : 'bg-muted'
							)}
						>
							<p className="text-sm">
								<strong>{itemCount}</strong> {getItemTypeLabel()} selected
							</p>
							{hasFolders && (
								<p className="mt-1 text-destructive text-xs">⚠️ Some folders may contain files</p>
							)}
						</div>
					</div>
				)}

				<DialogFooter>
					<Button disabled={isLoading} onClick={onCancel} variant="outline">
						Cancel
					</Button>
					<Button disabled={isLoading} onClick={onConfirm} variant="destructive">
						{isLoading ? 'Deleting...' : isSingleItem ? 'Delete' : `Delete ${itemCount}`}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
