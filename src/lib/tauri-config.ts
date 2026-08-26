import { isDesktopRuntime } from '@/platform/detect';

export const isTauri = (): boolean => isDesktopRuntime();

export const getAppConfig = () => {
	const isDesktop = isDesktopRuntime();
	return {
		apiBaseUrl: '/api',
		corsEnabled: !isDesktop,
		isBrowser: !isDesktop,
		isDesktop,
		useHashRouter: false,
	};
};

export const getOSInfo = async () => null;

export const tauriInvoke = async () => {
	throw new Error('Generic invoke is not available. Use window.desktop methods.');
};

export const initializeTauriApp = async () => {
	return getAppConfig();
};

export const useTauriConfig = () => getAppConfig();
