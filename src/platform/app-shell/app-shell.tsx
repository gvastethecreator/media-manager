import App from '@/App';
import { AppProvider } from '@/providers/app-provider';

/**
 * App Shell canónico para composición de runtime.
 */
export function AppShell() {
	return (
		<AppProvider>
			<div className="root">
				<App />
			</div>
		</AppProvider>
	);
}
