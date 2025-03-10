'use client';

import { getImageUrl } from '@/app/actions/images';
import { cn } from '@/lib/utils';
import { useImageViewer } from '@/store/image-viewer.store';
import { Loader2, XCircle } from 'lucide-react';
import Image from 'next/image';
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

				// Intentar obtener la URL con un timeout
				const url = await Promise.race([
					getImageUrl(item.id),
					new Promise<null>((_, reject) => {
						setTimeout(() => {
							reject(new Error('Timeout al cargar la imagen'));
						}, 5000);
					}),
				]);

				if (!mounted) {
					return;
				}

				if (url) {
					setImageUrl(url);
					setIsLoading(false);
				} else {
					throw new Error('No se pudo obtener la URL de la imagen');
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
		openViewer([item], 0);
	}, [item, openViewer]);

	return (
		<div className="relative w-full h-full overflow-hidden rounded-md aspect-video group">
			{isLoading && !imageUrl && (
				<div className="absolute inset-0 flex items-center justify-center bg-muted">
					<div className="text-center">
						<Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
						<p className="text-xs text-muted-foreground">Cargando imagen...</p>
					</div>
				</div>
			)}

			{error && !imageUrl && (
				<div className="absolute inset-0 flex items-center justify-center bg-muted/80">
					<div className="text-center p-4 max-w-xs">
						<XCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
						<p className="text-sm text-destructive font-medium mb-1">Error al cargar la imagen</p>
						<p className="text-xs text-muted-foreground">{error}</p>
					</div>
				</div>
			)}

			{imageUrl && (
				<Image
					src={imageUrl}
					alt={item.name || 'Vista previa de imagen'}
					fill
					className={cn(
						'object-contain bg-background/50 cursor-pointer transition-all hover:scale-[1.02]',
						isLoading && 'opacity-0',
						!isLoading && 'opacity-100'
					)}
					onClick={handleClick}
					sizes="(max-width: 640px) 100vw, 640px"
					priority
					onLoad={() => setIsLoading(false)}
					onError={() => {
						setIsLoading(false);
						setError('Error al mostrar la imagen. Formato no soportado por el navegador.');
					}}
				/>
			)}
		</div>
	);
}
