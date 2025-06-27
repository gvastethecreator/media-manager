'use client';

/**
 * 🔄 Hook para gestionar datos en localStorage
 *
 * Este hook proporciona una interfaz tipada para guardar y recuperar
 * datos del localStorage, con soporte para valores por defecto.
 */

import { useCallback, useEffect, useState } from 'react';

/**
 * Hook para gestionar datos en localStorage con tipado genérico
 * @param key Clave para almacenar en localStorage
 * @param initialValue Valor inicial si no existe en localStorage
 * @returns [storedValue, setValue] - Valor almacenado y función para actualizarlo
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
	// Estado para almacenar el valor actual
	const [storedValue, setStoredValue] = useState<T>(initialValue);

	// Inicializar el valor desde localStorage o usar el valor inicial
	useEffect(() => {
		try {
			// Obtener del localStorage por clave
			const item = window.localStorage.getItem(key);
			// Analizar el elemento almacenado o devolver initialValue
			setStoredValue(item ? JSON.parse(item) : initialValue);
		} catch (error) {
			// Si hay error, usar el valor inicial
			console.error(`Error al recuperar ${key} de localStorage:`, error);
			setStoredValue(initialValue);
		}
	}, [key, initialValue]);

	// Función para actualizar el valor en localStorage
	const setValue = useCallback(
		(value: T | ((val: T) => T)) => {
			try {
				// Permitir que el valor sea una función para obtener el estado anterior
				const valueToStore = value instanceof Function ? value(storedValue) : value;
				// Guardar estado
				setStoredValue(valueToStore);
				// Guardar en localStorage
				if (typeof window !== 'undefined') {
					window.localStorage.setItem(key, JSON.stringify(valueToStore));
				}
			} catch (error) {
				console.error(`Error al guardar ${key} en localStorage:`, error);
			}
		},
		[key, storedValue]
	);

	return [storedValue, setValue];
}
