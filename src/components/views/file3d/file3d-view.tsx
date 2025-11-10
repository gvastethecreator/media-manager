import { useCallback, useEffect, useMemo, useRef } from 'react';
import { FileBrowser } from '@/components/features/file-browser/file-browser';
import { useEntitySelection } from '@/hooks/use-entity-selection';
import { clientLogger } from '@/lib/logger/client-logger';
import { useFile3DStore } from '@/store/entities/file-3d';
import type { AnyEntityWithStats } from '@/types/entities';
import type { ViewProps } from '../types';

const logger = clientLogger.withContext('File3DView');

export default function File3DView(_props: ViewProps) {
	const file3Ds = useFile3DStore((s) => s.file3Ds);
	const loading = useFile3DStore((s) => s.loading);
	const error = useFile3DStore((s) => s.error);
	const fetchFile3Ds = useFile3DStore((s) => s.fetchFile3Ds);

	const hasInitRef = useRef(false);
	const items = useMemo(() => file3Ds || [], [file3Ds]);
	const count = items.length;

	useEffect(() => {
		if (!hasInitRef.current && count === 0 && !loading) {
			hasInitRef.current = true;
			logger.info('Cargando archivos 3D...');
			fetchFile3Ds();
		}
	}, [count, loading, fetchFile3Ds]);

	const { handleItemClick: updateSelection } = useEntitySelection();

	const handleClick = useCallback(
		(item: AnyEntityWithStats) => {
			logger.info('Click en 3D', { id: item.id, name: item.name });
			updateSelection(item);
		},
		[updateSelection]
	);

	const handleDoubleClick = useCallback((item: AnyEntityWithStats) => {
		logger.info('Doble click en 3D', { id: item.id, name: item.name });
		// TODO: Abrir visor 3D específico o mostrar información del modelo
	}, []);

	if (error) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="text-center">
					<h2 className="mb-2 font-semibold text-lg">Error al cargar archivos 3D</h2>
					<p className="mb-4 text-muted-foreground">Error: {error}</p>
					<button
						className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
						onClick={() => fetchFile3Ds()}
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
						<h2 className="truncate font-semibold text-foreground text-sm leading-tight">Archivos 3D</h2>
						<p className="truncate text-muted-foreground text-xs leading-tight">
							{count} {count === 1 ? 'archivo' : 'archivos'} 3D
						</p>
					</div>
				</div>
			</div>

			{/* FileBrowser para mostrar todos los archivos 3D */}
			<div className="min-h-0 flex-1 overflow-hidden">
				<FileBrowser
					className="h-full"
					isLoading={loading}
					items={items as unknown as AnyEntityWithStats[]}
					onItemClick={handleClick}
					onItemDoubleClick={handleDoubleClick}
				/>
			</div>
		</div>
	);
}
