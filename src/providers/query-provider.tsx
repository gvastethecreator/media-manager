'use client';

import { queryClient } from '@/lib/web/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

// Importación dinámica de devtools solo en desarrollo
const ReactQueryDevtools = dynamic(
	() => import('@tanstack/react-query-devtools').then((mod) => ({ default: mod.ReactQueryDevtools })),
	{
		ssr: false,
		loading: () => null,
	}
);

export function QueryProvider({ children }: { children: ReactNode }) {
	return (
		<QueryClientProvider client={queryClient}>
			{children}
			{process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
		</QueryClientProvider>
	);
}
