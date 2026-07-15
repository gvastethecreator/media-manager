/**
 * @file Hook para abrir archivos en el explorador del sistema
 * @module hooks/use-open-in-explorer
 * @description Hook para abrir carpetas en el explorador nativo del sistema
 */

import { useCallback, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

export interface OpenInExplorerOptions {
	/** Ruta del archivo o carpeta a abrir */
	path: string;
	/** Si debe seleccionar el archivo específico (true) o solo abrir la carpeta (false) */
	select?: boolean;
}

export interface UseOpenInExplorerResult {
	/** Error si ocurrió */
	error: Error | null;
	/** Si la función está disponible (solo en entorno desktop/Tauri) */
	isAvailable: boolean;
	/** Si está procesando */
	isLoading: boolean;
	/** Función para abrir en explorador */
	openInExplorer: (options: OpenInExplorerOptions) => Promise<boolean>;
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
	const isAvailable = false;

	const openInExplorer = useCallback(
		async (_options: OpenInExplorerOptions): Promise<boolean> => {
			setIsLoading(true);
			const unavailableError = new Error('Abrir en el explorador requiere la integración segura de Tauri.');
			setError(unavailableError);
			toast({
				variant: 'destructive',
				title: 'Función no disponible',
				description: unavailableError.message,
			});
			setIsLoading(false);
			return false;
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
