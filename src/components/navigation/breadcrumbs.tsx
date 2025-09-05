import { ChevronRight, CornerDownRight, Home } from 'lucide-react';
import React, { Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { motion } from '@/components/ui/motion-shim';
import { ViewType } from '@/components/views/types';

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
		// Para vistas de carpeta: cadena de breadcrumbs jerárquicos
		breadcrumbs?: Array<{ id: string; name: string; path: string }>;
	};
}

interface BreadcrumbConfig {
	label: string;
	path: string;
	contentPath?: string;
	icon?: React.ReactNode;
}

const BREADCRUMB_CONFIG: Record<ViewType, BreadcrumbConfig> & Record<string, BreadcrumbConfig> = {
	'': { label: 'Inicio', path: '/' },
	settings: { label: 'Ajustes', path: '/settings' },
	'all-images': { label: 'Galería', path: '/gallery' },
	'uploaded-images': { label: 'Imágenes Subidas', path: '/uploaded-images' },
	files: { label: 'Archivos', path: '/files' },
	favorites: { label: 'Favoritos', path: '/favorites' },
	search: { label: 'Búsqueda', path: '/search' },
	collections: { label: 'Colecciones', path: '/collections' },
	'collection-content': { label: 'Colecciones', path: '/collections', contentPath: '/collections' },
	folders: { label: 'Carpetas', path: '/folders' },
	'folder-content': { label: 'Carpetas', path: '/folders', contentPath: '/folders' },
	canvas: { label: 'Canvas', path: '/canvas' },
	chat: { label: 'Chat', path: '/chat' },
	tags: { label: 'Etiquetas', path: '/tags' },
	'tag-content': { label: 'Etiquetas', path: '/tags', contentPath: '/tags' },
	albums: { label: 'Álbumes', path: '/albums' },
	'album-content': { label: 'Álbumes', path: '/albums', contentPath: '/albums' },
	characters: { label: 'Personajes', path: '/characters' },
	'character-content': { label: 'Personajes', path: '/characters', contentPath: '/characters' },
	places: { label: 'Lugares', path: '/places' },
	'place-content': { label: 'Lugares', path: '/places', contentPath: '/places' },
	'world-items': { label: 'Objetos', path: '/world-items' },
	'world-item-content': { label: 'Objetos', path: '/world-items', contentPath: '/world-items' },
	concepts: { label: 'Conceptos', path: '/concepts' },
	'concept-content': { label: 'Conceptos', path: '/concepts', contentPath: '/concepts' },
	prompts: { label: 'Prompts', path: '/prompts' },
	'prompt-content': { label: 'Prompts', path: '/prompts', contentPath: '/prompts' },
	notes: { label: 'Notas', path: '/notes' },
	'note-content': { label: 'Notas', path: '/notes', contentPath: '/notes' },
	groups: { label: 'Grupos', path: '/groups' },
	'group-content': { label: 'Grupos', path: '/groups', contentPath: '/groups' },
	properties: { label: 'Propiedades', path: '/properties' },
	'property-content': { label: 'Propiedades', path: '/properties', contentPath: '/properties' },
	wildcards: { label: 'Wildcards', path: '/wildcards' },
	'wildcard-content': { label: 'Wildcards', path: '/wildcards', contentPath: '/wildcards' },
	'entity-cards': { label: 'Entity Cards', path: '/entity-cards' },
	development: { label: 'Desarrollo', path: '/development' },
	documents: { label: 'Documentos', path: '/documents' },
	'document-content': { label: 'Documentos', path: '/documents', contentPath: '/documents' },
	audios: { label: 'Audios', path: '/audios' },
	'audio-content': { label: 'Audios', path: '/audios', contentPath: '/audios' },
	'json-files': { label: 'Archivos JSON', path: '/json-files' },
	'json-file-content': { label: 'Archivos JSON', path: '/json-files', contentPath: '/json-files' },
	'file-3ds': { label: 'Archivos 3D', path: '/file-3ds' },
	'file-3d-content': { label: 'Archivos 3D', path: '/file-3ds', contentPath: '/file-3ds' },
	mixed: { label: 'Mixto', path: '/' },
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
	const navigate = useNavigate();
	const config = currentView ? BREADCRUMB_CONFIG[currentView] : undefined;
	const isContentView = currentView ? currentView.endsWith('-content') : false;
	const isFolderContent = currentView === 'folder-content';
	const crumbs = isFolderContent ? (currentItem?.breadcrumbs ?? []) : [];

	if (!(config && currentView)) {
		return (
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<Button
							className="flex h-6 cursor-pointer items-center gap-1 p-0 font-medium text-primary hover:text-primary/80"
							onClick={() => navigate('/')}
							size="sm"
							variant="ghost"
						>
							<Home className="h-3 w-3" />
						</Button>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>
		);
	}

	return (
		<motion.div
			animate={{ opacity: 1, y: 0 }}
			className="flex items-center"
			initial={{ opacity: 0, y: -5 }}
			transition={{ duration: 0.15 }}
		>
			<Breadcrumb>
				<BreadcrumbList className="flex items-center gap-0">
					<BreadcrumbItem>
						<Button
							className="flex h-6 cursor-pointer items-center gap-0.5 p-0 font-medium text-primary hover:text-primary/80"
							onClick={() => navigate('/')}
							size="sm"
							variant="ghost"
						>
							<Home className="h-3 w-3" />
						</Button>
					</BreadcrumbItem>

					{/* En vistas de contenido, enlazar al índice de la entidad */}
					{isContentView && (
						<>
							<BreadcrumbSeparator>
								<ChevronRight className="h-2 w-2 text-muted-foreground" />
							</BreadcrumbSeparator>
							<BreadcrumbItem>
								<Button
									className="h-6 cursor-pointer p-0 font-medium text-primary text-xs hover:text-primary/80"
									onClick={() => navigate(config.contentPath || config.path)}
									size="sm"
									variant="ghost"
								>
									{config.label}
								</Button>
							</BreadcrumbItem>
						</>
					)}

					{/* Si es folder-content, pintar cadena jerárquica real */}
					{isFolderContent &&
						crumbs.length > 0 &&
						crumbs.map((c, idx) => {
							const isLast = idx === crumbs.length - 1;
							return (
								<Fragment key={c.id}>
									<BreadcrumbSeparator>
										<ChevronRight className="h-2 w-2 text-muted-foreground" />
									</BreadcrumbSeparator>
									<BreadcrumbItem>
										{isLast ? (
											<BreadcrumbPage className="font-medium text-muted-foreground text-xs">{c.name}</BreadcrumbPage>
										) : (
											<Button
												className="h-6 cursor-pointer p-0 font-medium text-primary text-xs hover:text-primary/80"
												onClick={() => navigate(`/folders/${c.id}`)}
												size="sm"
												variant="ghost"
											>
												{c.name}
											</Button>
										)}
									</BreadcrumbItem>
								</Fragment>
							);
						})}

					{/* Fallback: si no hay breadcrumbs, mostrar nombre simple */}
					{isContentView && !isFolderContent && currentItem?.name && (
						<>
							<BreadcrumbSeparator>
								<ChevronRight className="h-2 w-2 text-muted-foreground" />
							</BreadcrumbSeparator>
							<BreadcrumbItem>
								<div className="flex min-w-0 items-center overflow-hidden">
									<CornerDownRight className="mr-0.5 h-2 w-2 shrink-0 text-muted" />
									{currentItem.emoji && <span className="mr-0.5 shrink-0 text-xs">{currentItem.emoji}</span>}
									<span className="truncate font-medium text-xs">{currentItem.name}</span>
								</div>
							</BreadcrumbItem>
						</>
					)}

					{!isContentView && (
						<>
							<BreadcrumbSeparator>
								<ChevronRight className="h-2 w-2 text-muted-foreground" />
							</BreadcrumbSeparator>
							<BreadcrumbItem>
								<BreadcrumbPage className="font-medium text-muted-foreground text-xs">{config.label}</BreadcrumbPage>
							</BreadcrumbItem>
						</>
					)}
				</BreadcrumbList>
			</Breadcrumb>
		</motion.div>
	);
}
