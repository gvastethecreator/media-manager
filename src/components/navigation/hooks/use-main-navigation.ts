import { useCallback } from 'react';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { useUIStore } from '@/store/ui.store';
import type { ViewType } from '@/types/files';

/**
 * Hook que proporciona funciones para la navegación principal
 * Maneja la navegación entre vistas principales como configuración y desarrollo
 */
export function useMainNavigation() {
	const { setCurrentView } = useNavigationStore();
	const { toggleSettings } = useUIStore();

	const handleOpenSettings = useCallback(() => {
		setCurrentView('settings');
		toggleSettings();
	}, [toggleSettings, setCurrentView]);

	const handleOpenDevelopment = useCallback(() => {
		setCurrentView('development');
	}, [setCurrentView]);

	const handleOpenEntityCards = useCallback(() => {
		setCurrentView('entity-cards');
	}, [setCurrentView]);

	const handleMainNavigate = useCallback(
		(id: ViewType) => {
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
