import type { ExtendedProcessStatus } from '../folder-types';

/**
 * Determina si una carpeta debe considerarse todavía "reindexando".
 * Evita que la tarjeta quede congelada mostrando "Procesando" tras completarse.
 */
export function computeIsReindexing(params: {
	folderId: string;
	processStatus: ExtendedProcessStatus | undefined;
	isGloballyProcessing: boolean;
	globalCurrentFolderId: string | null | undefined;
	isProcessingFlag: boolean;
}): boolean {
	const { folderId, processStatus, isGloballyProcessing, globalCurrentFolderId, isProcessingFlag } = params;

	if (processStatus?.folderId === folderId) {
		const finished =
			processStatus.isProcessing === false &&
			(processStatus.status === 'completed' || processStatus.phase === 'complete' || processStatus.progress === 100);
		if (finished) {
			return false;
		}
		return Boolean(processStatus.isProcessing);
	}

	if (isGloballyProcessing) {
		return globalCurrentFolderId === folderId;
	}

	if (processStatus?.folderId === folderId && isProcessingFlag) {
		return true;
	}

	return false;
}
