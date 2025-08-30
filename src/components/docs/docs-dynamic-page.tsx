import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/page';
import { type ReactNode, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { utils } from '@/lib/fumadocs/source';

export function DocsDynamicPage() {
	const { pathname } = useLocation();

	const page = useMemo(() => {
		// Normalizar: '/docs' -> 'index', '/docs/x/y' -> 'x/y'
		const slug = pathname.replace(/^\/docs\/?/, '') || 'index';
		try {
			const slugs = slug === 'index' ? undefined : slug.split('/');
			return utils.getPage(slugs);
		} catch {
			return null;
		}
	}, [pathname]);

	if (!page) {
		return (
			<DocsPage>
				<DocsTitle>Documento no encontrado</DocsTitle>
				<DocsDescription>La ruta no corresponde a una página de documentación.</DocsDescription>
				<DocsBody>
					<p>Verifica el índice y navegación lateral.</p>
				</DocsBody>
			</DocsPage>
		);
	}

	const { title, description } = (page.data ?? {}) as { title?: string; description?: string };

	// El cuerpo puede venir como ReactNode o componente: normalizamos a ReactNode
	const rawBody = (page as unknown as Record<string, unknown>).body as unknown;
	const bodyNode: ReactNode | null =
		typeof rawBody === 'function' ? (rawBody as () => ReactNode)() : (rawBody as ReactNode);

	return (
		<DocsPage>
			<DocsTitle>{title ?? page.url}</DocsTitle>
			{description ? <DocsDescription>{description}</DocsDescription> : null}
			<DocsBody>{bodyNode}</DocsBody>
		</DocsPage>
	);
}
