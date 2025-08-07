import { useEffect } from 'react';
import type { ExtendedProcessStatus } from '../folder-types';

/**
 * Hook para trackear el progreso de procesamiento
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

			if (processStatus.progress >= 100) {
				setShowCompleteAnimation(true);

				const timer = setTimeout(() => {
					setShowCompleteAnimation(false);
				}, 3000);

				return () => clearTimeout(timer);
			}
		} else if (isComplete) {
			setLastProgress(100);
			setShowCompleteAnimation(true);

			const timer = setTimeout(() => {
				setShowCompleteAnimation(false);
			}, 3000);

			return () => clearTimeout(timer);
		}

		if (!(isReindexing || isComplete)) {
			setShowCompleteAnimation(false);
		}
	}, [isReindexing, isComplete, processStatus, folderId, setLastProgress, setShowCompleteAnimation]);
}
