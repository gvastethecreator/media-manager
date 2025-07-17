import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ViewType } from '@/components/views/types';
import { clientLogger } from '@/lib/logger/client-logger';
import { useUIStore } from '@/store/ui.store';

const logger = clientLogger.withContext('MainNavigation');

/**
 * Hook que proporciona funciones para la navegación principal - VERSIÓN TEMPORAL
 * Maneja la navegación entre vistas principales como configuración y desarrollo
 */
export function useMainNavigation() {
	const { toggleSettings } = useUIStore();
	const navigate = useNavigate();

	const handleOpenSettings = useCallback(() => {
		logger.info('⚙️ Abriendo configuración');
		navigate('/settings');
		toggleSettings();
	}, [toggleSettings, navigate]);

	const handleOpenDevelopment = useCallback(() => {
		logger.info('🛠️ Abriendo desarrollo');
		navigate('/development');
	}, [navigate]);

	const handleOpenEntityCards = useCallback(() => {
		logger.info('🃏 Abriendo entity cards');
		navigate('/entity-cards');
	}, [navigate]);

	const handleMainNavigate = useCallback(
		(id: ViewType) => {
			logger.info(`🧭 Navegando a: ${id}`);
			// Convertir ViewType a ruta
			const route = id === 'all-images' ? '/gallery' : `/${id}`;
			navigate(route);
		},
		[navigate]
	);

	return {
		handleOpenSettings,
		handleOpenDevelopment,
		handleOpenEntityCards,
		handleMainNavigate,
	};
}
