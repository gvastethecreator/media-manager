'use client';

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { useNavigation } from '@/lib/utils/navigation-utils';
import type { ViewType } from '@/types/file-item';
import { ChevronRight, Home } from 'lucide-react';
import { motion } from 'motion/react';
import type React from 'react';

interface BreadcrumbsProps {
	currentView: ViewType;
	currentItem?: {
		id?: string | null;
		name?: string;
		path?: string;
		description?: string;
		color?: string;
		emoji?: string;
		count?: number;
		totalSize?: number;
		lastIndexed?: Date;
		createdAt?: Date;
		itemType?: string;
	};
}

interface BreadcrumbConfig {
	label: string;
	path: string;
	contentPath?: string;
	icon?: React.ReactNode;
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
	'world-items': { label: 'Objetos', path: '/world-items' },
	'world-item-content': {
		label: 'Objetos',
		path: '/world-items',
		contentPath: '/world-items',
	},
	settings: { label: 'Ajustes', path: '/settings' },
	development: { label: 'Desarrollo', path: '/development' },
	concepts: { label: 'Conceptos', path: '/concepts' },
	'concept-content': {
		label: 'Conceptos',
		path: '/concepts',
		contentPath: '/concepts',
	},
	prompts: { label: 'Prompts', path: '/prompts' },
	'prompt-content': {
		label: 'Prompts',
		path: '/prompts',
		contentPath: '/prompts',
	},
	notes: { label: 'Notas', path: '/notes' },
	'note-content': {
		label: 'Notas',
		path: '/notes',
		contentPath: '/notes',
	},
};

export function ViewBreadcrumbs({ currentView, currentItem }: BreadcrumbsProps) {
	const { navigateToHome, navigateToMainFromContent } = useNavigation();
	const config = BREADCRUMB_CONFIG[currentView];
	const isContentView = currentView.endsWith('-content');

	if (!config) {
		return (
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<Button
							variant="ghost"
							size="sm"
							className="p-0 h-7 text-primary hover:text-primary/80 font-medium cursor-pointer"
							onClick={navigateToHome}
						>
							<Home className="w-4 h-4 mr-1" />
							Inicio
						</Button>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>
		);
	}

	return (
		<motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<Button
							variant="ghost"
							size="sm"
							className="p-0 h-7 text-primary hover:text-primary/80 font-medium cursor-pointer"
							onClick={navigateToHome}
						>
							<Home className="w-4 h-4 mr-1" />
							Inicio
						</Button>
					</BreadcrumbItem>

					{isContentView && (
						<>
							<BreadcrumbSeparator>
								<ChevronRight className="h-4 w-4 text-muted-foreground" />
							</BreadcrumbSeparator>
							<BreadcrumbItem>
								<Button
									variant="ghost"
									size="sm"
									className="p-0 h-7 text-primary hover:text-primary/80 font-medium cursor-pointer"
									onClick={navigateToMainFromContent}
								>
									{config.label}
								</Button>
							</BreadcrumbItem>
						</>
					)}

					{isContentView && currentItem?.name && (
						<>
							<BreadcrumbSeparator>
								<ChevronRight className="h-4 w-4 text-muted-foreground" />
							</BreadcrumbSeparator>
							<BreadcrumbItem>
								<BreadcrumbPage className="text-sm font-medium text-foreground">
									{currentItem.emoji && <span className="mr-1">{currentItem.emoji}</span>}
									{currentItem.name}
								</BreadcrumbPage>
							</BreadcrumbItem>
						</>
					)}

					{!isContentView && (
						<>
							<BreadcrumbSeparator>
								<ChevronRight className="h-4 w-4 text-muted-foreground" />
							</BreadcrumbSeparator>
							<BreadcrumbItem>
								<BreadcrumbPage className="text-sm font-medium text-muted-foreground">{config.label}</BreadcrumbPage>
							</BreadcrumbItem>
						</>
					)}
				</BreadcrumbList>
			</Breadcrumb>
		</motion.div>
	);
}
