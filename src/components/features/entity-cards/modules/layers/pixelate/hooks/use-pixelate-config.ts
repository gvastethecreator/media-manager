'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getPixelateConfig, updatePixelateConfig } from '../actions';
import type { PixelateConfig } from '../pixelate-schema';

interface UsePixelateConfigProps {
	entityId?: string;
	entityType: string;
}

interface UsePixelateConfigResult {
	config: PixelateConfig | null;
	isLoading: boolean;
	error: Error | null;
	updateConfig: (newConfig: Partial<PixelateConfig>) => Promise<void>;
	resetConfig: () => Promise<void>;
}

/**
 * Hook para gestionar la configuración de la capa de pixelado para una entidad
 */
export function usePixelateConfig({ entityId, entityType }: UsePixelateConfigProps): UsePixelateConfigResult {
	const [config, setConfig] = useState<PixelateConfig | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [error, setError] = useState<Error | null>(null);

	// Cargar configuración inicial
	useEffect(() => {
		async function loadConfig() {
			try {
				setIsLoading(true);
				setError(null);

				const response = await getPixelateConfig({ entityId, entityType });

				if (response.success && response.data) {
					setConfig(response.data);
				} else {
					setError(new Error(response.message || 'Error al cargar la configuración'));
					toast.error('Error al cargar la configuración de pixelado');
				}
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
				setError(new Error(errorMessage));
				toast.error(`Error al cargar la configuración: ${errorMessage}`);
			} finally {
				setIsLoading(false);
			}
		}

		loadConfig();
	}, [entityId, entityType]);

	/**
	 * Actualiza la configuración de pixelado
	 */
	const updateConfig = async (newConfig: Partial<PixelateConfig>): Promise<void> => {
		try {
			setIsLoading(true);

			// Combinar configuración actual con los nuevos valores
			const updatedConfig = {
				...config,
				...newConfig,
			};

			const response = await updatePixelateConfig({
				entityId,
				entityType,
				config: updatedConfig as PixelateConfig,
			});

			if (response.success && response.data) {
				setConfig(response.data);
				toast.success('Configuración de pixelado actualizada');
			} else {
				setError(new Error(response.message || 'Error al actualizar la configuración'));
				toast.error('Error al actualizar la configuración de pixelado');
			}
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			setError(new Error(errorMessage));
			toast.error(`Error al actualizar la configuración: ${errorMessage}`);
		} finally {
			setIsLoading(false);
		}
	};

	/**
	 * Restablece la configuración de pixelado a los valores predeterminados
	 */
	const resetConfig = async (): Promise<void> => {
		try {
			setIsLoading(true);

			// Obtener la configuración predeterminada
			const response = await getPixelateConfig({ entityType });

			if (response.success && response.data) {
				// Actualizar con los valores predeterminados pero manteniendo enabled y entityId
				await updateConfig({
					...response.data,
					enabled: config?.enabled || false,
				});

				toast.success('Configuración de pixelado restablecida');
			} else {
				setError(new Error(response.message || 'Error al restablecer la configuración'));
				toast.error('Error al restablecer la configuración de pixelado');
			}
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			setError(new Error(errorMessage));
			toast.error(`Error al restablecer la configuración: ${errorMessage}`);
		} finally {
			setIsLoading(false);
		}
	};

	return {
		config,
		isLoading,
		error,
		updateConfig,
		resetConfig,
	};
}
