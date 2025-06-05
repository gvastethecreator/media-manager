'use client';

import { getImageUrl } from '@/app/actions/images';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { toastService } from '@/services/toast.service';
import { useImageResources } from '@/store/image-resources.store';
import { Copy, Download, Image as ImageIcon, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type React from 'react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

interface FileViewerProps {
	images: ImageItem[];
	initialIndex?: number;
	isOpen: boolean;
	onClose: () => void;
	triggerRef?: React.RefObject<HTMLElement>;
}

// Constantes memoizadas para animaciones y tamaños
const THUMBNAIL_SIZES = {
	normal: {
		width: 60,
		height: 40,
	},
	active: {
		width: 80,
		height: 50,
	},
};

const THUMBNAIL_ANIMATION = {
	duration: 0.2,
	ease: 'easeOut',
};

// Función auxiliar memoizada
const isValidSrc = (src: string | null): src is string => {
	return Boolean(src) && typeof src === 'string' && src.trim() !== '';
};

// Componente de miniaturas memoizado
const ThumbnailItem = memo(function ThumbnailItem({
	image,
	isActive,
	onClick,
}: {
	image: ImageItem;
	isActive: boolean;
	onClick: () => void;
	images: ImageItem[];
}) {
	const imageResources = useImageResources();
	const [error, setError] = useState(false);
	const [thumbnail, setThumbnail] = useState<string | null>(null);

	// Obtener la miniatura de forma optimizada
	useEffect(() => {
		const resource = imageResources.resources.get(image.id);
		const thumbnailUrl = image.thumbnail || resource?.thumbnail || null;

		// Solo actualizamos si cambia
		if (thumbnailUrl !== thumbnail) {
			setThumbnail(thumbnailUrl);
		}

		// Detectar errores en imágenes
		if (!thumbnailUrl && !error) {
			setError(true);
		}
	}, [image.id, image.thumbnail, imageResources.resources, thumbnail, error]);

	// Memoizar la clase base
	const baseClassName = useMemo(
		() =>
			cn(
				'relative overflow-hidden rounded-md mr-2 cursor-pointer',
				'transition-all duration-200 ease-out',
				isActive ? 'ring-2 ring-primary' : 'hover:ring-1 hover:ring-primary/50'
			),
		[isActive]
	);

	// Renderizado condicional memoizado
	const thumbnailContent = useMemo(() => {
		if (error || !thumbnail) {
			return (
				<div className="w-full h-full flex items-center justify-center bg-muted">
					<ImageIcon className="w-6 h-6 text-muted-foreground/50" />
				</div>
			);
		}

		return (
			<div className="w-full h-full">
				{isValidSrc(thumbnail) ? (
					<img src={thumbnail} alt={image.name} className="w-full h-full object-cover" loading="lazy" />
				) : (
					<div className="w-full h-full flex items-center justify-center bg-muted">
						<ImageIcon className="w-6 h-6 text-muted-foreground/50" />
					</div>
				)}
			</div>
		);
	}, [error, thumbnail, image.name]);

	// Memoizar los estilos de animación
	const animateStyles = useMemo(
		() => ({
			width: isActive ? THUMBNAIL_SIZES.active.width : THUMBNAIL_SIZES.normal.width,
			height: isActive ? THUMBNAIL_SIZES.active.height : THUMBNAIL_SIZES.normal.height,
			opacity: isActive ? 1 : 0.8,
		}),
		[isActive]
	);

	return (
		<motion.div
			className={baseClassName}
			animate={animateStyles}
			transition={THUMBNAIL_ANIMATION}
			onClick={onClick}
			whileHover={{
				opacity: 1,
				scale: 1.02,
			}}
			whileTap={{ scale: 0.98 }}
		>
			{thumbnailContent}
			{isActive && (
				<motion.div
					className="absolute inset-0 bg-primary/10 pointer-events-none"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.2 }}
				/>
			)}
		</motion.div>
	);
});

