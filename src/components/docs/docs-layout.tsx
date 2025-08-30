import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { baseOptions } from '@/lib/fumadocs/layout.shared';
import { utils } from '@/lib/fumadocs/source';

export interface DocsLayoutProps {
	children: ReactNode;
}

// Mock tree para desarrollo inicial (sin acoplar a MDX aún)
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
			name: 'Arquitectura',
			children: [
				{
					type: 'page' as const,
					name: 'Visión General',
					url: '/docs/architecture',
				},
			],
		},
		{
			type: 'folder' as const,
			name: 'Backend',
			children: [
				{
					type: 'page' as const,
					name: 'Servicios y Rutas',
					url: '/docs/backend/services-and-routes',
				},
				{
					type: 'page' as const,
					name: 'Esquema de Base de Datos',
					url: '/docs/database/schema',
				},
			],
		},
		{
			type: 'folder' as const,
			name: 'Frontend',
			children: [
				{
					type: 'page' as const,
					name: 'Componentes y Stores',
					url: '/docs/frontend/components-and-stores',
				},
				{
					type: 'page' as const,
					name: 'Patrones de UI',
					url: '/docs/frontend/ui-patterns',
				},
			],
		},
		{
			type: 'folder' as const,
			name: 'Guías',
			children: [
				{
					type: 'page' as const,
					name: 'Flujo de Desarrollo',
					url: '/docs/dev-flow',
				},
				{
					type: 'page' as const,
					name: 'Testing',
					url: '/docs/testing',
				},
				{
					type: 'page' as const,
					name: 'Scripts',
					url: '/docs/scripts',
				},
			],
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
		{
			type: 'folder' as const,
			name: 'Referencias',
			children: [
				{
					type: 'page' as const,
					name: 'Glosario',
					url: '/docs/reference/glossary',
				},
			],
		},
	],
};

export function DocsLayoutComponent({ children }: DocsLayoutProps) {
	const tree = (() => {
		try {
			return utils.getPageTree();
		} catch {
			return mockTree;
		}
	})();

	return (
		<DocsLayout
			tree={tree as any}
			{...baseOptions()}
			sidebar={{
				defaultOpenLevel: 0,
			}}
		>
			{children}
		</DocsLayout>
	);
}
