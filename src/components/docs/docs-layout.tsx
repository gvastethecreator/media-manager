import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { baseOptions } from '@/lib/fumadocs/layout.shared';

export interface DocsLayoutProps {
	children: ReactNode;
}

// Mock tree para desarrollo inicial
const mockTree = {
	name: 'Documentación',
	children: [
		{
			type: 'page' as const,
			name: 'Inicio',
			url: '/docs',
		},
		{
			type: 'page' as const,
			name: 'Guía Rápida',
			url: '/docs/quick-start',
		},
		{
			type: 'folder' as const,
			name: 'Características',
			children: [
				{
					type: 'page' as const,
					name: 'Gestión de Archivos',
					url: '/docs/features/file-management',
				},
			],
		},
	],
};

export function DocsLayoutComponent({ children }: DocsLayoutProps) {
	return (
		<DocsLayout
			tree={mockTree}
			{...baseOptions()}
			sidebar={{
				defaultOpenLevel: 0,
			}}
		>
			{children}
		</DocsLayout>
	);
}
