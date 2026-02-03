/**
 * 🎬 FILE VIEWER - LAYOUT CORREGIDO
 *
 * Estructura:
 * - Toolbar fijo arriba (~60px desde top)
 * - Área de contenido flexible (entre toolbar y carousel)
 * - Carousel fijo abajo (~104px desde bottom incluyendo margin)
 */

import type React from 'react';
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from '@/components/ui/animejs-shim';
import { Skeleton } from '@/components/ui/skeleton';
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

// Espacios reservados para elementos fijos
const TOOLBAR_SPACE = 80; // px desde top (toolbar + margen)
const CAROUSEL_SPACE = 140; // px desde bottom (carousel más ancho + margen)

// Componente principal del visor de archivos
export const FileViewer = memo(function FileViewerImpl({ triggerRef }: { triggerRef?: React.RefObject<HTMLElement> }) {
	// Store
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
	const contentAreaRef = useRef<HTMLDivElement>(null);

	// Imagen actual
	const currentImage = useMemo(() => images[currentIndex], [images, currentIndex]);

	// Hooks
	const {
		resetView,
		imageContainerRef,
		contentRef,
		handleZoomIn,
		handleZoomOut,
		handleMouseDown,
		handleMouseMove,
		handleMouseUp,
	} = useZoomPan(isOpen);

	const { urls, setUrls, isLoading, setIsLoading, loadImageUrl } = useImageLoader(images, currentIndex, isOpen);

	useFocusManagement(isOpen, closeButtonRef, dialogRef, triggerRef);

	const { handleCopy, handleDownload } = useToolbarActions(currentImage, urls, setUrls, loadImageUrl);

	// Handler de zoom para teclado
	// biome-ignore lint/correctness/useExhaustiveDependencies: ref-based zoom handler
	const handleZoom = useCallback((factor: number) => {
		if (!contentRef.current) return;
		const currentTransform = contentRef.current.style.transform;
		const match = currentTransform.match(/scale\(([^)]+)\)/);
		const currentScale = match ? Number.parseFloat(match[1]) : 1;
		const newScale = Math.min(Math.max(0.1, currentScale + factor), 8);
		contentRef.current.style.transform = currentTransform.replace(/scale\([^)]+\)/, `scale(${newScale})`);
	}, []);

	const { announceMessage } = useKeyboardNavigation(
		isOpen,
		images,
		currentIndex,
		onClose,
		nextItem,
		previousItem,
		() => {
			resetView();
		},
		handleZoom
	);

	// Cambiar imagen
	const handleSelectImage = useCallback(
		(index: number) => {
			setCurrentIndex(index);
			resetView();
		},
		[setCurrentIndex, resetView]
	);

	// Validar imágenes
	useEffect(() => {
		if (!images?.length) {
			setIsLoading(false);
		}
	}, [images, setIsLoading]);

	// Reset al abrir
	useEffect(() => {
		if (isOpen) {
			resetView();
			setIsLoading(true);
		}
	}, [isOpen, resetView, setIsLoading]);

	// Clases memoizadas
	const dialogClassName = useMemo(
		() =>
			cn(
				'fixed inset-0 z-9999 m-0 flex h-screen w-screen flex-col overflow-hidden bg-black/95 p-0 backdrop-blur-md',
				isOpen ? 'flex' : 'hidden'
			),
		[isOpen]
	);

	if (!images.length) return null;

	return (
		<dialog
			aria-modal="true"
			className={dialogClassName}
			onClick={(e) => e.target === e.currentTarget && onClose()}
			onKeyDown={(e) => e.key === 'Escape' && onClose()}
			open={isOpen}
			ref={dialogRef}
		>
			{/* Aria live */}
			<div aria-live="polite" className="sr-only">
				{announceMessage}
			</div>

			{/* Toolbar Fijo - Zona Superior */}
			<div className="absolute top-0 right-0 left-0 z-[100] h-[60px] shrink-0">
				<div className="flex h-full items-center justify-between px-4 py-3">
					<ToolbarActions
						closeButtonRef={closeButtonRef}
						onClose={onClose}
						onCopy={handleCopy}
						onDownload={handleDownload}
						onReset={resetView}
						onZoomIn={handleZoomIn}
						onZoomOut={handleZoomOut}
					/>
				</div>
			</div>

			{/* Área de Contenido Principal - Entre toolbar y carousel */}
			<div
				className="relative m-4 flex-1 overflow-hidden rounded-2xl border border-border/20 bg-background/40 shadow-inner backdrop-blur-sm"
				style={{
					marginTop: TOOLBAR_SPACE,
					marginBottom: CAROUSEL_SPACE,
				}}
			>
				<div
					className="relative flex h-full w-full cursor-grab select-none flex-col items-center justify-center active:cursor-grabbing"
					onDoubleClick={resetView}
					onMouseDown={(e) => {
						if ((e.target as HTMLElement).closest('[data-no-drag]')) return;
						handleMouseDown(e);
					}}
					onMouseLeave={handleMouseUp}
					onMouseMove={(e) => {
						if ((e.target as HTMLElement).closest('[data-no-drag]')) return;
						handleMouseMove(e);
					}}
					onMouseUp={handleMouseUp}
					ref={imageContainerRef}
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
											transition={{ duration: 0.8, type: 'tween' }}
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
													src={urls[currentImage.id]}
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
							<div className="h-full w-full" ref={contentRef} style={{ transform: 'translate(0px, 0px) scale(1)' }}>
								<FileContentRenderer
									contentUrl={urls[currentImage.id]}
									isLoading={false}
									item={currentImage}
									onError={() => setIsLoading(false)}
									onLoad={() => setIsLoading(false)}
								/>
							</div>
						)}

						{!isLoading && (!currentImage || (currentImage && !urls[currentImage.id])) && (
							<div className="flex h-full items-center justify-center text-center text-muted-foreground">
								<p>Error al cargar el archivo</p>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Carousel Fijo - Zona Inferior */}
			<div className="absolute right-0 bottom-0 left-0 z-[100] flex h-[100px] shrink-0 items-center justify-center pb-4">
				<ThumbnailNavigation currentIndex={currentIndex} images={images} onSelectImage={handleSelectImage} />
			</div>

			{/* Hints */}
			<div className="pointer-events-none fixed bottom-[120px] left-4 z-50 text-white/60 text-xs">
				<p>Flechas: navegar · Rueda: zoom · Arrastrar: mover</p>
				<p>ESC: cerrar · R: restablecer</p>
			</div>
		</dialog>
	);
});

export default FileViewer;
