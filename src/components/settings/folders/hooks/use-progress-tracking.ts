import { useCallback, useEffect } from 'react';
import type { ExtendedProcessStatus } from '../folder-types';

/**
 * Hook para trackear el progreso de procesamiento (sin animaciones)
 */
export function useProgressTracking(
	isReindexing: boolean,
	isComplete: boolean,
	processStatus: ExtendedProcessStatus | undefined,
	folderId: string | undefined,
	setLastProgress: (progress: number) => void,
	setShowCompleteAnimation: (show: boolean) => void
): void {
	// Memoizar funciones para evitar re-renders
	const memoizedSetLastProgress = useCallback(setLastProgress, []);
	const memoizedSetShowCompleteAnimation = useCallback(setShowCompleteAnimation, []);

	useEffect(() => {
		const isActiveProcess = isReindexing && processStatus?.folderId === folderId;

		if (isActiveProcess && typeof processStatus?.progress === 'number') {
			memoizedSetLastProgress(processStatus.progress);

			// Marcar como completado inmediatamente cuando llega al 100%
			if (processStatus.progress >= 100) {
				memoizedSetShowCompleteAnimation(true);
			}
		} else if (isComplete) {
			memoizedSetLastProgress(100);
			memoizedSetShowCompleteAnimation(true);
		}

		// Limpiar estado de completado cuando no está reindexando
		if (!(isReindexing || isComplete)) {
			memoizedSetShowCompleteAnimation(false);
		}
	}, [
		isReindexing,
		isComplete,
		processStatus?.folderId,
		processStatus?.progress,
		folderId,
		memoizedSetLastProgress,
		memoizedSetShowCompleteAnimation,
	]);
}
