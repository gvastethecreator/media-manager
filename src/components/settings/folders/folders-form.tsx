import { FolderOpen } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

	const isPathInvalid = (p: string) => !p?.trim();

	const mapErrorToMessage = (err: unknown, path: string): string => {
		if (!(err instanceof Error)) {
			return 'Error al agregar carpeta';
		}
		const msg = err.message;
		if (msg.includes('Ya existe una carpeta')) {
			return msg;
		}
		if (msg.includes('409')) {
			return `La carpeta '${path}' ya existe en el sistema`;
		}
		if (msg.includes('404')) {
			return 'La ruta especificada no existe o no es accesible';
		}
		if (msg.includes('403')) {
			return 'No tienes permisos para acceder a esta carpeta';
		}
		return msg;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (isPathInvalid(folderPath)) {
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
		} catch (err) {
			formLogger.error('Error al agregar carpeta:', err);
			setErrorMessage(mapErrorToMessage(err, folderPath));
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
				// Intentar obtener la ruta completa del sistema de archivos usando accesos seguros
				const anyHandle = directoryPicker as Record<string, unknown> | undefined;
				const maybePath = (
					anyHandle && typeof anyHandle === 'object' && '_path' in anyHandle ? (anyHandle as any)._path : undefined
				) as string | undefined;
				const fullPath = maybePath || directoryPicker.fullPath || directoryPicker.path || directoryPicker.name;
				formLogger.info('Carpeta seleccionada:', { path: fullPath });
				setFolderPath(fullPath);
				setErrorMessage(null);
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
		<form className="space-y-3" onSubmit={handleSubmit}>
			<div className="flex flex-col gap-1.5">
				<Label className="font-semibold text-sm opacity-90">Path Selection</Label>
				<div className="flex items-center gap-2">
					<div className="relative flex-1">
						<Input
							className={`border-input/60 bg-card pr-10 focus-visible:ring-primary/20 ${errorMessage ? 'border-destructive' : ''}`}
							disabled={isSubmitting || isProcessing || isLoading}
							onChange={handleInputChange}
							placeholder="Route de la carpeta"
							type="text"
							value={folderPath}
						/>
						<Button
							className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2 cursor-pointer p-0 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
							disabled={isSubmitting || isProcessing || isLoading}
							onClick={handleBrowse}
							size="icon"
							title="Explore Folders"
							type="button"
							variant="ghost"
						>
							<FolderOpen className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>

			{/* Hidden submit button to allow Enter key submission without visual clutter if desired, 
                OR we can add an explicit "Add" button if we want to follow the design 1:1 which doesn't seem to show one 
                but usually one is needed. The reference image DOES NOT show an "Add" button, just "Re-index All". 
                However, for UX we probably need a way to submit. 
                I'll leave the implicit submit via Enter, and maybe add a small "Add" button if the input is filled?
                For now, preserving the "Add" button but making it full width/styled if needed, 
                OR maybe the reference implies selecting a path implies adding it? 
                Let's keep the functional "Add" button but maybe style it subtly or integrate it better.
                Actually, the reference has "Explore" next to input (which I did inside).
                Let's stick to the previous functionality but cleaned up.
            */}
			<Button
				className="w-full font-medium"
				disabled={isSubmitting || isProcessing || isLoading || !folderPath.trim()}
				size="sm"
				type="submit"
				variant="secondary"
			>
				{isSubmitting ? 'Adding...' : 'Add Folder'}
			</Button>

			{errorMessage && (
				<div className="mt-1 rounded-md border border-destructive/20 border-ui-error-border bg-ui-error/10 p-2">
					<div className="flex items-start gap-2">
						<div className="font-medium text-destructive text-xs">{errorMessage}</div>
					</div>
				</div>
			)}
		</form>
	);
}
