import { DocsPage, DocsBody, DocsTitle, DocsDescription } from 'fumadocs-ui/page';
import type { ReactNode } from 'react';

export interface DocsPageProps {
	slug?: string[];
	title?: string;
	description?: string;
	children?: ReactNode;
}

export function DocsPageComponent({
	slug,
	title = 'Página de Documentación',
	description = 'Descripción de la página de documentación',
	children,
}: DocsPageProps) {
	return (
		<DocsPage>
			<DocsTitle>{title}</DocsTitle>
			<DocsDescription>{description}</DocsDescription>
			<DocsBody>{children || <div>Contenido de documentación en desarrollo...</div>}</DocsBody>
		</DocsPage>
	);
}
