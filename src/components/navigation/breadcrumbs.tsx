'use client';

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import type { ViewType } from '@/types/file-item';
import { ChevronRight, CornerDownRight, Home } from 'lucide-react';
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
		_count?: { images: number };
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

const formatBytes = (bytes: number): string => {
	if (bytes === 0) {
		return '0 Bytes';
	}
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
};

const formatDate = (date: Date): string => {
	return new Intl.DateTimeFormat('es-ES', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	}).format(new Date(date));
};

export function ViewBreadcrumbs({ currentView, currentItem }: BreadcrumbsProps) {
	const { navigateToHome, navigateToMainFromContent } = useNavigationStore();
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
							className="p-0 h-8 text-primary hover:text-primary/80 font-medium cursor-pointer flex items-center gap-1"
							onClick={navigateToHome}
						>
							<Home className="w-4 h-4" />
							<span>Inicio</span>
						</Button>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>
		);
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: -5 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.15 }}
			className="flex items-center"
		>
			<Breadcrumb>
				<BreadcrumbList className="flex items-center gap-1">
					<BreadcrumbItem>
						<Button
							variant="ghost"
							size="sm"
							className="p-0 h-8 text-primary hover:text-primary/80 font-medium cursor-pointer flex items-center gap-1"
							onClick={navigateToHome}
						>
							<Home className="w-4 h-4" />
							<span>Inicio</span>
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
									className="p-0 h-8 text-primary hover:text-primary/80 font-medium cursor-pointer"
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
								<div className="flex flex-col gap-1">
									<div className="flex items-center min-w-0 overflow-hidden">
										<CornerDownRight className="h-2 w-2 text-muted mr-1 shrink-0" />
										{currentItem.emoji && <span className="text-xs shrink-0 mr-1">{currentItem.emoji}</span>}
										<span className="truncate font-medium">{currentItem.name}</span>
									</div>
									{currentItem.description && (
										<p className="text-xs text-muted-foreground line-clamp-1 pl-3">{currentItem.description}</p>
									)}
									<div className="flex items-center gap-2 text-xs text-muted-foreground pl-3">
										{currentItem._count?.images !== undefined && (
											<span className="inline-flex items-center space-x-0.5 px-1 rounded-sm bg-secondary/30">
												{currentItem._count.images} imágenes
											</span>
										)}
										{currentItem.totalSize !== undefined && <span>• {formatBytes(currentItem.totalSize)}</span>}
										{currentItem.lastIndexed && (
											<span>• Última actualización: {formatDate(currentItem.lastIndexed)}</span>
										)}
										{currentItem.createdAt && <span>• Creado: {formatDate(currentItem.createdAt)}</span>}
									</div>
								</div>
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
