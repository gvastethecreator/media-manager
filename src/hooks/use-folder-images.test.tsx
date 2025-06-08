import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { useFolderImages } from './use-folder-images';

jest.mock('@/lib/prisma', () => ({
	PrismaClient: jest.fn(() => ({})),
	prisma: {},
}));

const queryClient = new QueryClient();
const wrapper = ({ children }: { children: React.ReactNode }) => (
	<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useFolderImages', () => {
	it('debe retornar items vacíos si folderId es null', async () => {
		const { result } = renderHook(() => useFolderImages(null), { wrapper });
		expect(result.current.data?.items ?? []).toEqual([]);
	});
});
