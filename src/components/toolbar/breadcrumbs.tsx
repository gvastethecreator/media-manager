'use client';

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import type { ViewType } from '@/store/navigation.store';
import {
	BookImage,
	Box,
	Camera,
	Home,
	Image as ImageIcon,
	MapPin,
	Search,
	Settings2,
	Star,
	TagIcon,
	User2,
} from 'lucide-react';

const BREADCRUMB_CONFIG: Record<ViewType, { label: string; icon: any }> = {
	'all-images': { label: 'Galería', icon: ImageIcon },
	favorites: { label: 'Favoritos', icon: Star },
	search: { label: 'Búsqueda', icon: Search },
	collections: { label: 'Colecciones', icon: BookImage },
	'collection-content': { label: 'Colecciones', icon: BookImage },
	folders: { label: 'Carpetas', icon: Home },
	'folder-content': { label: 'Carpetas', icon: Home },
	tags: { label: 'Etiquetas', icon: TagIcon },
	'tag-content': { label: 'Etiquetas', icon: TagIcon },
	albums: { label: 'Álbumes', icon: Camera },
	'album-content': { label: 'Álbumes', icon: Camera },
	characters: { label: 'Personajes', icon: User2 },
	'character-content': { label: 'Personajes', icon: User2 },
	places: { label: 'Lugares', icon: MapPin },
	'place-content': { label: 'Lugares', icon: MapPin },
	objects: { label: 'Objetos', icon: Box },
	'object-content': { label: 'Objetos', icon: Box },
	settings: { label: 'Ajustes', icon: Settings2 },
	development: { label: 'Desarrollo', icon: null },
	loading: { label: 'Cargando', icon: null },
	files: { label: 'Archivos', icon: null },
};

interface BreadcrumbsProps {
	currentView: ViewType;
	currentItem?: {
		name?: string;
		emoji?: string;
	};
}

export function ViewBreadcrumbs({ currentView, currentItem }: BreadcrumbsProps) {
	const config = BREADCRUMB_CONFIG[currentView];
	const isContentView = currentView.endsWith('-content');

	if (!config) {
		return (
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink href="/">Inicio</BreadcrumbLink>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>
		);
	}

	const Icon = config.icon;

	return (
		<Breadcrumb>
			<BreadcrumbList>
				{!isContentView ? (
					<BreadcrumbItem>
						<BreadcrumbPage className="flex items-center gap-2">
							{Icon && <Icon className="h-4 w-4" />}
							<span>{config.label}</span>
						</BreadcrumbPage>
					</BreadcrumbItem>
				) : (
					<>
						<BreadcrumbItem>
							<BreadcrumbLink href="/" className="flex items-center gap-2">
								{Icon && <Icon className="h-4 w-4" />}
								<span>{config.label}</span>
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage className="flex items-center gap-2">
								{currentItem?.emoji && <span>{currentItem.emoji}</span>}
								<span>{currentItem?.name}</span>
							</BreadcrumbPage>
						</BreadcrumbItem>
					</>
				)}
			</BreadcrumbList>
		</Breadcrumb>
	);
}
