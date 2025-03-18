/**
 * Presets de rendimiento para Entity Cards
 *
 * Este archivo contiene configuraciones predefinidas para diferentes escenarios de rendimiento.
 * Cada preset está optimizado para un caso de uso específico, balanceando rendimiento y calidad visual.
 */

import type { PerformanceOptions } from './types';

/**
 * Preset para calidad máxima visual
 * Prioriza la calidad visual sobre el rendimiento
 */
export const QUALITY_PRESET: PerformanceOptions = {
	// Configuración general
	performanceMode: 'quality',
	enableCache: true,
	loadingStrategy: 'progressive',
	enablePreloading: true,
	enableHardwareAcceleration: true,

	// Optimización de renderizado
	useRAF: true,
	batchUpdates: true,
	throttleMs: 0, // Sin throttling para animaciones fluidas
	lazyLoad: false, // Cargar todas las imágenes inmediatamente
	prefetch: true, // Precargar recursos
	virtualizeList: false, // Renderizar todas las tarjetas

	// Optimización de imágenes
	imageOptimization: true,
	prefetchOnHover: true,

	// Tiempos y retardos
	debounceTime: 150,
	transitionDelay: 0,

	// Estrategias avanzadas
	cacheStrategy: 'memory',
	useWASM: true,

	// Animaciones
	reducedMotion: false,
	animationDuration: 350,
	animationMaxFPS: 60,
};

/**
 * Preset balanceado entre rendimiento y calidad
 * Configuración por defecto recomendada para la mayoría de casos
 */
export const BALANCED_PRESET: PerformanceOptions = {
	// Configuración general
	performanceMode: 'balanced',
	enableCache: true,
	loadingStrategy: 'progressive',
	enablePreloading: true,
	enableHardwareAcceleration: true,

	// Optimización de renderizado
	useRAF: true,
	batchUpdates: true,
	throttleMs: 16, // ~60 FPS
	lazyLoad: true,
	prefetch: true,
	virtualizeList: true,

	// Optimización de imágenes
	imageOptimization: true,
	prefetchOnHover: true,

	// Tiempos y retardos
	debounceTime: 300,
	transitionDelay: 0,

	// Estrategias avanzadas
	cacheStrategy: 'memory',
	useWASM: false,

	// Animaciones
	reducedMotion: false,
	animationDuration: 300,
	animationMaxFPS: 60,
};

/**
 * Preset para rendimiento máximo
 * Prioriza el rendimiento sobre la calidad visual
 */
export const PERFORMANCE_PRESET: PerformanceOptions = {
	// Configuración general
	performanceMode: 'performance',
	enableCache: true,
	loadingStrategy: 'lazy',
	enablePreloading: false,
	enableHardwareAcceleration: true,

	// Optimización de renderizado
	useRAF: true,
	batchUpdates: true,
	throttleMs: 32, // ~30 FPS
	lazyLoad: true,
	prefetch: false,
	virtualizeList: true,

	// Optimización de imágenes
	imageOptimization: true,
	prefetchOnHover: false,

	// Tiempos y retardos
	debounceTime: 500,
	transitionDelay: 0,

	// Estrategias avanzadas
	cacheStrategy: 'memory',
	useWASM: false,

	// Animaciones
	reducedMotion: true,
	animationDuration: 200,
	animationMaxFPS: 30,
};

/**
 * Preset para dispositivos móviles
 * Optimizado para pantallas táctiles y conexiones potencialmente más lentas
 */
export const MOBILE_PRESET: PerformanceOptions = {
	// Configuración general
	performanceMode: 'performance',
	enableCache: true,
	loadingStrategy: 'lazy',
	enablePreloading: false,
	enableHardwareAcceleration: true,

	// Optimización de renderizado
	useRAF: true,
	batchUpdates: true,
	throttleMs: 32, // ~30 FPS
	lazyLoad: true,
	prefetch: false,
	virtualizeList: true,

	// Optimización de imágenes
	imageOptimization: true,
	prefetchOnHover: false, // No hay hover en móviles

	// Tiempos y retardos
	debounceTime: 500,
	transitionDelay: 50, // Pequeño retraso para evitar activaciones accidentales

	// Estrategias avanzadas
	cacheStrategy: 'memory',
	useWASM: false,

	// Animaciones
	reducedMotion: true,
	animationDuration: 200,
	animationMaxFPS: 30,
};

/**
 * Preset para conexiones lentas
 * Optimizado para conexiones de red limitadas
 */
