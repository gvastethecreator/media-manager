'use client';

import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { LoadingScreen } from '@/components/core/feedback';
import { FileBrowser } from '@/components/features/file-browser/file-browser';
import BlurFade from '@/components/ui/blur-fade';
import { logger } from '@/lib/logger/logger';
import { useImageViewer } from '@/store/image-viewer.store';
import type { FileItem } from '@/types/file-item';
import { FolderIcon } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';
import { useContentView } from './content-view-provider';

const baseLogger = logger.withContext('BaseContentView');

export interface BaseContentViewProps {
	className?: string;
}

const getMetadata = (metadata: string | null) => {
	if (!metadata) {
		return null;
	}
	try {
		return JSON.parse(metadata);
	} catch {
		return null;
	}
};

export function BaseContentView({ className }: BaseContentViewProps) {
	const {
		items,
		isLoading,
		error,
		toggleItemSelection,
		currentContainerId,
		containerName,
		setCurrentContainer,
		emptyState = {},
	} = useContentView();

	const { openViewer } = useImageViewer();
	const initialLoadRef = useRef(false);
	const currentContainerIdRef = useRef(currentContainerId);

	// Efecto principal para cargar el contenedor
	useEffect(() => {
		// Si no hay ID o es el mismo que ya procesamos, no hacer nada
		if (!currentContainerId || currentContainerId === currentContainerIdRef.current || !setCurrentContainer) {
			return;
		}

		let mounted = true;
		currentContainerIdRef.current = currentContainerId;

		baseLogger.info('🔄 Iniciando carga de contenedor:', {
			id: currentContainerId,
			containerName,
			isInitialLoad: !initialLoadRef.current,
		});

		const loadContainer = async () => {
			try {
				await setCurrentContainer(currentContainerId);
				if (!mounted) {
					return;
				}

				initialLoadRef.current = true;

				baseLogger.info('✅ Contenedor cargado:', {
					id: currentContainerId,
					name: containerName,
					itemCount: items?.length || 0,
				});
			} catch (error) {
				if (!mounted) {
					return;
				}
				baseLogger.error('❌ Error al cargar contenedor:', {
					id: currentContainerId,
					error: error instanceof Error ? error.message : 'Error desconocido',
				});
			}
		};

		loadContainer();

		return () => {
			mounted = false;
		};
	}, [currentContainerId, containerName, items?.length, setCurrentContainer]);

	// Reset cuando se desmonta el componente
	useEffect(() => {
		return () => {
			initialLoadRef.current = false;
			currentContainerIdRef.current = null;
		};
	}, []);

	const handleItemClick = useCallback(
		(item: FileItem) => {
			if (toggleItemSelection) {
				toggleItemSelection(item, false);
			}
		},
		[toggleItemSelection]
	);

	const handleItemDoubleClick = useCallback(
		(item: FileItem) => {
			if (!items) {
				return;
			}

			const metadata = getMetadata(item.metadata);
			if (item.type === 'image' || metadata?.mimeType?.startsWith('image/')) {
				const imageItems = items.filter((i) => {
					const meta = getMetadata(i.metadata);
					return i.type === 'image' || meta?.mimeType?.startsWith('image/');
				});
				const currentIndex = imageItems.findIndex((i) => i.id === item.id);
				openViewer(imageItems, currentIndex);
			}
		},
		[items, openViewer]
	);

	if (error) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-destructive">Error: {error}</p>
			</div>
		);
	}

	if (!initialLoadRef.current && isLoading) {
		return <LoadingScreen />;
	}

	if (!items || items.length === 0) {
		return (
			<EmptyState
				icon={emptyState.icon || FolderIcon}
				title={emptyState.title || 'Contenedor vacío'}
				description={emptyState.description || `No se encontraron imágenes en ${containerName || 'este contenedor'}`}
			/>
		);
	}

	return (
		<div className={`h-full w-full flex overflow-hidden ${className || ''}`}>
			<div className="h-full w-full overflow-auto">
				<BlurFade className="h-full w-full overflow-auto" delay={0.5} inView={true}>
					<FileBrowser items={items} onItemClick={handleItemClick} onItemDoubleClick={handleItemDoubleClick} />
				</BlurFade>
			</div>
		</div>
	);
}
