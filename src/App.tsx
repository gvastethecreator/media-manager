/**
 * @file Componente principal de la aplicación
 * @module App
 */

import { RouterProvider } from 'react-router-dom';
import { router } from './router';

export function App() {
	return <RouterProvider router={router} />;
}

export default App;