export const LOW_BANDWIDTH_PRESET: PerformanceOptions = {
	// Configuración general
	performanceMode: 'performance',
	enableCache: true,
	loadingStrategy: 'lazy',
	enablePreloading: false,
	enableHardwareAcceleration: true,

	// Optimización de renderizado
	useRAF: true,
	batchUpdates: true,
	throttleMs: 64, // ~15 FPS
	lazyLoad: true,
	prefetch: false,
	virtualizeList: true,

	// Optimización de imágenes
	imageOptimization: true,
	prefetchOnHover: false,

	// Tiempos y retardos
	debounceTime: 800,
	transitionDelay: 100,

	// Estrategias avanzadas
	cacheStrategy: 'memory',
	useWASM: false,

	// Animaciones
	reducedMotion: true,
	animationDuration: 150,
	animationMaxFPS: 15,
};

/**
 * Preset para dispositivos de bajo rendimiento
 * Optimizado para hardware limitado
 */
export const LOW_END_DEVICE_PRESET: PerformanceOptions = {
	// Configuración general
	performanceMode: 'performance',
	enableCache: true,
	loadingStrategy: 'lazy',
	enablePreloading: false,
	enableHardwareAcceleration: false, // Hardware acceleration puede ser contraproducente en dispositivos de gama baja

	// Optimización de renderizado
	useRAF: true,
	batchUpdates: true,
	throttleMs: 100, // ~10 FPS
	lazyLoad: true,
	prefetch: false,
	virtualizeList: true,

	// Optimización de imágenes
	imageOptimization: true,
	prefetchOnHover: false,

	// Tiempos y retardos
	debounceTime: 1000,
	transitionDelay: 200,

	// Estrategias avanzadas
	cacheStrategy: 'memory',
	useWASM: false,

	// Animaciones
	reducedMotion: true,
	animationDuration: 100,
	animationMaxFPS: 10,
};

/**
 * Preset para modo accesibilidad
 * Optimizado para usuarios con preferencias de accesibilidad
 */
export const ACCESSIBILITY_PRESET: PerformanceOptions = {
	// Configuración general
	performanceMode: 'balanced',
	enableCache: true,
	loadingStrategy: 'progressive',
	enablePreloading: true,
	enableHardwareAcceleration: true,

	// Optimización de renderizado
	useRAF: true,
	batchUpdates: true,
	throttleMs: 32,
	lazyLoad: true,
	prefetch: true,
	virtualizeList: true,

	// Optimización de imágenes
	imageOptimization: true,
	prefetchOnHover: true,

	// Tiempos y retardos
	debounceTime: 400,
	transitionDelay: 100, // Retraso adicional para dar tiempo a procesar cambios

	// Estrategias avanzadas
	cacheStrategy: 'memory',
	useWASM: false,

	// Animaciones - Configuradas para accesibilidad
	reducedMotion: true,
	animationDuration: 500, // Animaciones más lentas para mejor legibilidad
	animationMaxFPS: 30,
};

/**
 * Función para obtener un preset según el nombre
 */
export function getPresetByName(name: string): PerformanceOptions {
	switch (name) {
		case 'quality':
			return QUALITY_PRESET;
		case 'performance':
			return PERFORMANCE_PRESET;
		case 'mobile':
			return MOBILE_PRESET;
		case 'low-bandwidth':
			return LOW_BANDWIDTH_PRESET;
		case 'low-end-device':
			return LOW_END_DEVICE_PRESET;
		case 'accessibility':
			return ACCESSIBILITY_PRESET;
		default:
			return BALANCED_PRESET;
	}
}

/**
 * Función para detectar el preset más adecuado según el entorno
 */
export function detectBestPreset(): string {
	if (typeof window === 'undefined') {
		return 'balanced'; // Valor por defecto para SSR
	}

	// Detectar si es un dispositivo móvil
	const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

	// Detectar si el usuario prefiere reducción de movimiento
	const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// Detectar conexión lenta (si la API está disponible)
	const hasSlowConnection =
		'connection' in navigator &&
		// @ts-expect-error - No todos los navegadores soportan esta API
		(navigator.connection.saveData ||
			// @ts-expect-error
			navigator.connection.effectiveType?.includes('2g'));

	// Detectar dispositivo de bajo rendimiento
	const isLowEndDevice =
		// @ts-expect-error
		(navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) ||
		// @ts-expect-error
		(navigator.deviceMemory && navigator.deviceMemory <= 2);

	// Detección de ahorro de datos - reducir efectos visuales
	const hasSaveDataMode =
		navigator.connection &&
		(navigator.connection.saveData ||
			// @ts-expect-error
			navigator.connection.effectiveType?.includes('2g'));

	// Aplicar lógica de detección
	if (prefersReducedMotion) {
		return 'accessibility';
	}

	if (hasSlowConnection) {
		return 'low-bandwidth';
	}

	if (isLowEndDevice) {
		return 'low-end-device';
	}

	if (isMobile) {
		return 'mobile';
	}

	// En caso de duda, usar el preset balanceado
	return 'balanced';
}
