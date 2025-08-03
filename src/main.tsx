import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AppProvider } from './providers/app-provider';

import './app/globals.css';
import './styles/globals.css';
import './styles/scrollbar.css';
import './styles/selecto.css';

const container = document.getElementById('root');
if (!container) {
	throw new Error('No se encontró el elemento root');
}

const root = createRoot(container);

root.render(
	<StrictMode>
		<AppProvider>
			<div className="root">
				<App />
			</div>
		</AppProvider>
	</StrictMode>
);
