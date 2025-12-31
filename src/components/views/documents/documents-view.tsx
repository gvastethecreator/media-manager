import { useCallback, useEffect, useMemo, useRef } from 'react';
import { LoadingScreen } from '@/components/core/feedback';
import { type BrowserItem, FileBrowser, toBrowserItem } from '@/components/features/file-browser-new';
import { clientLogger } from '@/lib/logger/client-logger';
import { useDocumentStore } from '@/store/entities/document';
import type { ViewProps } from '../types';

const logger = clientLogger.withContext('DocumentsView');

export default function DocumentsView(_props: ViewProps) {
	const documentsRecord = useDocumentStore((s) => s.documents);
	const isLoading = useDocumentStore((s) => s.isLoading);
	const error = useDocumentStore((s) => s.error);
	const fetchDocuments = useDocumentStore((s) => s.fetchDocuments);

	const hasInitRef = useRef(false);

	const documents = useMemo(() => Object.values(documentsRecord || {}), [documentsRecord]);
	const count = documents.length;
	const browserItems = useMemo(
		() => documents.map((d) => toBrowserItem(d as unknown as Record<string, unknown>)),
		[documents]
	);

	useEffect(() => {
		if (!hasInitRef.current && count === 0 && !isLoading) {
			hasInitRef.current = true;
			logger.info('Cargando documentos...');
			fetchDocuments();
		}
	}, [count, isLoading, fetchDocuments]);

	const handleClick = useCallback((item: BrowserItem) => {
		logger.info('Click en documento', { id: item.id, name: item.name });
	}, []);

	const handleDoubleClick = useCallback((item: BrowserItem) => {
		// Por ahora, no abrimos visor específico; se podría integrar un viewer de documentos
		logger.info('Doble click en documento', { id: item.id, name: item.name });
	}, []);

	if (isLoading && count === 0) {
		return <LoadingScreen message="Cargando documentos..." />;
	}

	if (error) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="text-center">
					<h2 className="mb-2 font-semibold text-lg">Error al cargar documentos</h2>
					<p className="mb-4 text-muted-foreground">Error: {error}</p>
					<button
						className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
						onClick={() => fetchDocuments()}
						type="button"
					>
						Intentar de nuevo
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="h-full">
			{/* Toolbar con controles superiores */}
			<div className="flex items-center justify-between gap-3 border-border border-b bg-background/40 px-3 py-2 backdrop-blur-sm">
				<div className="flex min-w-0 items-center gap-3">
					<div className="min-w-0">
						<h2 className="truncate font-semibold text-foreground text-sm leading-tight">Documentos</h2>
						<p className="truncate text-muted-foreground text-xs leading-tight">
							{count} {count === 1 ? 'documento' : 'documentos'}
						</p>
					</div>
				</div>
			</div>

			{/* FileBrowser para mostrar todos los documentos */}
			<div className="min-h-0 flex-1 overflow-hidden">
				<FileBrowser
					className="h-full"
					items={browserItems}
					onItemClick={handleClick}
					onItemDoubleClick={handleDoubleClick}
				/>
			</div>
		</div>
	);
}
