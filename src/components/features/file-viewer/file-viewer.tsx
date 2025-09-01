import { Copy, Download, Image as ImageIcon, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react';
import { AnimatePresence, motion } from '@/components/ui/motion-shim';
import type React from 'react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toastService } from '@/lib/ui/toast';
import { cn } from '@/lib/utils';
import { useImageResources } from '@/store/image-resources.store';
import { useFileViewerStore } from '@/store/ui/file-viewer.slice';

export interface ImageItem {
	id: string;
	name: string;
	type: string;
	path: string;
	size: number;
	width: number | null;
	height: number | null;
	url?: string;
	thumbnail: string | null;
	thumbnailUrl?: string;
	src?: string;
	alt?: string;
	mimeType?: string;
	metadata: string | null;
	parsedMetadata?: {
		dimensions?: {
			width: number;
			height: number;
		};
		mimeType?: string;
		isLocal?: boolean;
	};
}

const THUMBNAIL_ANIMATION = {
	duration: 0.2,
};

// Tamaños para thumbnails (normal y activo)
const THUMBNAIL_SIZES = {
	normal: { width: 56, height: 56 },
	active: { width: 64, height: 64 },
};

// Función auxiliar memoizada
const isValidSrc = (src: string | null): src is string => {
	return Boolean(src) && typeof src === 'string' && src.trim() !== '';
};

// Componente de miniaturas memoizado
const ThumbnailItem = memo(function ThumbnailItemImpl({
	image,
	isActive,
	onClick,
}: {
	image: ImageItem;
	isActive: boolean;
	onClick: () => void;
}) {
	const imageResources = useImageResources();
	const [error, setError] = useState(false);
	const [thumbnail, setThumbnail] = useState<string | null>(null);

	// Obtener la miniatura de forma optimizada
	useEffect(() => {
		const resource = imageResources.resources.get(image.id);
		const thumbnailUrl = image.thumbnail || resource?.thumbnail || null;

		if (thumbnailUrl !== thumbnail) {
			setThumbnail(thumbnailUrl);
		}

		// Resetear error si conseguimos thumbnail
		if (thumbnailUrl && error) setError(false);
	}, [image.id, image.thumbnail, imageResources.resources, thumbnail, error]);

	// Memoizar la clase base
	const baseClassName = useMemo(
		() =>
			cn(
				'relative mr-2 cursor-pointer overflow-hidden rounded-md',
				isActive ? 'ring-2 ring-primary' : 'hover:ring-1 hover:ring-primary/50'
			),
		[isActive]
	);

	// Renderizado condicional memoizado
	const thumbnailContent = useMemo(() => {
		if (error || !thumbnail) {
			return (
				<div className="flex h-full w-full items-center justify-center bg-muted">
					<ImageIcon className="h-6 w-6 text-muted-foreground/50" />
				</div>
			);
		}

		return (
			<div className="h-full w-full">
				{isValidSrc(thumbnail) ? (
					<img
						alt={image.name}
						className="h-full w-full object-cover"
						loading="lazy"
						src={thumbnail}
						onError={() => setError(true)}
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center bg-muted">
						<ImageIcon className="h-6 w-6 text-muted-foreground/50" />
					</div>
				)}
			</div>
		);
	}, [error, thumbnail, image.name]);

	// Memoizar los estilos de animación
	const animateStyles = useMemo(
		() => ({
			scale: isActive ? 1.07 : 1,
			opacity: isActive ? 1 : 0.9,
		}),
		[isActive]
	);

	return (
		<motion.div
			layout
			animate={animateStyles}
			className={baseClassName}
			onClick={onClick}
			transition={{ type: 'spring', stiffness: 260, damping: 24, mass: 0.6 }}
			whileHover={{ opacity: 1, scale: 1.05 }}
			whileTap={{ scale: 0.98 }}
			style={{ width: THUMBNAIL_SIZES.normal.width, height: THUMBNAIL_SIZES.normal.height }}
		>
			{thumbnailContent}
			{isActive && (
				<motion.div
					layout
					animate={{ opacity: 1 }}
					className="pointer-events-none absolute inset-0 bg-primary/10"
					initial={{ opacity: 0 }}
					transition={{ duration: 0.25 }}
				/>
			)}
		</motion.div>
	);
});

// Componente de acciones de la barra de herramientas
const ToolbarActions = memo(function ToolbarActionsImpl({
	onZoomIn,
	onZoomOut,
	onReset,
	onCopy,
	onDownload,
	onClose,
	closeButtonRef,
}: {
	onZoomIn: () => void;
	onZoomOut: () => void;
	onReset: () => void;
	onCopy: () => void;
	onDownload: () => void;
	onClose: () => void;
	closeButtonRef?: React.RefObject<HTMLButtonElement | null>;
}) {
	return (
		<div className="fixed inset-x-4 top-4 z-[9999] flex items-center justify-between">
			<div className="flex space-x-2">
				<Button onClick={onZoomIn} size="icon" title="Acercar" variant="outline">
					<ZoomIn className="h-4 w-4" />
				</Button>
				<Button onClick={onZoomOut} size="icon" title="Alejar" variant="outline">
					<ZoomOut className="h-4 w-4" />
				</Button>
				<Button onClick={onReset} size="icon" title="Restablecer vista" variant="outline">
					<RotateCcw className="h-4 w-4" />
				</Button>
				<Button onClick={onCopy} size="icon" title="Copiar" variant="outline">
					<Copy className="h-4 w-4" />
				</Button>
				<Button onClick={onDownload} size="icon" title="Descargar" variant="outline">
					<Download className="h-4 w-4" />
				</Button>
			</div>

			<Button onClick={onClose} ref={closeButtonRef} size="icon" title="Cerrar" variant="outline">
				<X className="h-4 w-4" />
			</Button>
		</div>
	);
});

// Componente de navegación de miniaturas
const ThumbnailNavigationImpl = memo(function ThumbnailNavigationInner({
	images,
	currentIndex,
	onSelectImage,
}: {
	images: ImageItem[];
	currentIndex: number;
	onSelectImage: (index: number) => void;
}) {
	// Mostrar anteriores 5 y siguientes 5 (±5), sin duplicados, con wrap-around
	const visibleThumbnails = useMemo(() => {
		const out: { image: ImageItem; isActive: boolean; index: number }[] = [];
		const n = images.length;
		if (n === 0) return out;
		const maxEachSide = 5;
		const seen = new Set<number>();
		for (let o = -maxEachSide; o <= maxEachSide; o++) {
			let idx = (currentIndex + o) % n;
			if (idx < 0) idx += n;
			if (seen.has(idx)) continue;
			seen.add(idx);
			out.push({ image: images[idx], isActive: idx === currentIndex, index: idx });
		}
		return out;
	}, [images, currentIndex]);

	return (
		<motion.div layout className="-translate-x-1/2 fixed bottom-6 left-1/2 z-[9999] flex items-center justify-center">
			<motion.div layout className="flex items-center rounded-lg bg-background/10 px-2 py-1 backdrop-blur-sm">
				{visibleThumbnails.map(({ image, isActive, index }) => (
					<ThumbnailItem image={image} isActive={isActive} key={image.id} onClick={() => onSelectImage(index)} />
				))}
			</motion.div>
		</motion.div>
	);
});

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

	const [urls, setUrls] = useState<Record<string, string>>({});
	const [isLoading, setIsLoading] = useState(true);
	const imageContainerRef = useRef<HTMLFieldSetElement>(null);
	const dialogRef = useRef<HTMLDialogElement>(null);
	const constraintsRef = useRef<HTMLDivElement>(null);
	const closeButtonRef = useRef<HTMLButtonElement>(null);
	const [scale, setScale] = useState(1);
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const [announceMessage, setAnnounceMessage] = useState('');
	const previouslyFocusedElement = useRef<HTMLElement | null>(null);

	// Memoizar la imagen actual
	const currentImage = useMemo(() => images[currentIndex], [images, currentIndex]);

	// Focus management - store and restore focus
	useEffect(() => {
		if (isOpen) {
			// Store the currently focused element
			previouslyFocusedElement.current = document.activeElement as HTMLElement;

			// Focus the close button when opening
			setTimeout(() => {
				closeButtonRef.current?.focus();
			}, 50);
		} else if (previouslyFocusedElement.current || triggerRef?.current) {
			// When closing, restore focus to the element that was focused before opening
			// or to the trigger element if provided
			const elementToFocus = triggerRef?.current || previouslyFocusedElement.current;

			// Short delay to ensure DOM is ready
			setTimeout(() => {
				elementToFocus?.focus();
			}, 50);
		}
	}, [isOpen, triggerRef]);

	// Resetear posición y escala
	const resetView = useCallback(() => {
		setScale(1);
		setPosition({ x: 0, y: 0 });
	}, []);

	// Reset state when opening viewer (respetar índice actual del store)
	useEffect(() => {
		if (isOpen) {
			resetView();
			setIsLoading(true);
		}
	}, [isOpen, resetView]);

	// Focus trap básico dentro del dialog
	useEffect(() => {
		if (!isOpen) return;
		const dialogEl = dialogRef.current;
		if (!dialogEl) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key !== 'Tab') return;
			const focusableNodeList = dialogEl.querySelectorAll<HTMLElement>(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
			);
			const focusable = Array.from(focusableNodeList);
			if (focusable.length === 0) return;
			const first = focusable[0];
			const last = focusable.at(-1) as HTMLElement;
			const active = document.activeElement as HTMLElement | null;
			if (!active) return;
			if (e.shiftKey && active === first) {
				e.preventDefault();
				last.focus();
			} else if (!e.shiftKey && active === last) {
				e.preventDefault();
				first.focus();
			}
		};
		dialogEl.addEventListener('keydown', handleKeyDown);
		return () => dialogEl.removeEventListener('keydown', handleKeyDown);
	}, [isOpen]);

	// Validate images and index
	useEffect(() => {
		if (!images?.length) {
			setIsLoading(false);
			return;
		}
		if (currentIndex < 0 || currentIndex >= images.length) {
			setCurrentIndex(0);
		}
	}, [images, currentIndex, setCurrentIndex]);

	// Función memoizada para cargar URL de imagen (sin async innecesario)
	const loadImageUrl = useCallback((imageId: string): string => {
		try {
			// Usar el endpoint de contenido completo
			const url = `/api/images/${imageId}/content`;
			return url;
		} catch (error) {
			console.error(`Error cargando URL para ${imageId}:`, error);
			throw error;
		}
	}, []);

	// Determinar qué imágenes cargar inicialmente: actual ± vecinos
	const indicesToLoad = useMemo(() => {
		const len = images.length;
		if (len === 0) return [] as number[];
		if (len === 1) return [currentIndex];
		const prevIndex = (currentIndex - 1 + len) % len;
		const nextIndex = (currentIndex + 1) % len;
		return [prevIndex, currentIndex, nextIndex];
	}, [currentIndex, images]);

	// Effect para cargar las URLs iniciales
	useEffect(() => {
		if (!isOpen) {
			return;
		}

		const loadInitialUrls = async () => {
			const imagesToLoad = indicesToLoad
				.map((idx) => images[idx])
				.filter((img): img is ImageItem => Boolean(img && !urls[img.id]));

			if (!imagesToLoad.length) {
				setIsLoading(false);
				return;
			}

			try {
				const newUrls: Record<string, string> = {};

				await Promise.all(
					imagesToLoad.map(async (img) => {
						if (!img || urls[img.id]) {
							return;
						}

						try {
							const url = await loadImageUrl(img.id);
							if (url) newUrls[img.id] = url;
						} catch (error) {
							console.error(`Error cargando URL para ${img.name}:`, error);
						}
					})
				);

				if (Object.keys(newUrls).length > 0) {
					setUrls((prev) => ({ ...prev, ...newUrls }));
				}

				setIsLoading(false);
			} catch (error) {
				console.error('Error cargando URLs iniciales:', error);
				setIsLoading(false);
			}
		};

		loadInitialUrls();
	}, [isOpen, images, urls, loadImageUrl, indicesToLoad]);

	// Manejar zoom con la rueda (modo de 1 imagen)
	const handleWheel = useCallback(
		(e: React.WheelEvent) => {
			e.preventDefault();
			const zoomFactor = 0.1;
			const newScale = Math.min(Math.max(0.1, scale * (1 - Math.sign(e.deltaY) * zoomFactor)), 8);
			setScale(newScale);
		},
		[scale]
	);

	// Función memoizada para cambiar el zoom
	const handleZoom = useCallback((factor: number) => {
		setScale((prevScale) => {
			const newScale = Math.min(Math.max(0.1, prevScale + factor), 8);
			return newScale;
		});
	}, []);

	// Funciones memoizadas para los botones de la barra de herramientas
	const handleZoomIn = useCallback(() => handleZoom(0.2), [handleZoom]);
	const handleZoomOut = useCallback(() => handleZoom(-0.2), [handleZoom]);

	// Función memoizada para copiar la URL
	const handleCopy = useCallback(async () => {
		if (!currentImage) {
			return;
		}

		try {
			// Si ya tenemos la URL en caché
			let url = urls[currentImage.id];

			// Si no, obtenemos la URL
			if (!url) {
				url = await loadImageUrl(currentImage.id);
				setUrls((prev) => ({ ...prev, [currentImage.id]: url }));
			}

			// Copiamos la URL al portapapeles
			if (url) {
				await navigator.clipboard.writeText(url);
				toastService.success('URL copiada al portapapeles');
			}
		} catch (error) {
			console.error('Error al copiar URL:', error);
			toastService.error('No se pudo copiar la URL');
		}
	}, [currentImage, urls, loadImageUrl]);

	// Función memoizada para descargar la imagen
	const handleDownload = useCallback(async () => {
		try {
			if (!currentImage) {
				return;
			}

			// Revisamos si ya tenemos la URL
			let url = urls[currentImage.id];

			// Si no, obtenemos la URL
			if (!url) {
				url = await loadImageUrl(currentImage.id);
				setUrls((prev) => ({ ...prev, [currentImage.id]: url }));
			}

			// Creamos un enlace para la descarga
			if (url) {
				// Crear un blob para asegurar un tipo MIME correcto
				const response = await fetch(url);
				const blob = await response.blob();
				const secureUrl = URL.createObjectURL(blob);

				const link = document.createElement('a');
				link.href = secureUrl;
				link.download = currentImage.name || 'imagen';
				link.rel = 'noopener noreferrer';
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);

				// Liberar el objeto URL
				URL.revokeObjectURL(secureUrl);

				toastService.success('Descarga iniciada');
			}
		} catch (error) {
			console.error('Error al descargar imagen:', error);
			toastService.error('No se pudo descargar la imagen');
		}
	}, [currentImage, urls, loadImageUrl]);

	// Keyboard navigation (complejidad reducida)
	const announce = useCallback(
		(index: number) => {
			const item = images[index];
			if (item) {
				setAnnounceMessage(`Imagen ${index + 1} de ${images.length}: ${item.name}`);
			}
		},
		[images]
	);

	const onEscape = useCallback(() => onClose(), [onClose]);
	const onArrowLeft = useCallback(() => {
		previousItem();
		announce(Math.max(0, currentIndex - 1));
	}, [previousItem, announce, currentIndex]);
	const onArrowRight = useCallback(() => {
		nextItem();
		announce(Math.min(images.length - 1, currentIndex + 1));
	}, [nextItem, announce, images.length, currentIndex]);
	const onReset = useCallback(() => {
		resetView();
		setAnnounceMessage('Vista restablecida');
	}, [resetView]);
	const onZoomInKey = useCallback(() => {
		handleZoom(0.2);
		setAnnounceMessage('Zoom aumentado');
	}, [handleZoom]);
	const onZoomOutKey = useCallback(() => {
		handleZoom(-0.2);
		setAnnounceMessage('Zoom reducido');
	}, [handleZoom]);

	// Mantener un único manejador en window para evitar duplicados en fieldset
	useEffect(() => {
		if (!isOpen) return;
		const keyMap: Record<string, () => void> = {
			Escape: onEscape,
			ArrowLeft: onArrowLeft,
			ArrowRight: onArrowRight,
			r: onReset,
			'+': onZoomInKey,
			'-': onZoomOutKey,
			'0': onReset,
		};
		const handleKeyDown = (e: KeyboardEvent) => {
			const fn = keyMap[e.key];
			if (fn) {
				e.preventDefault();
				fn();
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [isOpen, onEscape, onArrowLeft, onArrowRight, onReset, onZoomInKey, onZoomOutKey]);

	// Resetear posición y escala cuando cambia la imagen seleccionada
	useEffect(() => {
		resetView();
	}, [resetView]);

	// Memoizar la clase del dialog
	const dialogClassName = useMemo(
		() =>
			cn(
				'fixed inset-0 z-[9999] m-0 flex h-full w-full flex-col items-center justify-center bg-black/90 p-0 backdrop-blur-md',
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

	// Función vacía para drag (placeholder)
	const onMainDrag = useCallback((_e: any, info: { delta: { x: number; y: number } }) => {
		setPosition((prev) => {
			const next = { x: prev.x + info.delta.x, y: prev.y + info.delta.y };
			// Clamp aproximado: no dejar que el centro se vaya demasiado lejos; mantiene dentro del viewport a nivel visual
			const container = imageContainerRef.current?.getBoundingClientRect();
			if (container) {
				const maxX = container.width / 2;
				const maxY = container.height / 2;
				next.x = Math.max(-maxX, Math.min(maxX, next.x));
				next.y = Math.max(-maxY, Math.min(maxY, next.y));
			}
			return next;
		});
	}, []);

	// -------- MODO MULTI-LAYER (capas superpuestas) --------
	type PaneState = { scale: number; x: number; y: number };
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
		<div
			aria-modal="true"
			className={cn(
				'fixed inset-0 z-[9999] m-0 flex h-full w-full flex-col bg-black/90 p-3 backdrop-blur-md',
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
								dragElastic={0}
								dragMomentum={false}
								key={id}
								onDoubleClick={() => resetPane(id)}
								onDrag={(e, info) => onPaneDrag(id, e, info)}
								onWheel={(e) => handlePaneWheel(id, e)}
								style={{ x: st.x, y: st.y, scale: st.scale, zIndex: z + 1 }}
								transition={{ type: 'spring', stiffness: 300, damping: 30 }}
							>
								<img
									alt={img.name}
									className="max-h-full max-w-full object-contain"
									src={url}
									onError={() => console.error('Error cargando capa', id)}
								/>
							</motion.div>
						);
					})}
				</div>
			</div>

			{/* Sugerencias de navegación */}
			<div className="pointer-events-none absolute bottom-4 left-4 max-w-[300px] select-none text-muted-foreground/50 text-xs">
				<p>Rueda: zoom • Arrastrar: mover • Doble clic: reset capa</p>
				<p>ESC: cerrar</p>
			</div>
		</div>
	);

	// -------- FIN MODO MULTI-PANEL --------

	const viewerContent = (
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
			<fieldset
				className="relative flex h-full w-full flex-col items-center justify-center"
				onClick={(e) => e.stopPropagation()}
				onDoubleClick={resetView}
				onKeyDown={(e) => e.stopPropagation()}
				onMouseDown={() => {}}
				onTouchStart={() => {}}
				onWheel={handleWheel}
				ref={imageContainerRef}
				tabIndex={-1}
			>
				<legend className="sr-only">Visor de archivos</legend>
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
												opacity: { duration: 0.5 },
												filter: { duration: 0.4 },
											}}
										>
											<motion.img
												alt="Loading preview"
												animate={{ scale: 1 }}
												className="h-full w-full object-contain"
												exit={{ scale: 1 }}
												initial={{ scale: 1.1 }}
												src={urls[currentImage.id]}
												transition={{ duration: 0.5 }}
											/>
										</motion.div>
									) : (
										<Skeleton className="h-full w-full" />
									)}
								</motion.div>
							)}
						</AnimatePresence>

						{!isLoading && currentImage && urls[currentImage.id] && (
							<motion.div
								className="absolute inset-0 flex items-center justify-center"
								drag
								dragConstraints={constraintsRef}
								dragElastic={0}
								dragMomentum={false}
								onDrag={(_e, info) => onMainDrag(_e, info as any)}
								style={{
									scale,
									x: position.x,
									y: position.y,
								}}
							>
								<img
									alt={currentImage?.name || 'sin nombre'}
									className="max-h-full max-w-full object-contain"
									src={currentImage ? urls[currentImage.id] : ''}
									onError={() => setIsLoading(false)}
								/>
							</motion.div>
						)}

						{!isLoading && (!currentImage || (currentImage && !urls[currentImage.id])) && (
							<div className="absolute inset-0 flex items-center justify-center text-center text-muted-foreground">
								<p>Error al cargar la imagen</p>
							</div>
						)}
					</div>
				</motion.div>

				{/* Thumbnails */}
				<ThumbnailNavigationImpl currentIndex={currentIndex} images={images} onSelectImage={handleSelectImage} />

				{/* Navigation hints */}
				<div className="pointer-events-none fixed bottom-4 left-4 max-w-[300px] select-none text-muted-foreground/50 text-xs">
					<p>Flechas: navegar • Rueda: zoom • Arrastrar: mover</p>
					<p>ESC: cerrar • R: restablecer • +/-: zoom</p>
				</div>
			</fieldset>
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
