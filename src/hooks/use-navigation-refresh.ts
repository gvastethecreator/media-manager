import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { folderKeys } from '@/lib/api/folders';
import { navigationKeys } from '@/lib/api/navigation';
import { clientLogger } from '@/lib/logger/client-logger';

const logger = clientLogger.withContext('NavigationRefresh');

interface FolderEvent {
	data?: unknown;
	timestamp?: number;
	type: string;
}

/**
 * Suscribe a SSE y refresca navegación al completar indexado
 */
export function useNavigationRefresh(): void {
	const qc = useQueryClient();
	const esRef = useRef<EventSource | null>(null);
	const reindexRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const isGlobalReindexingRef = useRef(false);

	useEffect(() => {
		// Proteger múltiples montajes
		if (esRef.current) return;

		const invalidateNavigationAndFolders = () => {
			qc.invalidateQueries({ queryKey: navigationKeys.data() });
			qc.invalidateQueries({ queryKey: navigationKeys.stats() });
			qc.invalidateQueries({ queryKey: folderKeys.tree() });
		};

		const startReindexRefresh = () => {
			if (reindexRefreshIntervalRef.current) {
				return;
			}

			reindexRefreshIntervalRef.current = setInterval(() => {
				logger.info('Refresh periódico de navegación y árbol durante reindexado');
				invalidateNavigationAndFolders();
			}, 30_000);
		};

		const stopReindexRefresh = () => {
			isGlobalReindexingRef.current = false;
			if (reindexRefreshIntervalRef.current) {
				clearInterval(reindexRefreshIntervalRef.current);
				reindexRefreshIntervalRef.current = null;
			}
		};

		const es = new EventSource('/api/events/stream', { withCredentials: false });
		esRef.current = es;

		const onConnected = (e: MessageEvent) => {
			logger.info('SSE conectado', { data: e.data });
		};

		const onHeartbeat = (_e: MessageEvent) => {
			// opcional: mantener viva la conexión
		};

		const onEvent = (e: MessageEvent) => {
			try {
				const payload: FolderEvent = JSON.parse(e.data);
				const t = payload.type;
				if (t === 'folder:reindexAll:start' || t === 'folder:reindexAll:progress') {
					isGlobalReindexingRef.current = true;
					startReindexRefresh();
				}
				if (t === 'folder:progress') {
					startReindexRefresh();
				}
				if (t === 'folder:complete' && !isGlobalReindexingRef.current) {
					logger.info('Evento de indexado completado recibido, invalidando navegación', { type: t });
					invalidateNavigationAndFolders();
					stopReindexRefresh();
				}
				if (t === 'folder:error' && !isGlobalReindexingRef.current) {
					logger.info('Evento de error de indexado recibido, invalidando navegación', { type: t });
					invalidateNavigationAndFolders();
					stopReindexRefresh();
				}
				if (t === 'folder:reindexAll:complete') {
					logger.info('Evento de indexado completado recibido, invalidando navegación', { type: t });
					invalidateNavigationAndFolders();
					stopReindexRefresh();
				}
			} catch (err) {
				logger.warn('No se pudo parsear evento SSE', { error: err instanceof Error ? err.message : String(err) });
			}
		};

		const onError = (e: Event) => {
			logger.warn('SSE error/disconnected, el navegador intentará reconectar', { type: (e as any).type });
		};

		es.addEventListener('connected', onConnected as EventListener);
		es.addEventListener('heartbeat', onHeartbeat as EventListener);
		es.addEventListener('event', onEvent as EventListener);
		es.addEventListener('error', onError as EventListener);

		return () => {
			stopReindexRefresh();
			es.removeEventListener('connected', onConnected as EventListener);
			es.removeEventListener('heartbeat', onHeartbeat as EventListener);
			es.removeEventListener('event', onEvent as EventListener);
			es.removeEventListener('error', onError as EventListener);
			es.close();
			esRef.current = null;
			logger.info('SSE cerrado');
		};
	}, [qc]);
}

export default useNavigationRefresh;
