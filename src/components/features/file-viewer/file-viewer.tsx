'use client';

import { getImageUrl } from '@/app/actions/images';
import { Button } from '@/components/ui/button';
import { ImageFallback } from '@/components/ui/image-fallback';
import { Skeleton } from '@/components/ui/skeleton';
import { toastService } from '@/lib/services/toast.service';
import { cn } from '@/lib/utils/utils';
import { useImageResources } from '@/store/image-resources.store';
import { Copy, Download, Image as ImageIcon, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

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
}

// Configuración de dimensiones fijas para thumbnails
const THUMBNAIL_SIZES = {
	normal: {
		width: 80,
		height: 80,
	},
	active: {
		width: 96,
		height: 96,
	},
} as const;

// Configuración de animaciones mejorada y suavizada para thumbnails
const THUMBNAIL_ANIMATION = {
	type: 'spring' as const,
	stiffness: 300,
	damping: 30,
	mass: 0.8,
	duration: 0.2,
};

// Cache optimizado para thumbnails
const thumbnailCache = new Map<string, { url: string; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

const getThumbnailFromCache = (id: string): string | null => {
	const cached = thumbnailCache.get(id);
	if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
		return cached.url;
	}
	thumbnailCache.delete(id); // Limpiar entradas expiradas
	return null;
};

const setThumbnailInCache = (id: string, url: string) => {
	thumbnailCache.set(id, { url, timestamp: Date.now() });

	// Limpiar caché si es muy grande
	if (thumbnailCache.size > 100) {
		const now = Date.now();
		for (const [key, value] of thumbnailCache.entries()) {
			if (now - value.timestamp > CACHE_DURATION) {
				thumbnailCache.delete(key);
			}
		}
	}
};

// Validación de src mejorada
const isValidSrc = (src: string | undefined | null): src is string => {
	return Boolean(src) && typeof src === 'string' && src.length > 0;
};

