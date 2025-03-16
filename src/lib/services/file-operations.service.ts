import { deleteFile, getDirectoryInfo, getFileAsDataUrl, getFileInfo } from '@/app/actions/files/file.actions';
import { serverLogger } from '@/lib/logger/server-logger';
import { toastService } from '@/lib/toast';

const fileLogger = serverLogger.withContext('FileOperationsService');

/**
 * Interfaz para operaciones de archivos que pueden ser implementadas
 * de diferentes maneras según el entorno (web o electron)
 */
export interface FileOperations {
	openPath: (path: string) => Promise<void>;
	downloadFile: (path: string) => Promise<void>;
	copyFileToClipboard: (path: string) => Promise<void>;
	deleteFile: (path: string) => Promise<void>;
}

/**
 * Implementación de operaciones de archivos para entorno Electron
 */
class ElectronFileOperations implements FileOperations {
	async openPath(path: string): Promise<void> {
		fileLogger.info('🔍 Abriendo ubicación en Electron:', path);
		if (window.electron) {
			window.electron.openPath(path);
		} else {
			throw new Error('API de Electron no disponible');
		}
	}

	async downloadFile(path: string): Promise<void> {
		fileLogger.info('⬇️ Descargando archivo en Electron:', path);
		if (window.electron) {
			window.electron.downloadFile(path);
			toastService.system.success('Descarga iniciada');
		} else {
			throw new Error('API de Electron no disponible');
		}
	}

	async copyFileToClipboard(path: string): Promise<void> {
		fileLogger.info('📋 Copiando archivo al portapapeles en Electron:', path);
		if (window.electron) {
			window.electron.copyFileToClipboard(path);
			toastService.system.success('Imagen copiada al portapapeles');
		} else {
			throw new Error('API de Electron no disponible');
		}
	}

	async deleteFile(path: string): Promise<void> {
		fileLogger.info('🗑️ Eliminando archivo en Electron:', path);
		if (window.electron) {
			window.electron.deleteFile(path);
			toastService.system.info('Archivo enviado a la papelera');
		} else {
			throw new Error('API de Electron no disponible');
		}
	}
}

/**
 * Implementación de operaciones de archivos para entorno Web usando Server Actions
 */
class WebFileOperations implements FileOperations {
	async openPath(path: string): Promise<void> {
		fileLogger.info('🔍 Intentando abrir ubicación en Web (limitado):', path);
		// En entorno web, no podemos abrir el explorador de archivos directamente
		// Copiamos la ruta para que el usuario pueda usarla manualmente
		try {
			await navigator.clipboard.writeText(path);
			toastService.system.info('Ruta copiada al portapapeles. Usa esta ruta para localizar el archivo.');
		} catch (error) {
			fileLogger.error('❌ Error al copiar ruta al portapapeles:', error);
			toastService.system.error('No se pudo copiar la ruta al portapapeles');
		}
	}

	async downloadFile(path: string): Promise<void> {
		fileLogger.info('⬇️ Descargando archivo en Web:', path);
		try {
			// Primero obtenemos información del archivo para verificar su existencia
			await getFileInfo(path);

			// Usamos un truco para descargar el archivo: crear un form y enviarlo
			// para evitar problemas con rutas largas en GET
			const form = document.createElement('form');
			form.method = 'POST';
			form.action = '/api/download'; // Ruta para el controlador de descarga
			form.style.display = 'none';

			const input = document.createElement('input');
			input.type = 'hidden';
			input.name = 'path';
			input.value = path;

			form.appendChild(input);
			document.body.appendChild(form);
			form.submit();

			// Eliminamos el form después de un breve retraso
			setTimeout(() => {
				document.body.removeChild(form);
			}, 100);

			toastService.system.success('Descarga iniciada');
		} catch (error) {
			fileLogger.error('❌ Error al descargar archivo:', error);
			toastService.system.error('Error al descargar el archivo');
		}
	}

	async copyFileToClipboard(path: string): Promise<void> {
		fileLogger.info('📋 Copiando archivo al portapapeles en Web:', path);
		try {
			// Usar la Server Action para obtener el archivo como data URL
			const { dataUrl, mimeType } = await getFileAsDataUrl(path);

			// Primero intentamos usar la API moderna de portapapeles
			if (navigator.clipboard?.write) {
				try {
					// Convertir la data URL a Blob
					const res = await fetch(dataUrl);
					const blob = await res.blob();

					// Copiar la imagen al portapapeles
					await navigator.clipboard.write([
						new ClipboardItem({
							[mimeType]: blob,
						}),
					]);

					toastService.system.success('Imagen copiada al portapapeles');
					return;
				} catch (clipboardError) {
					// Si falla la API moderna, usamos el fallback
					console.warn('API de portapapeles moderna no disponible:', clipboardError);
				}
			}

			// Fallback: abrir la imagen en una nueva ventana para que el usuario pueda copiarla manualmente
			const newWindow = window.open();
			if (newWindow) {
				newWindow.document.write(`
					<html>
						<head>
							<title>Copiar imagen</title>
							<style>
								body {
									display: flex;
									flex-direction: column;
									align-items: center;
									justify-content: center;
									font-family: system-ui, sans-serif;
									height: 100vh;
									margin: 0;
									background: #f5f5f5;
								}
								img {
									max-width: 90%;
									max-height: 70vh;
									border: 1px solid #ccc;
									margin-bottom: 20px;
								}
								p {
									margin: 10px 0;
									padding: 10px;
									background: #fff;
									border-radius: 4px;
									box-shadow: 0 1px 3px rgba(0,0,0,0.1);
								}
							</style>
						</head>
						<body>
							<img src="${dataUrl}" alt="Imagen para copiar" />
							<p>Haz clic derecho en la imagen y selecciona "Copiar imagen" para copiarla al portapapeles.</p>
						</body>
					</html>
				`);
				toastService.system.info('Se ha abierto la imagen. Haz clic derecho y selecciona "Copiar imagen".');
			} else {
				throw new Error('No se pudo abrir una nueva ventana');
			}
		} catch (error) {
			fileLogger.error('❌ Error al copiar imagen al portapapeles:', error);
			toastService.system.error('Error al copiar la imagen al portapapeles');
		}
	}

	async deleteFile(path: string): Promise<void> {
		fileLogger.info('🗑️ Eliminando archivo en Web:', path);
		try {
			// Confirmar la eliminación
			if (!window.confirm('¿Estás seguro de que deseas eliminar este archivo?')) {
				return;
			}

			// Usar la Server Action para eliminar el archivo
			await deleteFile(path);
			toastService.system.success('Archivo eliminado correctamente');
		} catch (error) {
			fileLogger.error('❌ Error al eliminar archivo:', error);
			toastService.system.error('Error al eliminar el archivo');
		}
	}
}

/**
 * Factory para crear el servicio de operaciones de archivos adecuado según el entorno
 */
export function createFileOperations(): FileOperations {
	// Detectar si estamos en un entorno Electron
	const isElectron = typeof window !== 'undefined' && window.electron !== undefined;

	fileLogger.info(`🔧 Creando servicio de operaciones de archivos para entorno: ${isElectron ? 'Electron' : 'Web'}`);

	return isElectron ? new ElectronFileOperations() : new WebFileOperations();
}

// Exportar una instancia única del servicio
export const fileOperationsService = createFileOperations();
