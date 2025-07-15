/**
 * @file Servicios de desarrollo para features e issues
 * @description Funciones para obtener datos de desarrollo (compatible con Vite)
 */

import type { Feature } from '../cards/feature-card';
import type { Issue } from '../cards/issue-card';
import { ServiceStatus } from '../cards/service-card';

/**
 * Obtiene la lista de features
 * Compatible con Vite + React
 */
export async function getFeatures(): Promise<Feature[]> {
	// Simulación de obtención de datos desde BD
	// En una implementación real, esto sería una llamada a la base de datos
	return [
		{
			name: 'Procesamiento por lotes',
			description: 'Permitir procesar múltiples imágenes simultáneamente',
			status: 'completed',
			progress: 100,
		},
		{
			name: 'Reconocimiento facial',
			description: 'Implementar detección y reconocimiento de rostros',
			status: 'in-progress',
			progress: 65,
		},
		{
			name: 'Exportación a formatos RAW',
			description: 'Soporte para exportación en formatos sin compresión',
			status: 'in-progress',
			progress: 40,
		},
		{
			name: 'Integración con Adobe CC',
			description: 'Permitir enviar imágenes directamente a Photoshop/Lightroom',
			status: 'pending',
			progress: 10,
		},
		{
			name: 'Sincronización con almacenamiento en la nube',
			description: 'Integración con Google Drive, Dropbox y OneDrive',
			status: 'pending',
			progress: 5,
		},
	];
}

/**
 * Obtiene la lista de issues
 * Compatible con Vite + React
 */
export async function getIssues(): Promise<Issue[]> {
	// Simulación de obtención de datos desde BD
	return [
		{
			id: 'issue-1',
			title: 'Error en carga de imágenes HEIF',
			description: 'Las imágenes en formato HEIF no se cargan correctamente',
			status: 'open',
			severity: 'high',
		},
		{
			id: 'issue-2',
			title: 'Rendimiento lento en galerías grandes',
			description: 'Tiempos de carga excesivos para galerías con más de 1000 imágenes',
			status: 'in-progress',
			severity: 'medium',
		},
		{
			id: 'issue-3',
			title: 'Metadatos EXIF incorrectos',
			description: 'Los metadatos EXIF no se conservan al exportar',
			status: 'in-progress',
			severity: 'low',
		},
		{
			id: 'issue-4',
			title: 'Crash al procesar imágenes panorámicas',
			description: 'La aplicación falla al intentar procesar imágenes panorámicas de gran tamaño',
			status: 'resolved',
			severity: 'critical',
		},
	];
}

/**
 * Obtiene el estado de los servicios
 * Compatible con Vite + React
 */
export async function getServices(): Promise<Omit<ServiceStatus, 'icon'>[]> {
	// Simulación de obtención de datos desde BD
	return [
		{
			name: 'Indexación de Archivos',
			status: 'online',
			description: 'Servicio de escaneo e indexación de archivos',
		},
		{
			name: 'Procesamiento de Imágenes',
			status: 'online',
			description: 'Servicio de procesamiento y transformación de imágenes',
		},
		{
			name: 'Base de Datos',
			status: 'online',
			description: 'Servidor de base de datos SQL',
		},
		{
			name: 'API REST',
			status: 'online',
			description: 'API para integración con servicios externos',
		},
		{
			name: 'Sistema de Caché',
			status: 'warning',
			description: 'Caché de datos y assets para mejorar rendimiento',
		},
		{
			name: 'Background Jobs',
			status: 'online',
			description: 'Procesamiento de tareas en segundo plano',
		},
		{
			name: 'Reconocimiento de Imágenes',
			status: 'warning',
			description: 'Servicio de reconocimiento y etiquetado automático',
		},
		{
			name: 'Sincronización',
			status: 'offline',
			description: 'Servicio de sincronización con dispositivos',
		},
	];
}