// Componente para thumbnail individual optimizado
function ThumbnailItem({
	image,
	isActive,
	onClick,
	images,
}: {
	image: ImageItem;
	isActive: boolean;
	onClick: () => void;
	images: ImageItem[];
}) {
	const imageResources = useImageResources();
	const [isLoading, setIsLoading] = useState(true);
	const [thumbnail, setThumbnail] = useState<string | null>(() => {
		if (!image?.id) {
			return null;
		}
		const cached = getThumbnailFromCache(image.id);
		return cached || null;
	});
	const [error, setError] = useState<string | null>(null);
	const _isMounted = useRef<boolean>(true);
	const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Efecto para cargar el thumbnail con debounce
	useEffect(() => {
		let mounted = true;

		const loadThumbnail = async () => {
			if (!image?.id) {
				return;
			}

			// Si ya tenemos el thumbnail en caché, lo usamos
			const cached = getThumbnailFromCache(image.id);
			if (cached) {
				setThumbnail(cached);
				setIsLoading(false);
				return;
			}

			try {
				setIsLoading(true);

				// Debounce la carga
				if (loadingTimeoutRef.current) {
					clearTimeout(loadingTimeoutRef.current);
				}

				loadingTimeoutRef.current = setTimeout(async () => {
					const url = await imageResources.getThumbnail(image.id);

					if (mounted && url) {
						setThumbnailInCache(image.id, url);
						setThumbnail(url);
						setError(null);
					}
				}, 100);
			} catch (error) {
				if (mounted) {
					console.error('Error loading thumbnail:', error);
					setError('Error al cargar miniatura');
				}
			} finally {
				if (mounted) {
					setIsLoading(false);
				}
			}
		};

		loadThumbnail();

		return () => {
			mounted = false;
			if (loadingTimeoutRef.current) {
				clearTimeout(loadingTimeoutRef.current);
			}
		};
	}, [image?.id, imageResources]);

	// Precargar thumbnails adyacentes cuando está activo
	useEffect(() => {
		if (isActive && image?.id && images?.length) {
			const preloadAdjacentThumbnails = async () => {
				const currentIndex = images.findIndex((img) => img.id === image.id);
				const adjacentIndexes = [currentIndex - 2, currentIndex - 1, currentIndex + 1, currentIndex + 2].filter(
					(i) => i >= 0 && i < images.length
				);

				for (const index of adjacentIndexes) {
					const adjacentImage = images[index];
					if (adjacentImage?.id && !getThumbnailFromCache(adjacentImage.id)) {
						try {
							const url = await imageResources.getThumbnail(adjacentImage.id);
							if (url) {
								setThumbnailInCache(adjacentImage.id, url);
							}
						} catch (error) {
							console.warn('Error preloading thumbnail:', error);
						}
					}
				}
			};

			preloadAdjacentThumbnails();
		}
	}, [isActive, image?.id, imageResources, images]);

	const baseClassName = cn(
		'relative mx-1 overflow-hidden rounded-md transition-shadow duration-200',
		isActive && 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg'
	);

	if (isLoading) {
		return (
			<motion.div
				className={baseClassName}
				animate={{
					width: isActive ? THUMBNAIL_SIZES.active.width : THUMBNAIL_SIZES.normal.width,
					height: isActive ? THUMBNAIL_SIZES.active.height : THUMBNAIL_SIZES.normal.height,
				}}
				transition={THUMBNAIL_ANIMATION}
			>
				<Skeleton className="w-full h-full rounded-md" />
			</motion.div>
		);
	}

	if (error || !thumbnail) {
		return (
			<motion.div
				className={baseClassName}
				animate={{
					width: isActive ? THUMBNAIL_SIZES.active.width : THUMBNAIL_SIZES.normal.width,
					height: isActive ? THUMBNAIL_SIZES.active.height : THUMBNAIL_SIZES.normal.height,
				}}
				transition={THUMBNAIL_ANIMATION}
			>
				<div className="w-full h-full flex items-center justify-center bg-muted">
					<ImageIcon className="w-6 h-6 text-muted-foreground/50" />
				</div>
			</motion.div>
		);
	}

	return (
		<motion.div
			className={baseClassName}
			animate={{
				width: isActive ? THUMBNAIL_SIZES.active.width : THUMBNAIL_SIZES.normal.width,
				height: isActive ? THUMBNAIL_SIZES.active.height : THUMBNAIL_SIZES.normal.height,
				opacity: isActive ? 1 : 0.8,
			}}
			transition={THUMBNAIL_ANIMATION}
			onClick={onClick}
			whileHover={{
				opacity: 1,
				scale: 1.02,
			}}
			whileTap={{ scale: 0.98 }}
		>
			<div className="w-full h-full">
				{isValidSrc(thumbnail) ? (
					<img src={thumbnail} alt={image.name} className="w-full h-full object-cover" loading="lazy" />
				) : (
					<div className="w-full h-full flex items-center justify-center bg-muted">
						<ImageIcon className="w-6 h-6 text-muted-foreground/50" />
					</div>
				)}
			</div>
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
}

export function FileViewer({ images, initialIndex = 0, isOpen, onClose }: FileViewerProps) {
	const [currentIndex, setCurrentIndex] = useState(initialIndex);
	const [urls, setUrls] = useState<Record<string, string>>({});
	const [isLoading, setIsLoading] = useState(true);
	const imageContainerRef = useRef<HTMLDivElement>(null);
	const [scale, setScale] = useState(1);
	const [_position, setPosition] = useState({ x: 0, y: 0 });

	const currentImage = images[currentIndex];

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

	// Cargar solo las URLs necesarias inicialmente
	useEffect(() => {
		if (!isOpen || !images.length) {
			return;
		}

		const loadInitialUrls = async () => {
			const currentImage = images[currentIndex];
			const nextImage = images[(currentIndex + 1) % images.length];
			const prevImage = images[currentIndex > 0 ? currentIndex - 1 : images.length - 1];

			const imagesToLoad = [currentImage, nextImage, prevImage];
			const urls: Record<string, string> = {};

			try {
				await Promise.all(
					imagesToLoad.map(async (img) => {
						if (!img || urls[img.id]) {
							return;
						}
						try {
							const url = await getImageUrl(img.id);
							urls[img.id] = url;
							console.info(`URL inicial cargada para ${img.name}:`, url);
						} catch (error) {
							console.error(`Error cargando URL inicial para ${img.name}:`, error);
						}
					})
				);
				setUrls((prev) => ({ ...prev, ...urls }));
			} catch (error) {
				console.error('Error cargando URLs iniciales:', error);
				setIsLoading(false);
			}
		};

		loadInitialUrls();
	}, [isOpen, currentIndex, images]);

	// Precargar siguiente/anterior cuando cambia el índice
	useEffect(() => {
		if (!isOpen || !images.length) {
			return;
		}

		const preloadAdjacentImages = async () => {
			const nextIndex = (currentIndex + 1) % images.length;
			const prevIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
			const imagesToPreload = [images[nextIndex], images[prevIndex]].filter((img) => img && !urls[img.id]);

			if (!imagesToPreload.length) {
				return;
			}

			try {
				const urls: Record<string, string> = {};
				await Promise.all(
					imagesToPreload.map(async (img) => {
						if (!img) {
							return;
						}
						try {
							const url = await getImageUrl(img.id);
							urls[img.id] = url;
							console.info(`URL precargada para ${img.name}:`, url);
						} catch (error) {
							console.warn(`Error precargando URL para ${img.name}:`, error);
						}
					})
				);
				setUrls((prev) => ({ ...prev, ...urls }));
			} catch (error) {
				console.warn('Error en precarga de URLs:', error);
			}
		};

		const timer = setTimeout(preloadAdjacentImages, 300);
		return () => clearTimeout(timer);
	}, [isOpen, currentIndex, images, urls]);

	// Keyboard navigation
	useEffect(() => {
		if (!isOpen) {
			return;
		}

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				onClose();
			}
			if (e.key === 'ArrowLeft') {
				setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
			}
			if (e.key === 'ArrowRight') {
				setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
			}
			if (e.key === '0' || e.key === 'r') {
				resetView();
			}
			if (e.key === '+') {
				handleZoom(0.2);
			}
			if (e.key === '-') {
				handleZoom(-0.2);
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [isOpen, images.length, onClose]);

	// Preload adjacent images with original URLs
	useEffect(() => {
		const preloadImage = (imageUrl: string) => {
			if (!imageUrl || Object.keys(urls).includes(imageUrl)) {
				return;
			}

			const img = new Image();
			img.src = imageUrl;
			img.onload = () => {
				setUrls((prev) => ({ ...prev, [imageUrl]: imageUrl }));
			};
		};

		if (currentImage && urls[currentImage.id]) {
			const currentUrl = urls[currentImage.id];
			preloadImage(currentUrl);

			// Preload next and previous images
			const nextIndex = (currentIndex + 1) % images.length;
			const prevIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;

			if (images[nextIndex] && !urls[images[nextIndex].id]) {
				preloadImage(urls[images[nextIndex].id]);
			}
			if (images[prevIndex] && !urls[images[prevIndex].id]) {
				preloadImage(urls[images[prevIndex].id]);
			}
		}
	}, [currentIndex, images, urls, currentImage]);

	// Resetear posición y escala cuando cambia la imagen seleccionada
	const resetPositionAndScale = useCallback(() => {
		setScale(1);
		setPosition({ x: 0, y: 0 });
	}, []);

	// Aplicar reset cuando cambia el índice
	useEffect(() => {
		resetPositionAndScale();
	}, [resetPositionAndScale]);

	const handleWheel = (e: React.WheelEvent) => {
		e.preventDefault();
		const zoomFactor = 0.1;
		const newScale = Math.min(Math.max(0.1, scale * (1 - Math.sign(e.deltaY) * zoomFactor)), 8);
		setScale(newScale);
	};

	const resetView = () => {
		setScale(1);
		setPosition({ x: 0, y: 0 });
	};

	const handleCopy = async () => {
		if (!currentImage) {
			return;
		}

		try {
			// Si ya tenemos la URL en caché
			let url = urls[currentImage.id];

			// Si no, obtenemos la URL
			if (!url) {
				url = await getImageUrl(currentImage.id);
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
	};

	const handleDownload = async () => {
		if (!currentImage) {
			return;
		}

		try {
			// Si ya tenemos la URL en caché
			let url = urls[currentImage.id];

			// Si no, obtenemos la URL
			if (!url) {
				url = await getImageUrl(currentImage.id);
				setUrls((prev) => ({ ...prev, [currentImage.id]: url }));
			}

			// Creamos un enlace para la descarga
			if (url) {
				const link = document.createElement('a');
				link.href = url;
				link.download = currentImage.name || 'imagen';
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				toastService.success('Descarga iniciada');
			}
		} catch (error) {
			console.error('Error al descargar imagen:', error);
			toastService.error('No se pudo descargar la imagen');
		}
	};

	const handleZoom = (factor: number) => {
		const newScale = Math.min(Math.max(0.1, scale + factor), 8);
		setScale(newScale);
	};

	if (!isOpen || !images || !images.length) {
		return null;
	}

	if (!currentImage) {
		return null;
	}

	return (
		<dialog
			className={cn(
				'fixed inset-0 z-50 flex flex-col items-center justify-center w-full h-full bg-black/90 backdrop-blur-sm p-0 m-0',
				isOpen ? 'flex' : 'hidden'
			)}
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
				onWheel={handleWheel}
				onDoubleClick={resetView}
				onKeyDown={(e) => {
					e.stopPropagation();
					if (e.key === 'Enter' || e.key === ' ') {
						resetView();
					}
				}}
				role="presentation"
			>
				{/* Toolbar */}
				<div className="fixed top-4 inset-x-4 flex items-center justify-between z-20">
					<div className="flex space-x-2">
						<Button variant="outline" size="icon" onClick={() => handleZoom(0.2)} title="Acercar">
							<ZoomIn className="h-4 w-4" />
						</Button>
						<Button variant="outline" size="icon" onClick={() => handleZoom(-0.2)} title="Alejar">
							<ZoomOut className="h-4 w-4" />
						</Button>
						<Button variant="outline" size="icon" onClick={resetView} title="Restablecer vista">
							<RotateCcw className="h-4 w-4" />
						</Button>
						<Button variant="outline" size="icon" onClick={handleCopy} title="Copiar">
							<Copy className="h-4 w-4" />
						</Button>
						<Button variant="outline" size="icon" onClick={handleDownload} title="Descargar">
							<Download className="h-4 w-4" />
						</Button>
					</div>

					<Button variant="outline" size="icon" onClick={onClose} title="Cerrar">
						<X className="h-4 w-4" />
					</Button>
				</div>

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

						{!urls[currentImage.id] && (
							<div className="absolute inset-0 flex items-center justify-center text-center text-muted-foreground">
								<p>Error al cargar la imagen</p>
							</div>
						)}
					</div>
				</motion.div>

				{/* Thumbnails */}
				<div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center z-20">
					<div className="flex items-center bg-background/5 backdrop-blur-xs px-2 py-1 rounded-lg">
						{images.slice(Math.max(0, currentIndex - 3), Math.min(images.length, currentIndex + 4)).map((image, i) => (
							<ThumbnailItem
								key={image.id}
								image={image}
								images={images}
								isActive={i + Math.max(0, currentIndex - 3) === currentIndex}
								onClick={() => setCurrentIndex(i + Math.max(0, currentIndex - 3))}
							/>
						))}
					</div>
				</div>

				{/* Navigation hints */}
				<div className="fixed bottom-4 left-4 text-xs text-muted-foreground/50 pointer-events-none select-none max-w-[300px]">
					<p>Flechas: navegar • Rueda: zoom • Arrastrar: mover</p>
					<p>ESC: cerrar • R: restablecer • +/-: zoom</p>
				</div>
			</div>
		</dialog>
	);
}
