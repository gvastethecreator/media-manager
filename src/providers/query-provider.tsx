'use client';

import { queryClient } from '@/lib/web/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { lazy, type ReactNode, Suspense } from 'react';

// Carga perezosa de Devtools solo en desarrollo y lado cliente
const ReactQueryDevtools =
	process.env.NODE_ENV === 'development'
		? lazy(() => import('@tanstack/react-query-devtools').then((mod) => ({ default: mod.ReactQueryDevtools })))
		: () => null;

export function QueryProvider({ children }: { children: ReactNode }) {
	return (
		<QueryClientProvider client={queryClient}>
			{children}
			{process.env.NODE_ENV === 'development' && (
				<Suspense fallback={null}>
					{/* @ts-expect-error -- Devtools solo se carga en modo dev */}
					<ReactQueryDevtools initialIsOpen={false} />
				</Suspense>
			)}
		</QueryClientProvider>
	);
}
