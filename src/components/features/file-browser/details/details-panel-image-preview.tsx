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
	const MAX_ATTEMPTS = 3;

	// Usar useCallback para la función de carga para evitar recreaciones innecesarias
	const loadImage = React.useCallback(
		async (attemptOverride?: number) => {
			let mounted = true;
			const abortController = new AbortController();

			try {
				setIsLoading(true);
				setError(null);

				// Incrementar contador de intentos
				const currentAttempt = attemptOverride ?? loadAttemptRef.current + 1;
				loadAttemptRef.current = currentAttempt;

				// Si excedimos los intentos, no seguimos intentando
				if (currentAttempt > MAX_ATTEMPTS) {
					console.error(`❌ Máximo de intentos alcanzado (${MAX_ATTEMPTS}) para imagen:`, item.id);
					setError(`No se pudo cargar la imagen después de ${MAX_ATTEMPTS} intentos`);
					setIsLoading(false);
					return;
				}

				// Intentar obtener la URL sin timeout
				try {
					const url = await getImageUrl(item.id, { signal: abortController.signal });

					if (!mounted) {
						return;
					}

					if (url) {
						// Verificar si la URL es válida haciendo una precarga
						const img = new window.Image(); // Usar el constructor nativo del navegador
						img.onload = () => {
							if (mounted) {
								setImageUrl(url);
								setIsLoading(false);
							}
						};
						img.onerror = () => {
							if (mounted) {
								console.error('❌ URL obtenida pero imagen no cargable:', url);
								setError('La imagen no se puede cargar correctamente');
								setIsLoading(false);
							}
						};
						img.src = url;
					} else {
						throw new Error('No se pudo obtener la URL de la imagen');
					}
				} catch (error) {
					if (!mounted) {
						return;
					}
					throw error; // Propagar el error para ser manejado en el bloque catch principal
				}
			} catch (error) {
				if (!mounted) {
					return;
				}

				const errorMessage = error instanceof Error ? error.message : 'Error al cargar la imagen';
				console.error(`❌ Error cargando imagen (intento ${loadAttemptRef.current}/${MAX_ATTEMPTS}):`, errorMessage);

				setError(errorMessage);
				setIsLoading(false);

				// Intentar cargar de nuevo después de un breve retraso
				if (loadAttemptRef.current < MAX_ATTEMPTS) {
					setTimeout(() => {
						if (mounted) {
							loadImage();
						}
					}, 1000 * loadAttemptRef.current); // Backoff exponencial simple
				}
			}

			return () => {
				mounted = false;
				abortController.abort();
			};
		},
		[item.id]
	);

	// Efecto para cargar la imagen cuando cambia el ID
	React.useEffect(() => {
		setImageUrl(null);
		setError(null);
		setIsLoading(true);
		loadAttemptRef.current = 0;

		// Iniciar carga directamente desde aquí
		let cleanupFn: (() => void) | undefined;

		const startLoading = async () => {
			try {
				cleanupFn = await loadImage(1);
			} catch (err) {
				console.error('Error iniciando carga de imagen:', err);
			}
		};

		startLoading();

		return () => {
			if (cleanupFn) {
				cleanupFn();
			}
		};
	}, [loadImage]);

	const handleClick = React.useCallback(() => {
		if (imageUrl) {
			openViewer([item], 0);
		}
	}, [item, openViewer, imageUrl]);

	// Usar el thumbnail existente mientras se carga la imagen completa
	const hasThumbnail = !!item.url;

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

			{/* Imagen completa */}
			{imageUrl && (
				<div className="relative w-full h-full">
					<img
						src={imageUrl}
						alt={item.name || 'Vista previa de imagen'}
						className={cn(
							'w-full h-full object-contain bg-background/50 cursor-pointer transition-all hover:scale-[1.02]',
							isLoading && 'opacity-0',
							!isLoading && 'opacity-100'
						)}
						onClick={handleClick}
						onLoad={() => setIsLoading(false)}
						onError={() => {
							console.error('❌ Error al renderizar imagen en el DOM:', imageUrl);
							setIsLoading(false);
							setError('Error al mostrar la imagen');
						}}
					/>
				</div>
			)}
		</div>
	);
}
