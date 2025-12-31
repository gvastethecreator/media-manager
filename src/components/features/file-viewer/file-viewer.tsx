/**
 * 🎬 FILE VIEWER - COMPONENTE PRINCIPAL REFACTORIZADO
 *
 * Visor de archivos con navegación, zoom y modo multi-capa
 */

import type React from 'react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from '@/components/ui/motion-shim';
import { Skeleton } from '@/components/ui/skeleton';
import { clientLogger } from '@/lib/logger/client-logger';
import { cn } from '@/lib/utils';
import { useFileViewerStore } from '@/store/ui/file-viewer.slice';
import { FileContentRenderer } from './file-content-renderer';
import { ThumbnailNavigation } from './thumbnail-navigation';
import { ToolbarActions } from './toolbar-actions';
import { useFocusManagement } from './use-focus-management';
import { useImageLoader } from './use-image-loader';
import { useKeyboardNavigation } from './use-keyboard-navigation';
import { useToolbarActions } from './use-toolbar-actions';
import { useZoomPan } from './use-zoom-pan';
import type { PaneState } from './file-viewer.types';

// Componente principal del visor de archivos - memoizado
export const FileViewer = memo(function FileViewerImpl({ triggerRef }: { triggerRef?: React.RefObject<HTMLElement> }) {
	// Usar el store en lugar de props
	const {
		isOpen,
		items: images,
		currentIndex,
		closeViewer: onClose,
		setCurrentIndex,
		nextItem,
		previousItem,
	} = useFileViewerStore();

	const constraintsRef = useRef<HTMLDivElement>(null);
	const closeButtonRef = useRef<HTMLButtonElement>(null);
	const dialogRef = useRef<HTMLDialogElement>(null);

	// Memoizar la imagen actual
	const currentImage = useMemo(() => images[currentIndex], [images, currentIndex]);

	// Custom hooks
	const {
		resetView,
		scale,
		position,
		imageContainerRef,
		handleZoom,
		handleZoomIn,
		handleZoomOut,
		handleMouseDown,
		handleMouseMove,
		handleMouseUp,
	} = useZoomPan(isOpen);

	const { urls, setUrls, isLoading, setIsLoading, loadImageUrl } = useImageLoader(images, currentIndex, isOpen);

	useFocusManagement(isOpen, closeButtonRef, dialogRef, triggerRef);

	const { handleCopy, handleDownload } = useToolbarActions(currentImage, urls, setUrls, loadImageUrl);

	const { announceMessage } = useKeyboardNavigation(
		isOpen,
		images,
		currentIndex,
		onClose,
		nextItem,
		previousItem,
		resetView,
		handleZoom
	);

	// Validate images and index
	useEffect(() => {
		if (!images?.length) {
			setIsLoading(false);
			return;
		}
		if (currentIndex < 0 || currentIndex >= images.length) {
			setCurrentIndex(0);
		}
	}, [images, currentIndex, setCurrentIndex, setIsLoading]);

	// Reset state when opening viewer (respetar índice actual del store)
	useEffect(() => {
		if (isOpen) {
			resetView();
			setIsLoading(true);
		}
	}, [isOpen, resetView, setIsLoading]);

	// Memoizar la clase del dialog
	const dialogClassName = useMemo(
		() =>
			cn(
				'fixed inset-0 z-9999 m-0 flex h-full w-full flex-col items-center justify-center bg-black/90 p-0 backdrop-blur-md',
				isOpen ? 'flex' : 'hidden'
			),
		[isOpen]
	);

	// Función para seleccionar una imagen específica
	const handleSelectImage = useCallback(
		(index: number) => {
			setCurrentIndex(index);
			resetView();
		},
		[setCurrentIndex, resetView]
	);

	// -------- MODO MULTI-LAYER (capas superpuestas) --------
	const [paneOrder, setPaneOrder] = useState<string[]>([]);
	const [paneState, setPaneState] = useState<Record<string, PaneState>>({});
	const canvasRef = useRef<HTMLDivElement>(null);

	// Inicializar orden y estado por capa cuando cambia la lista de imágenes
	useEffect(() => {
		const ids = images.map((img) => img.id);
		setPaneOrder(ids);
		setPaneState((prev) => {
			const nextState: Record<string, PaneState> = { ...prev };
			const centerOffset = (ids.length - 1) / 2;
			ids.forEach((id, idx) => {
				if (!nextState[id]) {
					nextState[id] = { scale: 1, x: (idx - centerOffset) * 60, y: 0 };
				}
			});
			// Limpiar ids que ya no están
			for (const key of Object.keys(nextState)) {
				if (!ids.includes(key)) delete nextState[key];
			}
			return nextState;
		});
	}, [images]);

	// Wheel zoom por capa
	const handlePaneWheel = useCallback((id: string, e: React.WheelEvent) => {
		e.preventDefault();
		const zoomFactor = 0.1;
		setPaneState((prev) => {
			const cur = prev[id] || { scale: 1, x: 0, y: 0 };
			const newScale = Math.min(Math.max(0.1, cur.scale * (1 - Math.sign(e.deltaY) * zoomFactor)), 8);
			return { ...prev, [id]: { ...cur, scale: newScale } };
		});
	}, []);

	// Pan por capa (drag de la imagen)
	const onPaneDrag = useCallback((id: string, _event: any, info: { delta: { x: number; y: number } }) => {
		setPaneState((prev) => {
			const cur = prev[id] || { scale: 1, x: 0, y: 0 };
			const next = { ...cur, x: cur.x + info.delta.x, y: cur.y + info.delta.y };
			// Clamp suave a los límites del canvas
			const rect = canvasRef.current?.getBoundingClientRect();
			if (rect) {
				const maxX = rect.width / 2;
				const maxY = rect.height / 2;
				next.x = Math.max(-maxX, Math.min(maxX, next.x));
				next.y = Math.max(-maxY, Math.min(maxY, next.y));
			}
			return { ...prev, [id]: next };
		});
	}, []);

	const resetPane = useCallback((id: string) => {
		setPaneState((prev) => ({ ...prev, [id]: { scale: 1, x: 0, y: 0 } }));
	}, []);

	const MultiPaneOverlay = (
		// biome-ignore lint/a11y/noNoninteractiveElementInteractions: Backdrop del modal (click/teclado para cerrar)
		<div
			aria-modal="true"
			className={cn(
				'fixed inset-0 z-9999 m-0 flex h-full w-full flex-col bg-black/90 p-3 backdrop-blur-md',
				isOpen ? 'flex' : 'hidden'
			)}
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
			onKeyDown={(e) => {
				if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) {
					onClose();
				}
			}}
			role="dialog"
		>
			{/* Región aria-live para anuncios */}
			<div aria-live="polite" className="sr-only">
				{announceMessage}
			</div>
			{/* Controles superiores consistentes */}
			<ToolbarActions
				closeButtonRef={closeButtonRef}
				onClose={onClose}
				onCopy={handleCopy}
				onDownload={handleDownload}
				onReset={() =>
					setPaneState((prev) => {
						const next: Record<string, { scale: number; x: number; y: number }> = { ...prev };
						for (const id of Object.keys(next)) {
							next[id] = { scale: 1, x: 0, y: 0 };
						}
						return next;
					})
				}
				onZoomIn={() =>
					setPaneState((prev) => {
						const next: Record<string, { scale: number; x: number; y: number }> = { ...prev };
						for (const id of Object.keys(next)) {
							next[id] = { ...next[id], scale: Math.min(8, (next[id]?.scale ?? 1) + 0.2) };
						}
						return next;
					})
				}
				onZoomOut={() =>
					setPaneState((prev) => {
						const next: Record<string, { scale: number; x: number; y: number }> = { ...prev };
						for (const id of Object.keys(next)) {
							next[id] = { ...next[id], scale: Math.max(0.1, (next[id]?.scale ?? 1) - 0.2) };
						}
						return next;
					})
				}
			/>

			{/* Canvas central de capas */}
			<div className="relative w-full flex-1">
				<div className="absolute inset-0 overflow-hidden" ref={canvasRef}>
					{paneOrder.map((id, z) => {
						const img = images.find((p) => p.id === id);
						if (!img) return null;
						const st = paneState[id] || { scale: 1, x: 0, y: 0 };
						const url = urls[id];
						return (
							<motion.div
								animate={{ opacity: 1 }}
								className="absolute inset-0 flex items-center justify-center"
								drag
								dragConstraints={canvasRef}
								key={id}
								onDoubleClick={() => resetPane(id)}
								onDrag={((e: any, info: any) => onPaneDrag(id, e, info)) as any}
								onWheel={(e) => handlePaneWheel(id, e)}
								style={{
									transform: `translate(${st.x}px, ${st.y}px) scale(${st.scale})`,
									zIndex: z + 1,
								}}
								transition={{ type: 'spring', stiffness: 300, damping: 30 }}
							>
								{/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: onError es válido para img */}
								<img
									alt={img.name}
									className="max-h-full max-w-full object-contain"
									height={img.height ?? img.parsedMetadata?.dimensions?.height ?? 1}
									onError={() => clientLogger.error('Error cargando capa', id)}
									src={url}
									width={img.width ?? img.parsedMetadata?.dimensions?.width ?? 1}
								/>
							</motion.div>
						);
					})}
				</div>
			</div>

			{/* Sugerencias de navegación */}
			<div className="pointer-events-none absolute bottom-4 left-4 max-w-75 select-none text-caption text-muted-foreground/60">
				<p>Rueda: zoom • Arrastrar: mover • Doble clic: reset capa</p>
				<p>ESC: cerrar</p>
			</div>
		</div>
	);

	// -------- FIN MODO MULTI-PANEL --------

	const viewerContent = (
		// biome-ignore lint/a11y/noNoninteractiveElementInteractions: dialog maneja click/teclado para cerrar sobre el backdrop
		<dialog
			aria-modal="true"
			className={dialogClassName}
			onClick={(e) => {
				if (e.target === e.currentTarget) {
					onClose();
				}
			}}
			onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					const target = e.target as HTMLElement;
					if (target === e.currentTarget) onClose();
				}
				if (e.key === 'Escape') onClose();
			}}
			open={isOpen}
			ref={dialogRef}
		>
			{/* biome-ignore lint/a11y/noStaticElementInteractions: superficie interactiva (drag/zoom) */}
			{/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: superficie interactiva (drag/zoom) */}
			<div
				className="relative flex h-full w-full cursor-grab select-none flex-col items-center justify-center active:cursor-grabbing"
				onDoubleClick={resetView}
				onMouseDown={handleMouseDown}
				onMouseLeave={handleMouseUp}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				ref={imageContainerRef}
			>
				{/* Región aria-live para anuncios */}
				<div aria-live="polite" className="sr-only">
					{announceMessage}
				</div>
				{/* Toolbar */}
				<ToolbarActions
					closeButtonRef={closeButtonRef}
					onClose={onClose}
					onCopy={handleCopy}
					onDownload={handleDownload}
					onReset={resetView}
					onZoomIn={handleZoomIn}
					onZoomOut={handleZoomOut}
				/>

				{/* Main Image Container */}
				<motion.div
					animate={{ opacity: 1 }}
					className="absolute inset-0 flex items-center justify-center"
					exit={{ opacity: 0 }}
					initial={{ opacity: 0 }}
					key={currentImage?.id || 'no-image'}
					transition={{ duration: 0.3 }}
				>
					<div className="relative flex h-full w-full items-center justify-center overflow-hidden" ref={constraintsRef}>
						<AnimatePresence mode="wait">
							{isLoading && (
								<motion.div
									animate={{ opacity: 1 }}
									className="absolute inset-0 flex items-center justify-center"
									exit={{ opacity: 0 }}
									initial={{ opacity: 0 }}
									transition={{ duration: 0.3 }}
								>
									{currentImage && urls[currentImage.id] ? (
										<motion.div
											animate={{ opacity: 1, filter: 'blur(3px)' }}
											className="absolute inset-0 flex items-center justify-center"
											exit={{ opacity: 0, filter: 'blur(0px)' }}
											initial={{ opacity: 0, filter: 'blur(10px)' }}
											transition={{
												duration: 0.8,
												type: 'tween',
											}}
										>
											<motion.div
												animate={{ scale: 1 }}
												className="h-full w-full object-contain"
												exit={{ scale: 1 }}
												initial={{ scale: 1.1 }}
												transition={{ duration: 0.5 }}
											>
												<img
													alt="Loading preview"
													className="h-full w-full object-contain"
													height={currentImage.height ?? currentImage.parsedMetadata?.dimensions?.height ?? 1}
													src={urls[currentImage.id]}
													width={currentImage.width ?? currentImage.parsedMetadata?.dimensions?.width ?? 1}
												/>
											</motion.div>
										</motion.div>
									) : (
										<Skeleton className="h-full w-full" />
									)}
								</motion.div>
							)}
						</AnimatePresence>

						{!isLoading && currentImage && urls[currentImage.id] && (
							<FileContentRenderer
								contentUrl={urls[currentImage.id]}
								isLoading={false}
								item={currentImage}
								onError={() => setIsLoading(false)}
								onLoad={() => setIsLoading(false)}
								transformStyle={{
									transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
								}}
							/>
						)}

						{!isLoading && (!currentImage || (currentImage && !urls[currentImage.id])) && (
							<div className="absolute inset-0 flex items-center justify-center text-center text-muted-foreground">
								<p>Error al cargar el archivo</p>
							</div>
						)}
					</div>
				</motion.div>

				{/* Thumbnails */}
				<ThumbnailNavigation currentIndex={currentIndex} images={images} onSelectImage={handleSelectImage} />

				{/* Navigation hints */}
				<div className="pointer-events-none fixed bottom-4 left-4 max-w-75 select-none text-caption text-muted-foreground/60">
					<p>Flechas: navegar • Rueda: zoom • Arrastrar: mover</p>
					<p>ESC: cerrar • R: restablecer • +/-: zoom</p>
				</div>
			</div>
		</dialog>
	);

	// No renderizar nada si no hay imágenes o el visor está cerrado
	if (!(isOpen && images?.length)) {
		return null;
	}

	// Mostrar siempre visor de una sola imagen con navegación por miniaturas

	// Para modo de una sola imagen, verificar que currentImage esté disponible
	if (!currentImage) {
		return null;
	}

	// Modo de una sola imagen (visor clásico)
	return viewerContent;
});

// (Pane eliminado: usamos capas superpuestas en el canvas)
