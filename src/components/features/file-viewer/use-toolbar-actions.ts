import { useCallback } from 'react';
import { toastService } from '@/lib/ui/toast';
import type { ImageItem } from './file-viewer.types';

/**
 * 🛠️ HOOK: useToolbarActions
 *
 * Gestiona acciones de la barra de herramientas (copiar, descargar)
 */
export function useToolbarActions(
	currentImage: ImageItem | undefined,
	urls: Record<string, string>,
	setUrls: React.Dispatch<React.SetStateAction<Record<string, string>>>,
	loadImageUrl: (imageId: string) => string
) {
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
	}, [currentImage, urls, setUrls, loadImageUrl]);

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
	}, [currentImage, urls, setUrls, loadImageUrl]);

	return { handleCopy, handleDownload };
}
