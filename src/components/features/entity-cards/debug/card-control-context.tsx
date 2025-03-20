'use client';

import { createContext, useContext, useEffect, useState } from 'react';

// Estado simplificado para las características de la tarjeta
export interface CardControlStateSimple {
	enable3DEffect: boolean;
	enableHolographicEffect: boolean;
	enableGlowEffect: boolean;
	enableScanlines: boolean;
	enableAnimatedBorder: boolean;
	enableGrainEffect: boolean;
	showImages: boolean;
}

// Valores por defecto para el estado - TODOS los efectos desactivados por defecto
export const defaultControlState: CardControlStateSimple = {
	enable3DEffect: false,
	enableHolographicEffect: false,
	enableGlowEffect: false,
	enableScanlines: false,
	enableAnimatedBorder: false,
	enableGrainEffect: false,
	showImages: true, // Solo mostrar imágenes está activado
};

// Interfaz del contexto
interface CardControlContextType {
	state: CardControlStateSimple;
	setState: (state: CardControlStateSimple) => void;
}

// Crear contexto con valores por defecto
const CardControlContext = createContext<CardControlContextType>({
	state: defaultControlState,
	setState: () => { },
});

// Hook para usar el contexto
export const useCardControl = () => useContext(CardControlContext);

// Clave para almacenar en localStorage
const STORAGE_KEY = 'entity-card-features-config';

// Proveedor del contexto
export function CardControlProvider({ children }: { children: React.ReactNode }) {
	const [state, setStateInternal] = useState<CardControlStateSimple>(defaultControlState);

	// Cargar configuración guardada al inicio - con verificación de seguridad
	useEffect(() => {
		try {
			const savedConfig = localStorage.getItem(STORAGE_KEY);

			if (savedConfig) {
				const parsedConfig = JSON.parse(savedConfig) as Partial<CardControlStateSimple>;

				// Asegurar que todas las propiedades existan, usar valores por defecto para las faltantes
				const validatedConfig: CardControlStateSimple = {
					...defaultControlState, // Usar valores por defecto como base
					...parsedConfig, // Añadir valores guardados si existen
				};

				// Si estamos en desarrollo, mostrar qué configuración se está cargando
				if (process.env.NODE_ENV === 'development') {
					console.info('🔧 Configuración de características cargada:', validatedConfig);

					// Advertir si algún efecto está activado
					const enabledEffects = Object.entries(validatedConfig)
						.filter(([key, value]) => key.startsWith('enable') && value === true)
						.map(([key]) => key.replace('enable', ''));

					if (enabledEffects.length > 0) {
						console.warn('⚠️ Hay efectos activos que podrían afectar al rendimiento:', enabledEffects.join(', '));
					}
				}

				setStateInternal(validatedConfig);
			} else {
				// Si no hay configuración guardada, usar valores por defecto y guardarlos
				localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultControlState));
				if (process.env.NODE_ENV === 'development') {
					console.info('🔧 Configuración por defecto establecida (todos los efectos desactivados)');
				}
			}
		} catch (error) {
			console.error('❌ Error al cargar configuración de características:', error);
			// En caso de error, usar valores por defecto
			setStateInternal(defaultControlState);
		}
	}, []);

	// Función para actualizar el estado y guardarlo
	const setState = (newState: CardControlStateSimple) => {
		setStateInternal(newState);
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));

			if (process.env.NODE_ENV === 'development') {
				console.info('🔧 Configuración de características actualizada y guardada');

				// Mostrar qué efectos están activos/inactivos
				const enabledEffects = Object.entries(newState)
					.filter(([key, value]) => key.startsWith('enable') && value === true)
					.map(([key]) => key.replace('enable', ''));

				const disabledEffects = Object.entries(newState)
					.filter(([key, value]) => key.startsWith('enable') && value === false)
					.map(([key]) => key.replace('enable', ''));

				console.info('✅ Efectos activos:', enabledEffects.length ? enabledEffects.join(', ') : 'ninguno');
				console.info('❌ Efectos inactivos:', disabledEffects.join(', '));
			}
		} catch (error) {
			console.error('❌ Error al guardar configuración de características:', error);
		}
	};

	const contextValue = {
		state,
		setState,
	};

	return (
		<CardControlContext.Provider value={contextValue}>
			{children}
		</CardControlContext.Provider>
	);
}