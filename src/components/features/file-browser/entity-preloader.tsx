import { useEffect, useMemo, useRef, useState } from 'react';
import { ALL_ENTITIES, PRIORITY_ENTITIES } from '@/constants/entities';
import { clientLogger } from '@/lib/logger/client-logger';
import { useEntityLoader } from './context-menu/hooks/use-entity-loader';

// Logger específico para el componente
const preloaderLogger = clientLogger.withContext('EntityPreloader');

type PreloaderMode = 'all' | 'priority' | 'custom';

interface EntityPreloaderProps {
	/**
	 * Modo de carga de entidades:
	 * - 'all': Carga todas las entidades definidas en ALL_ENTITIES
	 * - 'priority': Carga solo las entidades prioritarias definidas en PRIORITY_ENTITIES
	 * - 'custom': Carga solo las entidades especificadas en customEntities
	 */
	mode?: PreloaderMode;

	/**
	 * Lista personalizada de entidades a cargar (solo usado si mode es 'custom')
	 */
	customEntities?: string[];

	/**
	 * Función a ejecutar cuando la precarga se completa
	 */
	onPreloadComplete?: () => void;

	/**
	 * Si se establece en false, se omitirá la verificación global y siempre se ejecutará
	 * Útil solo para el preloader principal en layout.tsx
	 * @default true
	 */
	respectGlobalState?: boolean;
}

// Variable para evitar montajes múltiples en desarrollo
// Esta variable persiste entre renders pero no entre recargas de página
let preloaderInstanceCount = 0;
let mountAttemptTimestamp = 0;

/**
 * Componente que precarga entidades necesarias para la aplicación
 *
 * Este componente no renderiza nada visible, pero se encarga de cargar
 * las entidades necesarias en el store global para que estén disponibles
 * para todos los componentes.
 */
