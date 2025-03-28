'use client';

import { createContext, useContext, useEffect, useState } from 'react';

// Tipos de modos de visualización disponibles
export type CardDisplayMode = 'simple' | 'complex' | 'json' | 'skeleton';

// Información detallada sobre cada modo para depuración
export const DISPLAY_MODE_INFO = {
	simple: {
		name: 'Simple',
		description: 'Versión optimizada para rendimiento, sin efectos visuales avanzados',
		components: ['EntityCard', 'BaseCard'],
		performance: 'Alto rendimiento (5-10ms por tarjeta)',
		riskLevel: 'Bajo',
		color: 'blue',
	},
	complex: {
		name: 'Complejo',
		description: 'Versión completa con todas las características visuales y efectos',
		components: ['EntityCardAdapter', 'EffectsSystem', 'LayersSystem', '3DSystem'],
		performance: 'Rendimiento bajo (20-50ms por tarjeta)',
		riskLevel: 'Alto - Puede causar problemas en dispositivos de gama baja',
		color: 'purple',
	},
	skeleton: {
		name: 'Esqueleto',
		description: 'Estructura completa pero sin efectos visuales para pruebas modulares',
		components: ['EntityCardAdapter', 'LayersSystem'],
		performance: 'Rendimiento medio (10-20ms por tarjeta)',
		riskLevel: 'Medio',
		color: 'amber',
	},
	json: {
		name: 'JSON',
		description: 'Visualización de datos en formato JSON según el esquema de Prisma',
		components: ['JsonEntityCard'],
		performance: 'Rendimiento variable (depende del tamaño de los datos)',
		riskLevel: 'Bajo',
		color: 'teal',
	},
};

// Modo predeterminado SIEMPRE debe ser 'simple'
export const DEFAULT_DISPLAY_MODE: CardDisplayMode = 'simple';

// Interfaz del contexto
interface CardDisplayContextType {
	// Estado actual
	displayMode: CardDisplayMode;
	isMenuVisible: boolean;
	displayModeInfo: typeof DISPLAY_MODE_INFO;

	// Acciones
	setDisplayMode: (mode: CardDisplayMode) => void;
	toggleMenu: () => void;
	showMenu: () => void;
	hideMenu: () => void;
}

// Valor por defecto del contexto
const defaultContext: CardDisplayContextType = {
	displayMode: DEFAULT_DISPLAY_MODE,
	isMenuVisible: false,
	displayModeInfo: DISPLAY_MODE_INFO,
	setDisplayMode: () => {},
	toggleMenu: () => {},
	showMenu: () => {},
	hideMenu: () => {},
};

// Crear contexto
const CardDisplayContext = createContext<CardDisplayContextType>(defaultContext);

// Hook personalizado para acceder al contexto
export const useCardDisplay = () => useContext(CardDisplayContext);

