'use client';

import { getImageUrl } from '@/app/actions/images';
import { cn } from '@/lib/utils';
import { useImageViewer } from '@/store/image-viewer.store';
import { Loader2, XCircle } from 'lucide-react';
// No importamos Image de Next.js ya que está causando problemas
import * as React from 'react';
import type { ItemComponentProps } from './details-panel-types';

/**
 * Componente para la vista previa de imagen con carga optimizada
 */
export function ImagePreview({ item }: ItemComponentProps) {
	const { openViewer } = useImageViewer();
	const [imageUrl, setImageUrl] = React.useState<string | null>(null);
	const [error, setError] = React.useState<string | null>(null);
	const [isLoading, setIsLoading] = React.useState(true);
	const loadAttemptRef = React.useRef(0);
	const hasLoadedRef = React.useRef(false);
	const previousItemIdRef = React.useRef<string | null>(null);
	const isMountedRef = React.useRef(true);
	const MAX_ATTEMPTS = 3;

	// Verificar si hay una URL válida en el item
	const hasThumbnail = React.useMemo(() => !!item.url && typeof item.url === 'string', [item.url]);

	// Usar useCallback para la función de carga para evitar recreaciones innecesarias
	const loadImage = React.useCallback(
		async (attemptOverride?: number) => {
			// Si ya hemos cargado la imagen para este item, no intentamos cargarla de nuevo
			if (hasLoadedRef.current && imageUrl && previousItemIdRef.current === item.id) {
				return;
			}

			try {
				setIsLoading(true);
				setError(null);

				// Si ya tenemos un thumbnail, usarlo como fallback mientras cargamos
				if (hasThumbnail && !imageUrl) {
					// Usar el thumbnail disponible como fallback
				}

				// Incrementar contador de intentos
				const currentAttempt = attemptOverride ?? loadAttemptRef.current + 1;
				loadAttemptRef.current = currentAttempt;

				// Si excedimos los intentos, no seguimos intentando
				if (currentAttempt > MAX_ATTEMPTS) {
					setError(`No se pudo cargar la imagen después de ${MAX_ATTEMPTS} intentos`);
					setIsLoading(false);
					return;
				}

				// Intentar obtener la URL
				try {
					const url = await getImageUrl(item.id);

					if (!isMountedRef.current) {
						return;
					}

					if (url) {
						// Verificar si la URL es válida haciendo una precarga
						const img = new window.Image(); // Usar el constructor nativo del navegador
						img.onload = () => {
							if (isMountedRef.current) {
								setImageUrl(url);
								setIsLoading(false);
								hasLoadedRef.current = true;
								previousItemIdRef.current = item.id; // Guardar el ID del item
							}
						};
						img.onerror = () => {
							if (isMountedRef.current) {
								setError('La imagen no se puede cargar correctamente');
								setIsLoading(false);
							}
						};
						img.src = url;
					} else {
						throw new Error('No se pudo obtener la URL de la imagen');
					}
				} catch (error) {
					if (!isMountedRef.current) {
						return;
					}
					throw error; // Propagar el error para ser manejado en el bloque catch principal
				}
			} catch (error) {
				if (!isMountedRef.current) {
					return;
				}

				const errorMessage = error instanceof Error ? error.message : 'Error al cargar la imagen';
				setError(errorMessage);
				setIsLoading(false);

				// Intentar cargar de nuevo después de un breve retraso
				if (loadAttemptRef.current < MAX_ATTEMPTS) {
					setTimeout(() => {
						if (isMountedRef.current) {
							loadImage();
						}
					}, 1000 * loadAttemptRef.current); // Backoff exponencial simple
				}
			}
		},
		[item.id, imageUrl, hasThumbnail]
	);

	// Efecto para actualizar el estado de montaje del componente
	React.useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	// Efecto para cargar la imagen cuando cambia el ID
	React.useEffect(() => {
		// Verificar si ya tenemos cargada la imagen para este item
		if (previousItemIdRef.current === item.id && hasLoadedRef.current && imageUrl) {
			// Ya está cargada, no hacer nada
			return;
		}

		// Restablecer estado para nueva imagen
		setImageUrl(null);
		setError(null);
		setIsLoading(true);
		loadAttemptRef.current = 0;
		hasLoadedRef.current = false;

		// Si hay un thumbnail en el item, establecerlo como URL inicial
		if (hasThumbnail) {
			// Establecer el thumbnail como URL inicial mientras cargamos la imagen completa
			setImageUrl(item.url || null);
		}

		// Iniciar carga directamente desde aquí
		loadImage(1).catch((err) => {
			if (isMountedRef.current) {
				setError('Error iniciando carga de imagen');
				setIsLoading(false);
			}
		});
	}, [item.id, loadImage, hasThumbnail, item.url, imageUrl]); // Incluir todas las dependencias necesarias

	const handleClick = React.useCallback(() => {
		if (imageUrl) {
			openViewer([item], 0);
		}
	}, [item, openViewer, imageUrl]);

	// Simplificamos la renderización para claridad
	return (
		<div className="relative w-full overflow-hidden rounded-md aspect-square sm:aspect-video group">
			{/* Mostrar thumbnail mientras carga si está disponible */}
			{isLoading && hasThumbnail && (
				<div className="absolute inset-0">
					<img
						src={item.url}
						alt={item.name || 'Miniatura de la imagen'}
						className="w-full h-full object-contain bg-background/50 filter blur-[1px] brightness-75"
					/>
					<div className="absolute top-2 right-2 bg-background/70 rounded-full p-1">
						<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
					</div>
				</div>
			)}

			{/* Indicador de carga si no hay thumbnail */}
			{isLoading && !hasThumbnail && !imageUrl && (
				<div className="absolute inset-0 flex items-center justify-center bg-muted/80">
					<div className="text-center">
						<Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto mb-1" />
						<p className="text-[10px] text-muted-foreground">Cargando...</p>
					</div>
				</div>
			)}

			{/* Mensaje de error */}
			{error && !imageUrl && (
				<div className="absolute inset-0 flex items-center justify-center bg-muted/80">
					<div className="text-center p-2 max-w-[200px]">
						<XCircle className="w-5 h-5 text-destructive mx-auto mb-1" />
						<p className="text-[11px] text-destructive font-medium mb-0.5">Error al cargar</p>
						<p className="text-[9px] text-muted-foreground leading-tight">{error}</p>
					</div>
				</div>
			)}

			{/* Imagen completa o thumbnail */}
			{imageUrl && (
				<div className="relative w-full h-full">
					<button
						className={cn(
							'w-full h-full cursor-pointer transition-all hover:scale-[1.02] border-0 p-0 m-0 bg-transparent',
							isLoading && !hasThumbnail && 'opacity-0',
							!isLoading && 'opacity-100'
						)}
						onClick={handleClick}
						onKeyDown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								handleClick();
							}
						}}
						type="button"
						aria-label={`Ver ${item.name || 'imagen'} en tamaño completo`}
					>
						<img
							src={imageUrl}
							alt={item.name || 'Vista previa de imagen'}
							className="w-full h-full object-contain bg-background/50"
							onLoad={() => {
								setIsLoading(false);
							}}
							onError={() => {
								setIsLoading(false);
								setError('Error al mostrar la imagen');
							}}
						/>
					</button>
				</div>
			)}
		</div>
	);
}
