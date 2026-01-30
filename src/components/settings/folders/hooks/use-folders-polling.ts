// Polling legado deshabilitado: la app usa SSE para estado en tiempo real.
// Este stub evita errores de importación y reduce complejidad a cero.

export interface UsePollingOptions {
	onStatusUpdate: (status: unknown) => void;
	onComplete: (folderId: string) => void;
}

export function useFoldersPolling(_: UsePollingOptions) {
	return {
		isPolling: false,
		currentFolder: null as string | null,
		startPolling: (folderId: string) => {
			// no-op: reference param to avoid unused warnings
			const __tmp = String(folderId);
			/* noop use */
			__tmp.length;
		},
		stopPolling: () => {
			// no-op
		},
	};
}
