/**
 * @file Hook para renombrar archivos (individual y batch)
 * @module file-browser-new/hooks/use-rename
 * @description Hook para renombrar archivos individuales o en lote con patrones
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/api/client';
import { toMediaAssetType } from '@/lib/api/authorized-roots';
import {
	addFileMutationResult,
	type FileMutationItemResult,
	type FileMutationSummary,
	PartialFileMutationError,
	pendingFileMutationDescription,
} from '@/lib/api/file-mutation-result';
import { clientLogger } from '@/lib/logger/client-logger';
import type { BrowserItem } from '../types/item.types';

interface RenameSingleInput {
	item: BrowserItem;
	newName: string;
}

interface RenameBatchInput {
	renames: Array<{ item: BrowserItem; newName: string }>;
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
	renameBatch: (renames: Array<{ item: BrowserItem; newName: string }>) => Promise<void>;
	/** Renombrar un solo archivo */
	renameItem: (item: BrowserItem, newName: string) => Promise<void>;
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

	const mutation = useMutation<FileMutationSummary, Error, RenameSingleInput | RenameBatchInput>({
		mutationFn: async (input) => {
			const operations = 'renames' in input ? input.renames : [{ item: input.item, newName: input.newName }];
			const summary: FileMutationSummary = {
				applied: 0,
				cleanupPending: 0,
				reconciliationPending: 0,
				recoveryPending: 0,
				total: operations.length,
			};
			// Verificar si es batch o single
			try {
				for (const rename of operations) {
					const assetType = toMediaAssetType(rename.item.entityType);
					if (!assetType) throw new Error(`No se puede renombrar el tipo ${rename.item.entityType}`);
					const response = await apiClient.put<{
						data: { renamed: FileMutationItemResult[] };
						success: true;
					}>('/files/assets/rename', {
						renames: [{ asset: { assetId: rename.item.id, assetType }, newName: rename.newName }],
					});
					const renamed = response.data.renamed[0];
					if (!renamed) throw new Error('El servidor no confirmó el asset renombrado.');
					addFileMutationResult(summary, renamed);
				}
			} catch (error) {
				throw new PartialFileMutationError(
					error instanceof Error ? error.message : 'No se pudieron renombrar todos los archivos.',
					summary,
					error
				);
			}
			return summary;
		},
		onSuccess: (summary, input) => {
			const reconciliation = pendingFileMutationDescription(summary);
			if (reconciliation) {
				toast({ title: '⚠️ Renombrado aplicado con tareas pendientes', description: reconciliation });
				return;
			}
			if ('renames' in input) {
				const count = input.renames.length;
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
			const partial = error instanceof PartialFileMutationError ? error.summary : null;

			if (partial?.applied) {
				toast({
					variant: 'destructive',
					title: '⚠️ Renombrado parcialmente aplicado',
					description: `${partial.applied} de ${partial.total} archivos fueron renombrados antes del fallo. Revisa la lista antes de reintentar.`,
				});
			} else if ('renames' in input) {
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
		onSettled: async () => {
			await Promise.all(
				['files', 'folder-files', 'images', 'videos', 'audios', 'documents', 'all-images', 'favorites'].map((key) =>
					queryClient.invalidateQueries({ queryKey: [key] })
				)
			);
		},
	});

	const renameItem = async (item: BrowserItem, newName: string): Promise<void> => {
		await mutation.mutateAsync({ item, newName });
	};

	const renameBatch = async (renames: Array<{ item: BrowserItem; newName: string }>): Promise<void> => {
		await mutation.mutateAsync({ renames });
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
