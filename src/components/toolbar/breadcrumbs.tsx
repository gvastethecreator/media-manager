'use client';

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import type { ViewType } from '@/types/file-item';
import { Home } from 'lucide-react';

interface BreadcrumbsProps {
	currentView: ViewType;
	currentItem?: {
		name?: string;
		path?: string;
	};
}

interface BreadcrumbConfig {
	label: string;
	path: string;
	contentPath?: string;
}

const BREADCRUMB_CONFIG: Record<ViewType, BreadcrumbConfig> = {
	files: { label: 'Archivos', path: '/files' },
	loading: { label: 'Cargando', path: '/loading' },
	'all-images': { label: 'Galería', path: '/gallery' },
	favorites: { label: 'Favoritos', path: '/favorites' },
	search: { label: 'Búsqueda', path: '/search' },
	collections: { label: 'Colecciones', path: '/collections' },
	'collection-content': {
		label: 'Colecciones',
		path: '/collections',
		contentPath: '/collections',
	},
	folders: { label: 'Carpetas', path: '/folders' },
	'folder-content': {
		label: 'Carpetas',
		path: '/folders',
		contentPath: '/folders',
	},
	tags: { label: 'Etiquetas', path: '/tags' },
	'tag-content': {
		label: 'Etiquetas',
		path: '/tags',
		contentPath: '/tags',
	},
	albums: { label: 'Álbumes', path: '/albums' },
	'album-content': {
		label: 'Álbumes',
		path: '/albums',
		contentPath: '/albums',
	},
	characters: { label: 'Personajes', path: '/characters' },
	'character-content': {
		label: 'Personajes',
		path: '/characters',
		contentPath: '/characters',
	},
	places: { label: 'Lugares', path: '/places' },
	'place-content': {
		label: 'Lugares',
		path: '/places',
		contentPath: '/places',
	},
	objects: { label: 'Objetos', path: '/objects' },
	'object-content': {
		label: 'Objetos',
		path: '/objects',
		contentPath: '/objects',
	},
	settings: { label: 'Ajustes', path: '/settings' },
	development: { label: 'Desarrollo', path: '/development' },
};

export function ViewBreadcrumbs({ currentView, currentItem }: BreadcrumbsProps) {
	const config = BREADCRUMB_CONFIG[currentView];
	const isContentView = currentView.endsWith('-content');

	const basePath = (
		<BreadcrumbList>
			<BreadcrumbItem>
				<BreadcrumbLink href="/" className="text-sm font-medium hover:text-foreground transition-colors">
					Inicio
				</BreadcrumbLink>
			</BreadcrumbItem>
			<BreadcrumbSeparator />
		</BreadcrumbList>
	);

	if (!config) {
		return basePath;
	}

	return (
		<Breadcrumb>
			<div className="flex items-center gap-1">
				<BreadcrumbItem>
					{isContentView ? (
						<>
							<BreadcrumbLink
								href={config.path}
								className="text-sm font-medium hover:text-foreground transition-colors"
							>
								{config.label}
							</BreadcrumbLink>
							<BreadcrumbSeparator />
							<BreadcrumbPage className="text-sm font-medium text-muted-foreground">{currentItem?.name}</BreadcrumbPage>
						</>
					) : (
						<BreadcrumbPage className="text-sm font-medium text-muted-foreground">{config.label}</BreadcrumbPage>
					)}
				</BreadcrumbItem>
			</div>
		</Breadcrumb>
	);
}
