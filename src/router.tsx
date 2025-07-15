import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '@/components/layout/main-layout';
import { DashboardView } from '@/components/views/dashboard/dashboard-view';

// import { MainLayoutTest } from '@/components/layout/main-layout-test';
// import { MainLayoutSimpleNavPanel } from '@/components/layout/main-layout-simple-navpanel';

// Componente NotFound simple
const NotFoundPage = () => {
	return (
		<div className="flex items-center justify-center min-h-screen bg-red-50 p-4">
			<div className="max-w-md w-full border border-red-200 rounded-lg p-6 text-center">
				<h1 className="text-2xl font-bold mb-4 text-red-800">Página no encontrada</h1>
				<p className="text-red-600 mb-4">La página que estás buscando no existe o ha sido movida.</p>
				<a href="/" className="text-red-700 hover:underline font-semibold">
					Volver al inicio
				</a>
			</div>
		</div>
	);
};

export const router = createBrowserRouter([
	{
		path: '/',
		element: <MainLayout />,
		children: [
			{
				index: true,
				element: <DashboardView />,
			},
		],
	},
	{
		path: '*',
		element: <NotFoundPage />,
	},
]);
