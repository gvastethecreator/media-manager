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
			formLogger.info('✅ Carpeta agregada exitosamente');
		} catch (error) {
			formLogger.error('Error al agregar carpeta:', error);

			// Manejo específico de errores
			let userMessage = 'Error al agregar carpeta';
			if (error instanceof Error) {
				if (error.message.includes('Ya existe una carpeta')) {
					userMessage = error.message;
				} else if (error.message.includes('409')) {
					userMessage = `La carpeta '${folderPath}' ya existe en el sistema`;
				} else if (error.message.includes('404')) {
					userMessage = 'La ruta especificada no existe o no es accesible';
				} else if (error.message.includes('403')) {
					userMessage = 'No tienes permisos para acceder a esta carpeta';
				} else {
					userMessage = error.message;
				}
			}

			setErrorMessage(userMessage);
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
						className="absolute right-1 top-1/2 -translate-y-1/2 h-7 text-xs cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
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
					className="h-9 cursor-pointer hover:bg-primary/90 transition-colors"
					disabled={isSubmitting || isProcessing || isLoading || !folderPath.trim()}
				>
					{isSubmitting ? 'Agregando...' : 'Agregar'}
				</Button>
			</div>

			{errorMessage && (
				<div className="bg-red-50 border border-red-200 rounded-md p-2 mt-1">
					<div className="flex items-start gap-2">
						<div className="text-red-400 mt-0.5">
							<svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
								<path
									fillRule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
									clipRule="evenodd"
								/>
							</svg>
						</div>
						<div className="text-xs text-red-700">{errorMessage}</div>
					</div>
				</div>
			)}
		</form>
	);
}
