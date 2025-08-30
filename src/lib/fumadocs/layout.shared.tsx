import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export function baseOptions(): BaseLayoutProps {
	return {
		nav: {
			title: 'Image Manager Docs',
		},
		links: [
			{
				text: 'Documentación',
				url: '/docs',
				active: 'nested-url',
			},
			{
				text: 'Volver a la App',
				url: '/',
			},
		],
	};
}
