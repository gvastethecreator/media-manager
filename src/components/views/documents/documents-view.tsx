import { useCallback, useEffect, useMemo, useRef } from 'react';
import { FileBrowser } from '@/components/features/file-browser/file-browser';
import { useEntitySelection } from '@/hooks/use-entity-selection';
import { clientLogger } from '@/lib/logger/client-logger';
import { useDocumentStore } from '@/store/entities/document';
import type { AnyEntityWithStats } from '@/types/entities';
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

	useEffect(() => {
		if (!hasInitRef.current && count === 0 && !isLoading) {
			hasInitRef.current = true;
			logger.info('Cargando documentos...');
			fetchDocuments();
		}
	}, [count, isLoading, fetchDocuments]);

	const { handleItemClick: updateSelection } = useEntitySelection();

	const handleClick = useCallback(
		(item: AnyEntityWithStats) => {
			logger.info('Click en documento', { id: item.id, name: item.name });
			updateSelection(item);
		},
		[updateSelection]
	);

	const handleDoubleClick = useCallback((item: AnyEntityWithStats) => {
		// Por ahora, no abrimos visor específico; se podría integrar un viewer de documentos
		logger.info('Doble click en documento', { id: item.id, name: item.name });
	}, []);

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
					isLoading={isLoading}
					items={documents as unknown as AnyEntityWithStats[]}
					onItemClick={handleClick}
					onItemDoubleClick={handleDoubleClick}
				/>
			</div>
		</div>
	);
}