// Componente proveedor del contexto
export function CardDisplayProvider({ children }: { children: React.ReactNode }) {
	// Estado para el modo de visualización - siempre empieza con 'simple'
	const [displayMode, setDisplayModeState] = useState<CardDisplayMode>(DEFAULT_DISPLAY_MODE);
	// Estado para la visibilidad del menú
	const [isMenuVisible, setIsMenuVisible] = useState(true);
	// Tiempo del último cambio de modo
	const [lastModeChange, setLastModeChange] = useState<Date | null>(null);

	// Cargar preferencias guardadas
	useEffect(() => {
		try {
			const savedMode = localStorage.getItem('cardDisplayMode');
			// Verificar si hay un modo guardado y es válido
			if (
				savedMode &&
				(savedMode === 'simple' || savedMode === 'complex' || savedMode === 'json' || savedMode === 'skeleton')
			) {
				// Si el modo guardado es 'complex', mostrar advertencia pero usar modo simple
				if (savedMode === 'complex') {
					if (process.env.NODE_ENV === 'development') {
						console.warn(
							'⚠️ Se encontró el modo complejo guardado pero se ha establecido simple por defecto para evitar problemas'
						);
					}
					// Restaurar a modo simple para evitar problemas
					localStorage.setItem('cardDisplayMode', DEFAULT_DISPLAY_MODE);
				} else {
					// Para otros modos válidos, usarlos normalmente
					setDisplayModeState(savedMode as CardDisplayMode);
					if (process.env.NODE_ENV === 'development') {
						console.info(`🔄 Modo de visualización cargado desde localStorage: ${savedMode}`);
					}
				}
			} else {
				// Si no hay modo guardado o es inválido, usar modo simple y guardarlo
				localStorage.setItem('cardDisplayMode', DEFAULT_DISPLAY_MODE);
				if (process.env.NODE_ENV === 'development') {
					console.info(`🔄 Modo de visualización por defecto establecido: ${DEFAULT_DISPLAY_MODE}`);
				}
			}
		} catch (error) {
			console.error('❌ Error al cargar preferencias de visualización:', error);
		}

		// Mensaje informativo al cargar
		if (process.env.NODE_ENV === 'development') {
			console.group('🎴 Sistema de visualización de tarjetas inicializado');
			console.info('ℹ️ Modos disponibles:', Object.keys(DISPLAY_MODE_INFO).join(', '));

			// Describir los módulos por modo
			for (const [mode, info] of Object.entries(DISPLAY_MODE_INFO)) {
				console.info(`📋 Modo ${info.name}:`, {
					description: info.description,
					capacidades: info.features,
					rendimiento: info.performance,
					complejidad: info.complexity,
				});
			}

			console.info('⚠️ Nota: El modo "complex" puede causar problemas de rendimiento');
			console.groupEnd();
		}
	}, []);

	// Función para cambiar el modo de visualización
	const setDisplayMode = (mode: CardDisplayMode) => {
		// Guardar el modo anterior para comparar
		const previousMode = displayMode;

		// Si se solicita modo complejo, mostrar advertencia adicional
		if (mode === 'complex') {
			if (process.env.NODE_ENV === 'development') {
				console.warn('⚠️⚠️⚠️ ADVERTENCIA: Estás cambiando al modo complejo que puede causar problemas de rendimiento ⚠️⚠️⚠️');
				console.warn('🔄 Para volver al modo simple si hay problemas, usa el menú');
			}
		}

		// Actualizar el estado
		setDisplayModeState(mode);
		setLastModeChange(new Date());

		// Guardar la preferencia
		try {
			localStorage.setItem('cardDisplayMode', mode);

			// Log detallado en modo desarrollo
			if (process.env.NODE_ENV === 'development') {
				console.group(`🔄 Cambio de modo de visualización: ${previousMode} → ${mode}`);
				console.info('ℹ️ Información del nuevo modo:', DISPLAY_MODE_INFO[mode]);

				// Advertencia si se cambia a modo complejo
				if (mode === 'complex') {
					console.warn('⚠️ Has activado el modo complejo que puede causar problemas de rendimiento');
					console.info('💡 Consejo: Si experimentas problemas, puedes regresar al modo simple con el menú flotante');
				}

				console.groupEnd();
			}
		} catch (error) {
			console.error('❌ Error al guardar preferencia de visualización:', error);
		}
	};

	// Funciones para controlar la visibilidad del menú
	const toggleMenu = () => {
		setIsMenuVisible((prev) => !prev);
		if (process.env.NODE_ENV === 'development') {
			console.info(`🔄 Menú de visualización ${isMenuVisible ? 'ocultado' : 'mostrado'}`);
		}
	};

	const showMenu = () => {
		setIsMenuVisible(true);
		if (process.env.NODE_ENV === 'development') {
			console.info('🔄 Menú de visualización mostrado');
		}
	};

	const hideMenu = () => {
		setIsMenuVisible(false);
		if (process.env.NODE_ENV === 'development') {
			console.info('🔄 Menú de visualización ocultado');
		}
	};

	// Valores del contexto
	const contextValue: CardDisplayContextType = {
		displayMode,
		isMenuVisible,
		displayModeInfo: DISPLAY_MODE_INFO,
		setDisplayMode,
		toggleMenu,
		showMenu,
		hideMenu,
	};

	return <CardDisplayContext.Provider value={contextValue}>{children}</CardDisplayContext.Provider>;
}
