import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadingScreen } from '@/components/core/feedback/loading/loading-screen';
import { FileBrowser } from '@/components/features/file-browser-new/file-browser';
import { type BrowserItem, toBrowserItem } from '@/components/features/file-browser-new/types/item.types';
import { clientLogger } from '@/lib/logger/client-logger';
import { useJsonFileStore } from '@/store/entities/json-file';
import type { ViewProps } from '../types';

const logger = clientLogger.withContext('JsonFilesView');

export function JsonFilesView(_props: ViewProps) {
	const navigate = useNavigate();
	const jsonFiles = useJsonFileStore((s) => s.jsonFiles);
	const loading = useJsonFileStore((s) => s.loading);
	const error = useJsonFileStore((s) => s.error);
	const fetchJsonFiles = useJsonFileStore((s) => s.fetchJsonFiles);

	const hasInitRef = useRef(false);
	const items = useMemo(() => jsonFiles || [], [jsonFiles]);
	const count = items.length;
	const browserItems = useMemo(
		() => items.map((it) => toBrowserItem(it as unknown as Record<string, unknown>)),
		[items]
	);

	useEffect(() => {
		if (!hasInitRef.current && count === 0 && !loading) {
			hasInitRef.current = true;
			logger.info('Cargando JSON files...');
			fetchJsonFiles();
		}
	}, [count, loading, fetchJsonFiles]);

	const handleClick = useCallback((item: BrowserItem) => {
		logger.info('Click en JSON', { id: item.id, name: item.name });
	}, []);

	const handleDoubleClick = useCallback(
		(item: BrowserItem) => {
			logger.info('Doble click en JSON', { id: item.id, name: item.name });
			navigate(`/json-files/${item.id}`);
		},
		[navigate]
	);

	if (loading && count === 0) {
		return <LoadingScreen message="Cargando archivos JSON..." />;
	}

	if (error) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="text-center">
					<h2 className="mb-2 font-semibold text-lg">Error al cargar archivos JSON</h2>
					<p className="mb-4 text-muted-foreground">Error: {error}</p>
					<button
						className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
						onClick={() => fetchJsonFiles()}
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
						<h2 className="truncate font-semibold text-foreground text-sm leading-tight">Archivos JSON</h2>
						<p className="truncate text-muted-foreground text-xs leading-tight">
							{count} {count === 1 ? 'archivo' : 'archivos'} JSON
						</p>
					</div>
				</div>
			</div>

			{/* FileBrowser para mostrar todos los archivos JSON */}
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

export default JsonFilesView;
