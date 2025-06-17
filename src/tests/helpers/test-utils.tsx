// 🧪 Utilidades básicas para tests del Image Manager
// Helpers comunes reutilizables en toda la suite de tests

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type RenderOptions, render } from '@testing-library/react';
import { ReactElement } from 'react';

// 🎭 Mock de Next.js router
export const mockRouter = {
	push: jest.fn(),
	replace: jest.fn(),
	prefetch: jest.fn(),
	back: jest.fn(),
	pathname: '/',
	route: '/',
	query: {},
	asPath: '/',
	basePath: '',
	isLocaleDomain: true,
	isReady: true,
	isFallback: false,
	isPreview: false,
	events: {
		on: jest.fn(),
		off: jest.fn(),
		emit: jest.fn(),
	},
	reload: jest.fn(),
	beforePopState: jest.fn(),
};

// 🔧 Configurar mock de useRouter
jest.mock('next/router', () => ({
	useRouter: () => mockRouter,
}));

// 🔧 Configurar mock de next/navigation
jest.mock('next/navigation', () => ({
	useRouter: () => mockRouter,
	usePathname: () => '/',
	useSearchParams: () => new URLSearchParams(),
}));

// ⚙️ Configuración personalizada para React Query
const createTestQueryClient = () =>
	new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
				gcTime: 0,
			},
			mutations: {
				retry: false,
			},
		},
	});

// 🎨 Wrapper personalizado para renders con providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
	queryClient?: QueryClient;
}

export function renderWithProviders(ui: ReactElement, options: CustomRenderOptions = {}) {
	const { queryClient = createTestQueryClient(), ...renderOptions } = options;

	function Wrapper({ children }: { children: React.ReactNode }) {
		return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
	}

	return {
		...render(ui, { wrapper: Wrapper, ...renderOptions }),
		queryClient,
	};
}

// 🗂️ Datos de prueba para folder entities
export const mockFolder = {
	id: 'test-folder-id',
	name: 'Test Folder',
	path: '/test/path',
	isScanned: true,
	imageCount: 10,
	lastScanned: new Date('2025-06-05'),
	createdAt: new Date('2025-06-01'),
	updatedAt: new Date('2025-06-05'),
};

// 🏷️ Datos de prueba para tags
export const mockTag = {
	id: 'test-tag-id',
	name: 'test-tag',
	color: '#FF5733',
	emoji: '🏷️',
	description: 'Tag de prueba',
	createdAt: new Date('2025-06-01'),
	updatedAt: new Date('2025-06-05'),
};

// 🖼️ Datos de prueba para images
export const mockImage = {
	id: 'test-image-id',
	filename: 'test-image.jpg',
	path: '/test/path/test-image.jpg',
	size: 1024000,
	width: 1920,
	height: 1080,
	mimeType: 'image/jpeg',
	hash: 'abc123def456',
	folderId: 'test-folder-id',
	createdAt: new Date('2025-06-01'),
	updatedAt: new Date('2025-06-05'),
};

// 🧪 Utilidad para esperar async operations
export const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0));

// 🎯 Matchers personalizados exportados
export * from '@testing-library/jest-dom';
export * from '@testing-library/react';
// 📏 Helpers para testing de hooks
export { renderHook } from '@testing-library/react';
