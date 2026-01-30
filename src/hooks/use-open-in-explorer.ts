/**
 * @file Hook para abrir archivos en el explorador del sistema
 * @module hooks/use-open-in-explorer
 * @description Hook para abrir carpetas en el explorador nativo del sistema
 */

import { useCallback, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { clientLogger } from '@/lib/logger/client-logger';

export interface OpenInExplorerOptions {
	/** Ruta del archivo o carpeta a abrir */
	path: string;
	/** Si debe seleccionar el archivo específico (true) o solo abrir la carpeta (false) */
	select?: boolean;
}

export interface UseOpenInExplorerResult {
	/** Función para abrir en explorador */
	openInExplorer: (options: OpenInExplorerOptions) => Promise<boolean>;
	/** Si está procesando */
	isLoading: boolean;
	/** Error si ocurrió */
	error: Error | null;
	/** Si la función está disponible (solo en entorno desktop/Tauri) */
	isAvailable: boolean;
}

/**
 * Hook para abrir carpetas en el explorador del sistema
 *
 * Nota: Esta función requiere:
 * - Backend con endpoint /api/files/open-in-explorer
 * - O integración con Tauri para acceso nativo al sistema de archivos
 */
export function useOpenInExplorer(): UseOpenInExplorerResult {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const { toast } = useToast();

	// Verificar si estamos en un entorno donde esta función puede funcionar
	// (Electron, Tauri, o backend con capacidades de sistema)
	const isAvailable = true; // Siempre intentar, el backend decidirá

	const openInExplorer = useCallback(
		async (options: OpenInExplorerOptions): Promise<boolean> => {
			const { path, select = false } = options;

			setIsLoading(true);
			setError(null);

			try {
				// Llamar al backend para abrir en explorador
				const response = await fetch('/api/files/open-in-explorer', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ path, select }),
				});

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
					throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
				}

				toast({
					title: '📂 Abriendo explorador',
					description: `Abriendo: ${path.split('/').pop() || path}`,
				});

				setIsLoading(false);
				return true;
			} catch (err) {
				const error = err instanceof Error ? err : new Error('Error al abrir explorador');
				setError(error);

				clientLogger.error('Error opening in explorer:', error);

				// Fallback: copiar la ruta al clipboard
				try {
					await navigator.clipboard.writeText(path);
					toast({
						variant: 'default',
						title: '📋 Ruta copiada',
						description: 'La ruta ha sido copiada al portapapeles (función de sistema no disponible)',
					});
				} catch {
					toast({
						variant: 'destructive',
						title: '❌ Error',
						description: 'No se pudo abrir el explorador. La función puede no estar disponible en este entorno.',
					});
				}

				setIsLoading(false);
				return false;
			}
		},
		[toast]
	);

	return {
		openInExplorer,
		isLoading,
		error,
		isAvailable,
	};
}
