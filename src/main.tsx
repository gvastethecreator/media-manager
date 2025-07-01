import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

import './app/globals.css';
import './styles/globals.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('No se encontró el elemento root');
}

const root = createRoot(container);

root.render(
  <StrictMode>
    <div className="root">
      <App />
    </div>
  </StrictMode>
);