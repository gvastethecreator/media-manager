/**
 * @file Hook useMove
 * @module file-browser-new/hooks/use-move
 * @description Hook para mover archivos entre carpetas
 */

import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import type { FileEntityType } from '@/services/files/file-actions.service';
import { moveFile } from '@/services/files/file-actions.service';

interface MoveOptions {
	/** Tipo de entidad */
	entityType: FileEntityType;
	/** ID del archivo a mover */
	fileId: string;
	/** ID de la carpeta destino */
	targetFolderId: string;
}

interface MoveResult {
	/** Indica si está procesando */
	isMoving: boolean;
	/** Ejecuta la operación de mover */
	move: (options: MoveOptions) => Promise<void>;
}

/**
 * Hook para mover archivos entre carpetas
 * @returns Funciones y estado para operaciones de movimiento
 * @example
 * ```tsx
 * const { move, isMoving } = useMove();
 * await move({ fileId: '123', entityType: 'image', targetFolderId: '456' });
 * ```
 */
export function useMove(): MoveResult {
	const queryClient = useQueryClient();
	const [isMoving, setIsMoving] = useState(false);

	const move = useCallback(
		async ({ fileId, entityType, targetFolderId }: MoveOptions): Promise<void> => {
			setIsMoving(true);
			try {
				await moveFile(fileId, entityType, targetFolderId);
				// Invalidate queries to refresh the data
				queryClient.invalidateQueries({ queryKey: ['files', 'folder'] });
				queryClient.invalidateQueries({ queryKey: [entityType, 'list'] });
			} catch (error) {
				console.error('Error moving file:', error);
				throw error;
			} finally {
				setIsMoving(false);
			}
		},
		[queryClient]
	);

	return { move, isMoving };
}

// Add missing import
import { useState } from 'react';
