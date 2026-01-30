import type { ExtendedProcessStatus } from '../folder-types';

/**
 * Hook para determinar si un proceso está completado
 */
export function useIsCompleteStatus(
	processStatus: ExtendedProcessStatus | undefined,
	folderId: string | undefined,
	isProcessing: boolean
): boolean {
	if (!processStatus?.folderId) {
		return false;
	}

	if (!folderId) {
		return false;
	}

	return (
		(!isProcessing && processStatus.folderId === folderId && processStatus.phase === 'complete') ||
		(!isProcessing && processStatus.folderId === folderId && processStatus.progress === 100) ||
		(processStatus.phase === 'complete' && processStatus.folderId === folderId) ||
		(processStatus.progress === 100 && processStatus.phase === 'metadata' && processStatus.folderId === folderId)
	);
}
