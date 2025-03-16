import { useNavigationStore } from '@/components/navigation/navigation.store';
import { useUIStore } from '@/store/ui.store';
import type { ViewType } from '@/types/file-item';
import { useCallback } from 'react';

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

	const handleMainNavigate = useCallback(
		(id: ViewType) => {
			setCurrentView(id);
		},
		[setCurrentView]
	);

	return {
		handleOpenSettings,
		handleOpenDevelopment,
		handleMainNavigate,
	};
}
