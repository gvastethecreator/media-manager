import { clientLogger } from '@/lib/logger/client-logger';
import { useUIStore } from '@/store/ui.store';
import { ViewType } from '@/types/files';
import { useCallback } from 'react';

const logger = clientLogger.withContext('MainNavigation');

/**
 * Hook que proporciona funciones para la navegación principal - VERSIÓN TEMPORAL
 * Maneja la navegación entre vistas principales como configuración y desarrollo
 */
export function useMainNavigation() {
	const { setCurrentView, toggleSettings } = useUIStore();

	const handleOpenSettings = useCallback(() => {
		logger.info('⚙️ Abriendo configuración');
		setCurrentView('settings');
		toggleSettings();
	}, [toggleSettings, setCurrentView]);

	const handleOpenDevelopment = useCallback(() => {
		logger.info('🛠️ Abriendo desarrollo');
		setCurrentView('development');
	}, [setCurrentView]);

	const handleOpenEntityCards = useCallback(() => {
		logger.info('🃏 Abriendo entity cards');
		setCurrentView('entity-cards');
	}, [setCurrentView]);

	const handleMainNavigate = useCallback(
		(id: ViewType) => {
			logger.info(`🧭 Navegando a: ${id}`);
			setCurrentView(id);
		},
		[setCurrentView]
	);

	return {
		handleOpenSettings,
		handleOpenDevelopment,
		handleOpenEntityCards,
		handleMainNavigate,
	};
}
