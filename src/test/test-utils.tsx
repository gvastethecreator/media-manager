import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import React, { type ReactElement } from 'react';

/**
 * Creates a test QueryClient with sensible defaults for testing
 */
export const createTestQueryClient = () =>
	new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
				gcTime: 0, // Don't cache in tests
			},
			mutations: {
				retry: false,
			},
		},
	});

/**
 * Props for AllTheProviders wrapper
 */
interface AllTheProvidersProps {
	children: React.ReactNode;
}

/**
 * Wrapper component that provides all necessary providers for testing
 */
export const AllTheProviders = ({ children }: AllTheProvidersProps) => {
	const queryClient = createTestQueryClient();
	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

/**
 * Custom render function that wraps components with all necessary providers
 */
export const renderWithProviders = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) => {
	return render(ui, { wrapper: AllTheProviders, ...options });
};

// Re-export everything from @testing-library/react
export * from '@testing-library/react';

// Export renderWithProviders as render for convenience
export { renderWithProviders as render };
