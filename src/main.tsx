import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppShell } from '@/platform/app-shell/app-shell';

import './app/globals.css';
import './styles/globals.css';
import './styles/scrollbar.css';
import './styles/selecto.css';
import './styles/view-transition.css';

if (import.meta.env.DEV) {
	void import('react-grab');
}

const container = document.getElementById('root');
if (!container) {
	throw new Error('No se encontró el elemento root');
}

const root = createRoot(container);

root.render(
	<StrictMode>
		<AppShell />
	</StrictMode>
);