export function EntityPreloader({
	mode = 'priority',
	customEntities = [],
	onPreloadComplete,
	respectGlobalState = true,
}: EntityPreloaderProps) {
	const { loadEntityData } = useEntityLoader();
	const hasPreloadedRef = useRef(false);
	const isUnmountingRef = useRef(false);
	const preloadStartRef = useRef<number | null>(null);
	const [isPreloading, setIsPreloading] = useState(false);
	const instanceIdRef = useRef(`preloader-${Date.now()}-${Math.floor(Math.random() * 1000)}`);

	// Memoizar la verificación de estado global para reducir recálculos
	const shouldSkipPreload = useMemo(
		() => respectGlobalState && typeof window !== 'undefined' && window.entityPreloadComplete === true,
		[respectGlobalState]
	);

	// Detectar montajes redundantes
	useEffect(() => {
		// Incrementar contador de instancias activas
		preloaderInstanceCount++;
		const now = Date.now();
		const timeSinceLastMount = now - mountAttemptTimestamp;
		mountAttemptTimestamp = now;

		// Detectar montajes rápidos que pueden indicar un ciclo
		if (timeSinceLastMount < 100 && preloaderInstanceCount > 1) {
			preloaderLogger.warn(
				`⚠️ Posible ciclo de montaje detectado (${preloaderInstanceCount} instancias, ${timeSinceLastMount}ms)`
			);
		}

		if (process.env.NODE_ENV === 'development') {
			preloaderLogger.info(`🔄 EntityPreloader montado (modo: ${mode}, instancia: ${instanceIdRef.current})`, {
				respectGlobalState,
				shouldSkipPreload,
				customEntities: mode === 'custom' ? customEntities : undefined,
				activeInstances: preloaderInstanceCount,
			});
		}

		return () => {
			isUnmountingRef.current = true;
			preloaderInstanceCount--;

			if (process.env.NODE_ENV === 'development') {
				preloaderLogger.info(`🧹 EntityPreloader desmontado (modo: ${mode}, instancia: ${instanceIdRef.current})`);
			}
		};
	}, [mode, customEntities, respectGlobalState, shouldSkipPreload]);

	// Efecto para prevenir precarga múltiple
	useEffect(() => {
		// Si ya se ha preloaded o está preloading, no hacer nada
		if (hasPreloadedRef.current || isPreloading || isUnmountingRef.current) {
			return;
		}

		// Si la precarga ya ocurrió a nivel global, simplemente notificar y terminar
		if (shouldSkipPreload) {
			preloaderLogger.info(`✅ Entidades ya precargadas globalmente, omitiendo precarga (${instanceIdRef.current})`);

			// Notificar que no fue necesario precargar
			if (onPreloadComplete && !isUnmountingRef.current) {
				onPreloadComplete();
			}

			return;
		}

		// Determinar qué entidades debemos cargar
		let entitiesToPreload: string[] = [];

		switch (mode) {
			case 'all':
				entitiesToPreload = ALL_ENTITIES;
				break;
			case 'priority':
				entitiesToPreload = PRIORITY_ENTITIES;
				break;
			case 'custom':
				entitiesToPreload = customEntities;
				break;
		}

		if (entitiesToPreload.length === 0) {
			preloaderLogger.warn('⚠️ No hay entidades especificadas para precargar');
			return;
		}

		// Verificar si ya hay una precarga en progreso
		if (typeof window !== 'undefined' && window.entityPreloadInProgress) {
			preloaderLogger.info('⏳ Hay otra precarga en progreso, esperando...');

			// Establecer un intervalo para verificar cuando la precarga global se complete
			const checkInterval = setInterval(() => {
				if (isUnmountingRef.current) {
					clearInterval(checkInterval);
					return;
				}

				if (typeof window !== 'undefined' && window.entityPreloadComplete) {
					clearInterval(checkInterval);
					preloaderLogger.info('✅ Precarga global completada por otro componente');

					if (onPreloadComplete && !isUnmountingRef.current) {
						onPreloadComplete();
					}
				}
			}, 500);

			// Limpiar el intervalo si el componente se desmonta
			return () => {
				clearInterval(checkInterval);
			};
		}

		// Prevenir re-entradas de precargas
		if (preloadStartRef.current) {
			const timeSinceLastPreload = Date.now() - preloadStartRef.current;
			if (timeSinceLastPreload < 1000) {
				preloaderLogger.warn(`⚠️ Intento de precarga muy frecuente (${timeSinceLastPreload}ms), posible ciclo`);
				return;
			}
		}

		preloadStartRef.current = Date.now();
		hasPreloadedRef.current = true;
		setIsPreloading(true);

		// Marcar globalmente que una precarga está en progreso
		if (typeof window !== 'undefined') {
			window.entityPreloadInProgress = true;
		}

		preloaderLogger.info(
			`🚀 Iniciando precarga de ${entitiesToPreload.length} entidades (modo: ${mode}, instancia: ${instanceIdRef.current})`
		);

		const preloadEntities = async () => {
			try {
				// Agrupar entidades para cargar en orden con prioridades
				// Primero las entidades críticas, luego el resto
				const criticalEntities = entitiesToPreload.filter((e) => e === 'collections' || e === 'tags' || e === 'albums');
				const nonCriticalEntities = entitiesToPreload.filter(
					(e) => e !== 'collections' && e !== 'tags' && e !== 'albums'
				);

				// Primero cargar las entidades críticas en secuencia (no en paralelo)
				for (const criticalEntity of criticalEntities) {
					if (isUnmountingRef.current) break;

					try {
						await loadEntityData(criticalEntity as any).catch((err) => {
							preloaderLogger.warn(`⚠️ Error al precargar entidad crítica ${criticalEntity}:`, err);
							return []; // Continuar con las siguientes entidades críticas
						});
						// Breve pausa entre cargas críticas para evitar sobrecarga
						await new Promise((resolve) => setTimeout(resolve, 100));
					} catch (error) {
						preloaderLogger.warn(`⚠️ Error no manejado al cargar entidad crítica ${criticalEntity}:`, error);
						// Continuamos con la siguiente entidad crítica
					}
				}

				// Ahora cargar las entidades no críticas en paralelo
				if (!isUnmountingRef.current) {
					const nonCriticalPromises = nonCriticalEntities.map((entityName) =>
						loadEntityData(entityName as any).catch((err) => {
							preloaderLogger.warn(`⚠️ Error al precargar ${entityName}:`, err);
							return []; // Devolver array vacío en caso de error
						})
					);

					// Usar allSettled para manejar errores sin bloquear
					await Promise.allSettled(nonCriticalPromises);
				}

				// Prevenir actualización de estado si el componente está desmontándose
				if (isUnmountingRef.current) {
					preloaderLogger.info('🛑 El componente se está desmontando, cancelando precarga');
					return;
				}

				// Registrar finalización exitosa
				preloaderLogger.info(`✅ Precarga completada (instancia: ${instanceIdRef.current})`);

				// Si estamos en modo "all" o somos el preloader principal (no respetamos estado global),
				// marcar como precarga global completada
				if ((mode === 'all' || !respectGlobalState) && typeof window !== 'undefined') {
					window.entityPreloadComplete = true;
					window.entityPreloadInProgress = false;
					preloaderLogger.info(`🏁 Precarga global marcada como completada (${instanceIdRef.current})`);
				}

				// Notificar que la precarga se completó solo si el componente sigue montado
				if (onPreloadComplete && !isUnmountingRef.current) {
					onPreloadComplete();
				}
			} catch (error) {
				preloaderLogger.warn('⚠️ Error durante la precarga de entidades:', error);

				// A pesar del error, marcar como completa para no bloquearnos
				if ((mode === 'all' || !respectGlobalState) && typeof window !== 'undefined') {
					window.entityPreloadComplete = true;
					window.entityPreloadInProgress = false;
					preloaderLogger.info(
						`🏁 Precarga global marcada como completada a pesar de errores (${instanceIdRef.current})`
					);
				}

				// Aún así, notificar la completación para seguir adelante
				if (onPreloadComplete && !isUnmountingRef.current) {
					onPreloadComplete();
				}
			} finally {
				if (!isUnmountingRef.current) {
					setIsPreloading(false);
				}
			}
		};

		preloadEntities();

		// Añadir timeouts de seguridad para evitar que precarga se quede atascada
		// Usar un timeout más largo (60 segundos en vez de 30)
		const maxPreloadTime = 60000; // 60 segundos como límite absoluto
		const safetyTimeout = setTimeout(() => {
			if (typeof window !== 'undefined' && window.entityPreloadInProgress) {
				preloaderLogger.warn(`⚠️ Tiempo máximo de precarga alcanzado (${maxPreloadTime}ms), forzando finalización`);
				window.entityPreloadInProgress = false;
				window.entityPreloadComplete = true;

				if (!isUnmountingRef.current) {
					setIsPreloading(false);
					if (onPreloadComplete) {
						onPreloadComplete();
					}
				}
			}
		}, maxPreloadTime);

		// Limpiar estados si el componente se desmonta durante la precarga
		return () => {
			clearTimeout(safetyTimeout);

			if (isPreloading && typeof window !== 'undefined') {
				// Solo limpiar si este era el preloader principal
				if (!respectGlobalState) {
					window.entityPreloadInProgress = false;
				}
			}
		};
	}, [mode, customEntities, shouldSkipPreload, onPreloadComplete, loadEntityData, isPreloading, respectGlobalState]);

	// Este componente no renderiza nada visible
	return null;
}