// Componente de acciones de la barra de herramientas
const ToolbarActions = memo(function ToolbarActions({
	onZoomIn,
	onZoomOut,
	onReset,
	onCopy,
	onDownload,
	onClose,
}: {
	onZoomIn: () => void;
	onZoomOut: () => void;
	onReset: () => void;
	onCopy: () => void;
	onDownload: () => void;
	onClose: () => void;
}) {
	return (
		<div className="fixed top-4 inset-x-4 flex items-center justify-between z-[9999]">
			<div className="flex space-x-2">
				<Button variant="outline" size="icon" onClick={onZoomIn} title="Acercar">
					<ZoomIn className="h-4 w-4" />
				</Button>
				<Button variant="outline" size="icon" onClick={onZoomOut} title="Alejar">
					<ZoomOut className="h-4 w-4" />
				</Button>
				<Button variant="outline" size="icon" onClick={onReset} title="Restablecer vista">
					<RotateCcw className="h-4 w-4" />
				</Button>
				<Button variant="outline" size="icon" onClick={onCopy} title="Copiar">
					<Copy className="h-4 w-4" />
				</Button>
				<Button variant="outline" size="icon" onClick={onDownload} title="Descargar">
					<Download className="h-4 w-4" />
				</Button>
			</div>

			<Button variant="outline" size="icon" onClick={onClose} title="Cerrar">
				<X className="h-4 w-4" />
			</Button>
		</div>
	);
});

// Componente de navegación de miniaturas
const ThumbnailNavigation = memo(function ThumbnailNavigation({
	images,
	currentIndex,
	onSelectImage,
}: {
	images: ImageItem[];
	currentIndex: number;
	onSelectImage: (index: number) => void;
}) {
	// Calcular la sección visible de miniaturas - memoizado
	const visibleThumbnails = useMemo(() => {
		const startIndex = Math.max(0, currentIndex - 3);
		const endIndex = Math.min(images.length, currentIndex + 4);
		return images.slice(startIndex, endIndex).map((image, i) => ({
			image,
			isActive: i + startIndex === currentIndex,
			index: i + startIndex,
		}));
	}, [images, currentIndex]);

	return (
		<div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center z-[9999]">
			<div className="flex items-center bg-background/5 backdrop-blur-xs px-2 py-1 rounded-lg">
				{visibleThumbnails.map(({ image, isActive, index }) => (
					<ThumbnailItem
						key={image.id}
						image={image}
						images={images}
						isActive={isActive}
						onClick={() => onSelectImage(index)}
					/>
				))}
			</div>
		</div>
	);
});

