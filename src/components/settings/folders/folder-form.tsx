'use client';

import { Folder } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { clientLogger } from '@/lib/logger/client-logger';

// Logger específico para este componente
const formLogger = clientLogger.withContext('FolderForm');

// Extender la interfaz Window para incluir showDirectoryPicker
declare global {
	interface Window {
		showDirectoryPicker?: (options?: {
			id?: string;
			mode?: 'read';
			startIn?: 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
		}) => Promise<any>;
	}
}

interface DirectoryHandle {
	name: string;
	path?: string;
	fullPath?: string;
	[key: string]: unknown;
}

interface FolderFormProps {
	onAddFolder: (path: string) => Promise<void>;
	isProcessing: boolean;
	isLoading: boolean;
}

export function FolderForm({ onAddFolder, isProcessing, isLoading }: FolderFormProps) {
	const [folderPath, setFolderPath] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!folderPath.trim()) {
			setErrorMessage('Por favor ingresa una ruta de carpeta válida');
			return;
		}

		try {
			setIsSubmitting(true);
			setErrorMessage(null);
			formLogger.info('Agregando carpeta:', { path: folderPath });

			await onAddFolder(folderPath);
			setFolderPath('');
		} catch (error) {
			formLogger.error('Error al agregar carpeta:', error);
			setErrorMessage(error instanceof Error ? error.message : 'Error al agregar carpeta');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleBrowse = async () => {
		try {
			// Verificar si la API está disponible
			if (!window.showDirectoryPicker) {
				setErrorMessage('Tu navegador no soporta la selección nativa de carpetas');
				return;
			}

			// Usar el diálogo nativo para seleccionar carpetas
			const directoryPicker = await window.showDirectoryPicker({
				id: 'folder-selection',
				mode: 'read',
				startIn: 'pictures',
			});

			if (directoryPicker) {
				// Intentar obtener la ruta completa del sistema de archivos
				try {
					// @ts-ignore - La API de FileSystemHandle tiene una propiedad _path en algunos navegadores
					const fullPath = directoryPicker._path || directoryPicker.name;
					formLogger.info('Carpeta seleccionada:', { path: fullPath });
					setFolderPath(fullPath);
					setErrorMessage(null);
				} catch (error) {
					formLogger.warn('No se pudo obtener la ruta completa:', error);
					setFolderPath(directoryPicker.name);
				}
			}
		} catch (error) {
			formLogger.error('Error al seleccionar carpeta:', error);
			// No mostrar error si el usuario canceló la selección
			if (error instanceof Error && !error.message.includes('user aborted')) {
				setErrorMessage('Error al seleccionar la carpeta');
			}
		}
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFolderPath(e.target.value);
		// Limpiar error cuando el usuario modifica el input
		if (errorMessage) {
			setErrorMessage(null);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-2">
			<div className="flex items-center gap-2">
				<div className="relative flex-1">
					<Input
						type="text"
						placeholder="Ruta de la carpeta"
						value={folderPath}
						onChange={handleInputChange}
						className={`pr-24 ${errorMessage ? 'border-red-500' : ''}`}
						disabled={isSubmitting || isProcessing || isLoading}
					/>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="absolute right-1 top-1/2 -translate-y-1/2 h-7 text-xs"
						onClick={handleBrowse}
						disabled={isSubmitting || isProcessing || isLoading}
					>
						<Folder className="h-3.5 w-3.5 mr-1" />
						Explorar
					</Button>
				</div>
				<Button
					type="submit"
					size="sm"
					className="h-9"
					disabled={isSubmitting || isProcessing || isLoading || !folderPath.trim()}
				>
					{isSubmitting ? 'Agregando...' : 'Agregar'}
				</Button>
			</div>

			{errorMessage && <div className="text-xs text-red-500 px-1">{errorMessage}</div>}
		</form>
	);
}
