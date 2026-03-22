/**
 * @file Hook para renombrar archivos (individual y batch)
 * @module file-browser-new/hooks/use-rename
 * @description Hook para renombrar archivos individuales o en lote con patrones
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { clientLogger } from '@/lib/logger/client-logger';

const API_BASE = '/api';

interface RenameSingleInput {
	itemId: string;
	newName: string;
}

interface RenameBatchInput {
	items: Array<{ id: string; currentName: string }>;
	pattern: string;
	startNumber?: number;
}

interface RenameResult {
	/** Error si ocurrió */
	error: Error | null;
	/** Si está procesando */
	isLoading: boolean;
	/** Si la operación fue exitosa */
	isSuccess: boolean;
	/** Progreso del renombrado en batch (0-100) */
	progress: number;
	/** Renombrar múltiples archivos con patrón */
	renameBatch: (
		items: Array<{ id: string; currentName: string }>,
		pattern: string,
		startNumber?: number
	) => Promise<void>;
	/** Renombrar un solo archivo */
	renameItem: (itemId: string, newName: string) => Promise<void>;
	/** Resetear estado */
	reset: () => void;
}

/**
 * Genera nombres de archivo basados en un patrón
 * @param pattern - Patrón con {n} para el número y {name} para nombre original
 * @param index - Índice del archivo (0-based)
 * @param startNumber - Número inicial (default: 1)
 * @param originalName - Nombre original del archivo
 * @returns Nombre generado
 *
 * Ejemplos:
 * - pattern: "imagen_{n}.jpg", index: 0 → "imagen_1.jpg"
 * - pattern: "foto_{n:3}.png", index: 5 → "foto_005.png"
 * - pattern: "{name}_backup", originalName: "file.txt" → "file_backup.txt"
 */
function generateNameFromPattern(pattern: string, index: number, startNumber = 1, originalName?: string): string {
	let result = pattern;

	// Reemplazar {n} o {n:digits} con el número
	const numberMatch = pattern.match(/\{n(?::(\d+))?\}/);
	if (numberMatch) {
		const digits = numberMatch[1] ? Number.parseInt(numberMatch[1], 10) : 1;
		const number = (index + startNumber).toString().padStart(digits, '0');
		result = result.replace(numberMatch[0], number);
	}

	// Reemplazar {name} con el nombre original (sin extensión)
	if (originalName && result.includes('{name}')) {
		const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
		result = result.replace(/\{name\}/g, nameWithoutExt);
	}

	// Reemplazar {ext} con la extensión original
	if (originalName && result.includes('{ext}')) {
		const ext = originalName.split('.').pop() || '';
		result = result.replace(/\{ext\}/g, ext);
	}

	return result;
}

/**
 * Hook para renombrar archivos (individual y batch)
 */
export function useRename(): RenameResult {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	const mutation = useMutation<void, Error, RenameSingleInput | RenameBatchInput>({
		mutationFn: async (input) => {
			// Verificar si es batch o single
			if ('items' in input) {
				// Renombrado en batch
				const { items, pattern, startNumber = 1 } = input;
				const errors: string[] = [];

				for (let i = 0; i < items.length; i++) {
					const item = items[i];
					const newName = generateNameFromPattern(pattern, i, startNumber, item.currentName);

					try {
						const response = await fetch(`${API_BASE}/files/${item.id}/rename`, {
							method: 'PUT',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ name: newName }),
						});

						if (!response.ok) {
							const errorData = await response.json().catch(() => ({}));
							errors.push(`${item.currentName}: ${errorData.message || response.statusText}`);
						}
					} catch (error) {
						errors.push(`${item.currentName}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
					}
				}

				if (errors.length > 0) {
					throw new Error(`Errores en ${errors.length} de ${items.length} archivos:\n${errors.join('\n')}`);
				}
			} else {
				// Renombrado individual
				const { itemId, newName } = input;
				const response = await fetch(`${API_BASE}/files/${itemId}/rename`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ name: newName }),
				});

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					throw new Error(errorData.message || `Error al renombrar: ${response.statusText}`);
				}
			}
		},
		onSuccess: (_, input) => {
			// Invalidar todas las queries relevantes
			queryClient.invalidateQueries({ queryKey: ['files'] });
			queryClient.invalidateQueries({ queryKey: ['folder-files'] });
			queryClient.invalidateQueries({ queryKey: ['images'] });
			queryClient.invalidateQueries({ queryKey: ['videos'] });
			queryClient.invalidateQueries({ queryKey: ['audios'] });
			queryClient.invalidateQueries({ queryKey: ['documents'] });
			queryClient.invalidateQueries({ queryKey: ['all-images'] });
			queryClient.invalidateQueries({ queryKey: ['favorites'] });

			if ('items' in input) {
				const count = input.items.length;
				toast({
					title: '✅ Archivos renombrados',
					description: `${count} archivo${count > 1 ? 's' : ''} renombrado${count > 1 ? 's' : ''} exitosamente`,
				});
			} else {
				toast({
					title: '✅ Archivo renombrado',
					description: 'El archivo ha sido renombrado exitosamente',
				});
			}
		},
		onError: (error, input) => {
			clientLogger.error('Error renaming files:', error);

			if ('items' in input) {
				toast({
					variant: 'destructive',
					title: '❌ Error al renombrar',
					description: error.message || 'Error desconocido',
				});
			} else {
				toast({
					variant: 'destructive',
					title: '❌ Error al renombrar',
					description: error.message || 'No se pudo renombrar el archivo',
				});
			}
		},
	});

	const renameItem = async (itemId: string, newName: string): Promise<void> => {
		await mutation.mutateAsync({ itemId, newName });
	};

	const renameBatch = async (
		items: Array<{ id: string; currentName: string }>,
		pattern: string,
		startNumber?: number
	): Promise<void> => {
		await mutation.mutateAsync({ items, pattern, startNumber });
	};

	return {
		renameItem,
		renameBatch,
		isLoading: mutation.isPending,
		error: mutation.error,
		isSuccess: mutation.isSuccess,
		progress: 0, // TODO: Implementar progreso real si se necesita
		reset: mutation.reset,
	};
}

export { generateNameFromPattern };
export type { RenameSingleInput, RenameBatchInput };
