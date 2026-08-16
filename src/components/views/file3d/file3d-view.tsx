import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadingScreen } from '@/components/core/feedback/loading/loading-screen';
import { FileBrowser } from '@/components/features/file-browser-new/file-browser';
import { type BrowserItem, toBrowserItem } from '@/components/features/file-browser-new/types/item.types';
import { clientLogger } from '@/lib/logger/client-logger';
import { useFile3DStore } from '@/store/entities/file-3d';
import type { ViewProps } from '../types';

const logger = clientLogger.withContext('File3DView');

export default function File3DView(_props: ViewProps) {
	const navigate = useNavigate();
	const file3Ds = useFile3DStore((s) => s.file3Ds);
	const loading = useFile3DStore((s) => s.loading);
	const error = useFile3DStore((s) => s.error);
	const fetchFile3Ds = useFile3DStore((s) => s.fetchFile3Ds);

	const hasInitRef = useRef(false);
	const items = useMemo(() => file3Ds || [], [file3Ds]);
	const count = items.length;
	const browserItems = useMemo(
		() => items.map((it) => toBrowserItem(it as unknown as Record<string, unknown>)),
		[items]
	);

	useEffect(() => {
		if (!hasInitRef.current && count === 0 && !loading) {
			hasInitRef.current = true;
			logger.info('Loading 3D files...');
			fetchFile3Ds();
		}
	}, [count, loading, fetchFile3Ds]);

	const handleClick = useCallback((item: BrowserItem) => {
		logger.info('Click en 3D', { id: item.id, name: item.name });
	}, []);

	const handleDoubleClick = useCallback(
		(item: BrowserItem) => {
			logger.info('Doble click en 3D', { id: item.id, name: item.name });
			navigate(`/file3d/${item.id}`);
		},
		[navigate]
	);

	if (loading && count === 0) {
		return <LoadingScreen message="Loading 3D files..." />;
	}

	if (error) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="text-center">
					<h2 className="mb-2 font-semibold text-lg">Could not load 3D files</h2>
					<p className="mb-4 text-muted-foreground">Error: {error}</p>
					<button
						className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
						onClick={() => fetchFile3Ds()}
						type="button"
					>
						Try again
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
						<h2 className="truncate font-semibold text-foreground text-sm leading-tight">3D Files</h2>
						<p className="truncate text-muted-foreground text-xs leading-tight">
							{count} {count === 1 ? 'file' : 'files'} 3D
						</p>
					</div>
				</div>
			</div>

			{/* FileBrowser para mostrar todos los files 3D */}
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
