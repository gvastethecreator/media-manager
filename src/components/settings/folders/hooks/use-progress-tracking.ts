import { useEffect } from 'react';
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
	useEffect(() => {
		const isActiveProcess = isReindexing && processStatus?.folderId === folderId;

		if (isActiveProcess && typeof processStatus?.progress === 'number') {
			setLastProgress(processStatus.progress);

			// Marcar como completado inmediatamente cuando llega al 100%
			if (processStatus.progress >= 100) {
				setShowCompleteAnimation(true);
			}
		} else if (isComplete) {
			setLastProgress(100);
			setShowCompleteAnimation(true);
		}

		// Limpiar estado de completado cuando no está reindexando
		if (!(isReindexing || isComplete)) {
			setShowCompleteAnimation(false);
		}
	}, [isReindexing, isComplete, processStatus, folderId, setLastProgress, setShowCompleteAnimation]);
}
