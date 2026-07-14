import App from '@/App';
import { GlobalErrorHandler } from '@/components/core/global-error-handler';
import { AppProvider } from '@/providers/app-provider';

/**
 * App Shell canónico para composición de runtime.
 */
export function AppShell() {
	return (
		<GlobalErrorHandler>
			<AppProvider>
				<div className="root">
					<App />
				</div>
			</AppProvider>
		</GlobalErrorHandler>
	);
}
