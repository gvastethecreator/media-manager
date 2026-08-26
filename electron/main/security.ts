import { DEV_WINDOW_ORIGIN, isAllowedDesktopChannel } from '../shared/ipc-contract';

export const SECURE_WEB_PREFERENCES = {
	allowRunningInsecureContent: false,
	contextIsolation: true,
	nodeIntegration: false,
	sandbox: true,
	webSecurity: true,
	webviewTag: false,
} as const;

export function isTrustedSender(frameUrl: string | undefined, expectedOrigin: string): boolean {
	if (!frameUrl) return false;
	try {
		return new URL(frameUrl).origin === new URL(expectedOrigin).origin;
	} catch {
		return false;
	}
}

export function assertDesktopChannel(channel: string): void {
	if (!isAllowedDesktopChannel(channel)) {
		throw new Error(`Blocked desktop channel: ${channel}`);
	}
}

export function developmentOrigin(): string {
	return DEV_WINDOW_ORIGIN;
}
