/**
 * @file Hook para compartir archivos
 * @module hooks/use-share
 * @description Hook para compartir archivos usando Web Share API o fallback al clipboard
 */

import { useCallback, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

export interface ShareOptions {
	/** Archivos a compartir (solo si la API lo soporta) */
	files?: File[];
	/** Texto descriptivo */
	text?: string;
	/** Título del contenido a compartir */
	title: string;
	/** URL a compartir */
	url?: string;
}

export interface UseShareResult {
	/** Si la API de compartir está disponible */
	canShare: boolean;
	/** Error si ocurrió */
	error: Error | null;
	/** Si está procesando */
	isLoading: boolean;
	/** Función para compartir */
	share: (options: ShareOptions) => Promise<boolean>;
}

/**
 * Hook para compartir contenido usando la Web Share API
 * Con fallback al clipboard si no está disponible
 */
export function useShare(): UseShareResult {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const { toast } = useToast();

	// Verificar si la API de compartir está disponible
	const canShare = typeof navigator !== 'undefined' && !!navigator.share;

	const share = useCallback(
		async (options: ShareOptions): Promise<boolean> => {
			setIsLoading(true);
			setError(null);

			try {
				// Si la Web Share API está disponible, usarla
				if (canShare) {
					const shareData: ShareData = {
						title: options.title,
						text: options.text,
						url: options.url,
					};

					// Agregar archivos solo si el navegador lo soporta
					if (options.files && navigator.canShare && navigator.canShare({ files: options.files })) {
						(shareData as any).files = options.files;
					}

					await navigator.share(shareData);

					toast({
						title: '✅ Compartido',
						description: 'El contenido ha sido compartido exitosamente',
					});

					setIsLoading(false);
					return true;
				}

				// Fallback: copiar al clipboard
				if (options.url) {
					await navigator.clipboard.writeText(options.url);

					toast({
						title: '🔗 Link copiado',
						description: 'El enlace ha sido copiado al portapapeles',
					});

					setIsLoading(false);
					return true;
				}

				// Si no hay URL, no se puede compartir
				throw new Error('No hay contenido para compartir');
			} catch (err) {
				const error = err instanceof Error ? err : new Error('Error al compartir');
				setError(error);

				// No mostrar toast si el usuario canceló
				if (error.name !== 'AbortError') {
					toast({
						variant: 'destructive',
						title: '❌ Error al compartir',
						description: error.message,
					});
				}

				setIsLoading(false);
				return false;
			}
		},
		[canShare, toast]
	);

	return {
		share,
		isLoading,
		canShare,
		error,
	};
}

/**
 * Hook específico para compartir archivos
 */
export function useShareFile() {
	const { share, isLoading, canShare, error } = useShare();
	const { toast } = useToast();

	const shareFile = useCallback(
		async (file: { name: string; url: string; type?: string }) => {
			// Intentar usar la Web Share API con archivos si está disponible
			if (canShare && navigator.canShare) {
				try {
					const response = await fetch(file.url);
					const blob = await response.blob();
					const fileObj = new File([blob], file.name, { type: file.type || blob.type });

					if (navigator.canShare({ files: [fileObj] })) {
						return await share({
							title: file.name,
							files: [fileObj],
						});
					}
				} catch {
					// Si falla, continuar con fallback
				}
			}

			// Fallback: compartir URL
			return await share({
				title: file.name,
				text: `Mira este archivo: ${file.name}`,
				url: file.url,
			});
		},
		[share, canShare]
	);

	return {
		shareFile,
		isLoading,
		canShare,
		error,
	};
}
