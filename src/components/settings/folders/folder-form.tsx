'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FolderPlus, FolderSearch, RefreshCw } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';

interface DirectoryHandle {
	name: string;
	path?: string;
	fullPath?: string;
	[key: string]: unknown;
}

interface FolderFormProps {
	isProcessing: boolean;
	isLoading: boolean;
	onAddFolder: (path: string) => Promise<void>;
}

interface ShowDirectoryPickerWindow extends Window {
	showDirectoryPicker?: () => Promise<DirectoryHandle>;
}

export function FolderForm({ isProcessing, isLoading, onAddFolder }: FolderFormProps) {
	const [folderPath, setFolderPath] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async () => {
		if (!folderPath.trim()) {
			return;
		}

		setIsSubmitting(true);
		try {
			await onAddFolder(folderPath);
			setFolderPath('');
		} finally {
			setIsSubmitting(false);
		}
	};

	// Función para abrir el diálogo de selección de carpetas nativo
	const handleBrowse = async () => {
		try {
			const win = window as unknown as ShowDirectoryPickerWindow;
			if (!win.showDirectoryPicker) {
				throw new Error('La API showDirectoryPicker no está disponible en este navegador');
			}

			const directoryHandle = await win.showDirectoryPicker();
			if (directoryHandle) {
				const path = directoryHandle.path || directoryHandle.name || directoryHandle.fullPath;
				setFolderPath(path || directoryHandle.name);
			}
		} catch (error) {
			console.error('Error al seleccionar la carpeta:', error);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && folderPath.trim() && !isLoading && !isProcessing) {
			handleSubmit();
		}
	};

	return (
		<div className="flex items-center gap-2">
			<div className="relative flex-1">
				<Input
					type="text"
					placeholder="Ruta de la carpeta (ej: C:\Users\Usuario\Imágenes)"
					value={folderPath}
					onChange={(e) => setFolderPath(e.target.value)}
					onKeyDown={handleKeyDown}
					className="h-7 text-xs pl-7"
					disabled={isProcessing || isSubmitting}
				/>
				<FolderPlus className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
			</div>

			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							type="button"
							variant="outline"
							className="h-7 px-2"
							onClick={handleBrowse}
							disabled={isProcessing || isSubmitting}
							size="sm"
						>
							<FolderSearch className="h-3.5 w-3.5" />
						</Button>
					</TooltipTrigger>
					<TooltipContent className="text-xs">Seleccionar carpeta</TooltipContent>
				</Tooltip>
			</TooltipProvider>

			<Button
				size="sm"
				className="h-7 text-xs"
				onClick={handleSubmit}
				disabled={isLoading || isProcessing || isSubmitting || !folderPath.trim()}
			>
				{isProcessing || isSubmitting ? (
					<>
						<RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />
						<span>Procesando</span>
					</>
				) : (
					<>
						<FolderPlus className="h-3.5 w-3.5 mr-1" />
						<span>Agregar</span>
					</>
				)}
			</Button>
		</div>
	);
}