// Componente principal del visor de archivos - memoizado
export const FileViewer = memo(function FileViewer({
	images,
	initialIndex = 0,
	isOpen,
	onClose,
	triggerRef,
}: FileViewerProps) {
	const [currentIndex, setCurrentIndex] = useState(initialIndex);
	const [urls, setUrls] = useState<Record<string, string>>({});
	const [isLoading, setIsLoading] = useState(true);
	const imageContainerRef = useRef<HTMLDivElement>(null);
	const closeButtonRef = useRef<HTMLButtonElement>(null);
	const [scale, setScale] = useState(1);
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const [isDragging, setIsDragging] = useState(false);
	const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
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

	// Reset state when opening viewer
	useEffect(() => {
		if (isOpen) {
			setCurrentIndex(initialIndex);
			resetView();
			setIsLoading(true);
		}
	}, [isOpen, initialIndex]);

	// Validate images and index
	useEffect(() => {
		if (!images || !images.length) {
			setIsLoading(false);
			return;
		}
		if (currentIndex < 0 || currentIndex >= images.length) {
			setCurrentIndex(0);
		}
	}, [images, currentIndex]);

	// Función memoizada para cargar URL de imagen
	const loadImageUrl = useCallback(async (imageId: string): Promise<string> => {
		try {
			const url = await getImageUrl(imageId);
			return url;
		} catch (error) {
			console.error(`Error cargando URL para ${imageId}:`, error);
			throw error;
		}
	}, []);

	// Determinar qué imágenes cargar inicialmente - Mover fuera de la función asíncrona
	const indicesToLoad = useMemo(() => {
		const nextIndex = (currentIndex + 1) % images.length;
		const prevIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
		return [currentIndex, nextIndex, prevIndex];
	}, [currentIndex, images.length]);

	// Effect para cargar las URLs iniciales
	useEffect(() => {
		if (!isOpen) return;

		const loadInitialUrls = async () => {
			const imagesToLoad = indicesToLoad.map((idx) => images[idx]).filter((img) => img && !urls[img.id]);

			if (!imagesToLoad.length) {
				setIsLoading(false);
				return;
			}

			try {
				const newUrls: Record<string, string> = {};

				await Promise.all(
					imagesToLoad.map(async (img) => {
						if (!img || urls[img.id]) return;

						try {
							const url = await loadImageUrl(img.id);
							newUrls[img.id] = url;
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

	// Resetear posición y escala
	const resetView = useCallback(() => {
		setScale(1);
		setPosition({ x: 0, y: 0 });
	}, []);

	// Manejar zoom con la rueda
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
		if (!currentImage) return;

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
			if (!currentImage) return;

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

	// Función memoizada para seleccionar una imagen
	const handleSelectImage = useCallback((index: number) => {
		setCurrentIndex(index);
	}, []);

	// Keyboard navigation
	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			// If Tab is pressed, don't override browser behavior
			if (e.key === 'Tab') {
				return;
			}

			if (e.key === 'Escape') {
				onClose();
			} else if (e.key === 'ArrowLeft') {
				setCurrentIndex((prev) => {
					const newIndex = prev > 0 ? prev - 1 : images.length - 1;
					// Anunciar para lectores de pantalla
					if (images[newIndex]) {
						setAnnounceMessage(`Imagen ${newIndex + 1} de ${images.length}: ${images[newIndex].name}`);
					}
					return newIndex;
				});
			} else if (e.key === 'ArrowRight') {
				setCurrentIndex((prev) => {
					const newIndex = prev < images.length - 1 ? prev + 1 : 0;
					// Anunciar para lectores de pantalla
					if (images[newIndex]) {
						setAnnounceMessage(`Imagen ${newIndex + 1} de ${images.length}: ${images[newIndex].name}`);
					}
					return newIndex;
				});
			} else if (e.key === '0' || e.key === 'r') {
				resetView();
				setAnnounceMessage('Vista restablecida');
			} else if (e.key === '+') {
				handleZoom(0.2);
				setAnnounceMessage('Zoom aumentado');
			} else if (e.key === '-') {
				handleZoom(-0.2);
				setAnnounceMessage('Zoom reducido');
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [isOpen, images, onClose, resetView, handleZoom]);

	// Resetear posición y escala cuando cambia la imagen seleccionada
	useEffect(() => {
		resetView();
	}, [resetView]);

	// Memoizar la clase del dialog
	const dialogClassName = useMemo(
		() =>
			cn(
				'fixed inset-0 z-[9999] flex flex-col items-center justify-center w-full h-full bg-black/90 backdrop-blur-sm p-0 m-0',
				isOpen ? 'flex' : 'hidden'
			),
		[isOpen]
	);

	// No renderizar nada si no hay imágenes o el visor está cerrado
	if (!isOpen || !images?.length || !currentImage) {
		return null;
	}

	return (
		<dialog
			className={dialogClassName}
			open={isOpen}
			onClick={(e) => {
				if (e.target === e.currentTarget) {
					onClose();
				}
			}}
			onKeyDown={(e) => {
				if (e.key === 'Escape') {
					onClose();
				}
			}}
			aria-modal="true"
		>
			<div
				ref={imageContainerRef}
				className="relative w-full h-full flex flex-col items-center justify-center"
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => {
					if (e.key === 'Escape') {
						onClose();
					} else if (e.key === 'ArrowLeft') {
						setCurrentIndex((prev) => {
							const newIndex = prev > 0 ? prev - 1 : images.length - 1;
							// Announce for screen readers
							if (images[newIndex]) {
								setAnnounceMessage(`Imagen ${newIndex + 1} de ${images.length}: ${images[newIndex].name}`);
							}
							return newIndex;
						});
					} else if (e.key === 'ArrowRight') {
						setCurrentIndex((prev) => {
							const newIndex = prev < images.length - 1 ? prev + 1 : 0;
							// Announce for screen readers
							if (images[newIndex]) {
								setAnnounceMessage(`Imagen ${newIndex + 1} de ${images.length}: ${images[newIndex].name}`);
							}
							return newIndex;
						});
					} else if (e.key === '0' || e.key === 'r') {
						resetView();
						setAnnounceMessage('Vista restablecida');
					}
				}}
				onWheel={handleWheel}
				onDoubleClick={resetView}
				onMouseDown={handleDragStart}
				onTouchStart={handleDragStart}
				aria-label="Visor de imágenes"
			>
				{/* Toolbar */}
				<ToolbarActions
					onZoomIn={handleZoomIn}
					onZoomOut={handleZoomOut}
					onReset={resetView}
					onCopy={handleCopy}
					onDownload={handleDownload}
					onClose={onClose}
				/>

				{/* Main Image Container */}
				<motion.div
					key={currentImage.id}
					className="absolute inset-0 flex items-center justify-center"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.3 }}
				>
					<div className="relative w-full h-full flex items-center justify-center overflow-hidden">
						<AnimatePresence mode="wait">
							{isLoading && (
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									transition={{ duration: 0.3 }}
									className="absolute inset-0 flex items-center justify-center"
								>
									{urls[currentImage.id] ? (
										<motion.div
											className="absolute inset-0 flex items-center justify-center"
											initial={{ opacity: 0, filter: 'blur(10px)' }}
											animate={{ opacity: 1, filter: 'blur(3px)' }}
											exit={{ opacity: 0, filter: 'blur(0px)' }}
											transition={{
												duration: 0.8,
												opacity: { duration: 0.5 },
												filter: { duration: 0.4 },
											}}
										>
											<motion.img
												src={urls[currentImage.id]}
												alt="Loading preview"
												className="w-full h-full object-contain"
												initial={{ scale: 1.1 }}
												animate={{ scale: 1 }}
												exit={{ scale: 1 }}
												transition={{ duration: 0.5 }}
											/>
										</motion.div>
									) : (
										<Skeleton className="w-full h-full" />
									)}
								</motion.div>
							)}
						</AnimatePresence>

						{!isLoading && urls[currentImage.id] && (
							<motion.div
								className="absolute inset-0 flex items-center justify-center"
								style={{
									scale,
									x: position.x,
									y: position.y,
								}}
							>
								<img
									src={urls[currentImage.id]}
									alt={currentImage.name || 'Image'}
									className="max-w-full max-h-full object-contain"
								/>
							</motion.div>
						)}

						{!urls[currentImage.id] && !isLoading && (
							<div className="absolute inset-0 flex items-center justify-center text-center text-muted-foreground">
								<p>Error al cargar la imagen</p>
							</div>
						)}
					</div>
				</motion.div>

				{/* Thumbnails */}
				<ThumbnailNavigation images={images} currentIndex={currentIndex} onSelectImage={handleSelectImage} />

				{/* Navigation hints */}
				<div className="fixed bottom-4 left-4 text-xs text-muted-foreground/50 pointer-events-none select-none max-w-[300px]">
					<p>Flechas: navegar • Rueda: zoom • Arrastrar: mover</p>
					<p>ESC: cerrar • R: restablecer • +/-: zoom</p>
				</div>
			</div>
		</dialog>
	);
});
