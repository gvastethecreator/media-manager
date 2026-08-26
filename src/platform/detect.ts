export function isDesktopRuntime(): boolean {
	return typeof window !== 'undefined' && typeof (window as Window & { desktop?: unknown }).desktop !== 'undefined';
}
