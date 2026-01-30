import { Filter, Grid, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DocumentCard } from '@/components/cards/document-card/document-card';
import { FolderCard } from '@/components/cards/folder-card/folder-card';
import { ImageCard } from '@/components/cards/image-card/index';
import { VideoCard } from '@/components/cards/video-card/video-card';
import { LoadingScreen } from '@/components/core/feedback/loading/loading-screen';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSeamlessNavigation } from '@/hooks/use-seamless-navigation';

import { clientLogger } from '@/lib/logger/client-logger';
import { useAudioStore } from '@/store/entities/audio';
import { useDocumentStore } from '@/store/entities/document';
import { useFolderStore } from '@/store/entities/folder';
import { useImageStore } from '@/store/entities/image';
import { useVideoStore } from '@/store/entities/video';
import type { AudioWithStats } from '@/types/entities/audio';
import type { DocumentWithStats } from '@/types/entities/document';
import type { FolderWithStats } from '@/types/entities/folder';
import type { ImageWithStats } from '@/types/entities/image';
import type { VideoWithStats } from '@/types/entities/video';

const logger = clientLogger.withContext('MixedView');

type FileType = 'all' | 'images' | 'videos' | 'documents' | 'audios' | 'folders';
type MixedItem = ImageWithStats | VideoWithStats | DocumentWithStats | AudioWithStats | FolderWithStats;

interface MixedViewProps {
	className?: string;
}

export default function MixedView({ className }: MixedViewProps) {
	const { navigateWithTransition } = useSeamlessNavigation();

	// Estados de los diferentes stores
	const images = useImageStore((state) => state.core.images);
	const imagesLoading = useImageStore((state) => state.core.isLoading);
	const imagesError = useImageStore((state) => state.core.error);
	const fetchImages = useImageStore((state) => state.fetchImages);

	const videos = useVideoStore((state) => state.videos);
	const videosLoading = useVideoStore((state) => state.isLoading);
	const videosError = useVideoStore((state) => state.error);
	const fetchVideos = useVideoStore((state) => state.fetchVideos);

	const documentsRecord = useDocumentStore((state) => state.documents);
	const documentsLoading = useDocumentStore((state) => state.isLoading);
	const documentsError = useDocumentStore((state) => state.error);
	const fetchDocuments = useDocumentStore((state) => state.fetchDocuments);
	const documents = Object.values(documentsRecord || {});

	const audios: AudioWithStats[] = useAudioStore((state) => state.audios) || [];
	const audiosLoading: boolean = useAudioStore((state) => state.isLoading);
	const audiosError: string | null = useAudioStore((state) => state.error) || null;
	const fetchAudios = useAudioStore((state) => state.fetchAudios);

	const foldersRecord = useFolderStore((state) => state.folders);
	const foldersLoading = useFolderStore((state) => state.isLoading);
	const foldersError = useFolderStore((state) => state.error);
	const fetchFolders = useFolderStore((state) => state.fetchFolders);
	const folders = Object.values(foldersRecord || {});

	// Estados locales
	const [selectedType, setSelectedType] = useState<FileType>('all');
	const [searchQuery, setSearchQuery] = useState('');
	const [isRetrying, setIsRetrying] = useState(false);

	// Cargar datos iniciales
	useEffect(() => {
		logger.info('🔄 Cargando datos de todos los tipos de archivos');
		fetchImages();
		fetchVideos();
		fetchDocuments();
		fetchAudios();
		fetchFolders();
	}, [fetchImages, fetchVideos, fetchDocuments, fetchAudios, fetchFolders]);

	// Combinar todos los elementos con información de tipo
	const allItems = useMemo(() => {
		const items: (MixedItem & { itemType: FileType })[] = [];

		// Agregar imágenes
		if (images && typeof images === 'object') {
			for (const image of Object.values(images)) {
				const imageWithStats = image as ImageWithStats;
				items.push({ ...imageWithStats, itemType: 'images' });
			}
		}

		// Agregar videos
		if (Array.isArray(videos)) {
			for (const video of videos) {
				items.push({ ...video, itemType: 'videos' });
			}
		} else {
			for (const video of Object.values((videos as Record<string, VideoWithStats>) || {})) {
				items.push({ ...video, itemType: 'videos' });
			}
		}

		// Agregar documentos
		for (const document of documents) {
			items.push({ ...document, itemType: 'documents' });
		}

		// Agregar audios
		for (const audio of audios) {
			items.push({ ...audio, itemType: 'audios' });
		}

		// Agregar carpetas
		for (const folder of folders) {
			items.push({ ...folder, itemType: 'folders' });
		}

		// Ordenar por fecha de modificación (más recientes primero)
		return items.sort((a, b) => {
			const dateA = new Date(a.updatedAt || a.createdAt).getTime();
			const dateB = new Date(b.updatedAt || b.createdAt).getTime();
			return dateB - dateA;
		});
	}, [images, videos, documents, audios, folders]);

	// Filtrar elementos según tipo seleccionado y búsqueda
	const filteredItems = useMemo(() => {
		let filtered = allItems;

		// Filtrar por tipo
		if (selectedType !== 'all') {
			filtered = filtered.filter((item) => item.itemType === selectedType);
		}

		// Filtrar por búsqueda
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase().trim();
			filtered = filtered.filter(
				(item) =>
					item.name.toLowerCase().includes(query) ||
					('description' in item && item.description && item.description.toLowerCase().includes(query))
			);
		}

		return filtered;
	}, [allItems, selectedType, searchQuery]);

	// Estados de carga y error combinados
	const isLoading = imagesLoading || videosLoading || documentsLoading || audiosLoading || foldersLoading;
	const hasError = imagesError || videosError || documentsError || audiosError || foldersError;

	// Manejar clic en elemento
	const handleItemClick = useCallback(
		(item: MixedItem & { itemType: FileType }) => {
			logger.info(`🖱️ Elemento seleccionado: ${item.name}, tipo: ${item.itemType}`);

			// Navegar según el tipo de elemento
			switch (item.itemType) {
				case 'images':
					navigateWithTransition(`/images/${item.id}`);
					break;
				case 'videos':
					navigateWithTransition(`/videos/${item.id}`);
					break;
				case 'documents':
					navigateWithTransition(`/documents/${item.id}`);
					break;
				case 'audios':
					navigateWithTransition(`/audios/${item.id}`);
					break;
				case 'folders':
					navigateWithTransition(`/folders/${item.id}`);
					break;
				default:
					logger.warn(`Tipo de elemento no reconocido: ${item.itemType}`);
			}
		},
		[navigateWithTransition]
	);

	// Manejar reintento
	const handleRetry = useCallback(async () => {
		if (isRetrying) {
			return;
		}

		setIsRetrying(true);
		logger.info('🔄 Reintentando carga de todos los archivos');

		try {
			await Promise.all([fetchImages(), fetchVideos(), fetchDocuments(), fetchAudios(), fetchFolders()]);
		} catch (error) {
			logger.error('❌ Error al reintentar:', error);
		} finally {
			setIsRetrying(false);
		}
	}, [isRetrying, fetchImages, fetchVideos, fetchDocuments, fetchAudios, fetchFolders]);

	// Renderizar card según tipo
	const renderCard = useCallback(
		(item: MixedItem & { itemType: FileType }) => {
			const key = `${item.itemType}-${item.id}`;

			switch (item.itemType) {
				case 'images':
					return (
						<ImageCard
							className="cursor-pointer transition-shadow hover:shadow-lg"
							imageId={item.id}
							key={key}
							onClick={() => handleItemClick(item)}
						/>
					);
				case 'videos':
					return (
						<VideoCard
							className="cursor-pointer transition-shadow hover:shadow-lg"
							key={key}
							onClick={() => handleItemClick(item)}
							video={item as VideoWithStats}
						/>
					);
				case 'documents':
					return (
						<DocumentCard
							className="cursor-pointer transition-shadow hover:shadow-lg"
							document={item as DocumentWithStats}
							key={key}
							onClick={() => handleItemClick(item)}
						/>
					);
				case 'folders':
					return (
						<FolderCard
							className="cursor-pointer transition-shadow hover:shadow-lg"
							folder={item as FolderWithStats}
							key={key}
							onClick={() => handleItemClick(item)}
						/>
					);
				default:
					return (
						<div className="rounded-lg border p-4" key={key}>
							<p className="text-muted-foreground text-sm">Tipo no soportado: {item.itemType}</p>
							<p className="font-medium">{item.name}</p>
						</div>
					);
			}
		},
		[handleItemClick]
	);

	// Mostrar estado de carga
	if (isLoading && allItems.length === 0) {
		return <LoadingScreen message="Cargando todos los archivos..." />;
	}

	// Mostrar error si hay problemas
	if (hasError && allItems.length === 0) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-4">
				<EmptyState
					actions={<Button onClick={handleRetry}>Reintentar</Button>}
					description="No se pudieron cargar algunos tipos de archivos. Verifica tu conexión e inténtalo de nuevo."
					icon={Grid}
					title="Error al cargar archivos"
				/>
			</div>
		);
	}

	return (
		<div className={`flex h-full flex-col ${className}`}>
			{/* Header con controles */}
			<div className="flex flex-col gap-4 border-b p-6">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Grid className="h-5 w-5" />
						<h1 className="font-bold text-2xl">Todos los Archivos</h1>
						<span className="text-muted-foreground text-sm">({filteredItems.length} elementos)</span>
					</div>
					<div className="flex items-center gap-2">
						<Button disabled={isRetrying} onClick={handleRetry} size="sm" variant="outline">
							<RefreshCw className={`mr-2 h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
							{isRetrying ? 'Recargando...' : 'Recargar'}
						</Button>
					</div>
				</div>

				{/* Controles de filtrado y búsqueda */}
				<div className="flex items-center gap-4">
					<div className="flex items-center gap-2">
						<Filter className="h-4 w-4" />
						<Select onValueChange={(value: FileType) => setSelectedType(value)} value={selectedType}>
							<SelectTrigger className="w-40">
								<SelectValue placeholder="Filtrar por tipo" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Todos</SelectItem>
								<SelectItem value="images">Imágenes</SelectItem>
								<SelectItem value="videos">Videos</SelectItem>
								<SelectItem value="documents">Documentos</SelectItem>
								<SelectItem value="audios">Audios</SelectItem>
								<SelectItem value="folders">Carpetas</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<Input
						className="max-w-sm"
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Buscar archivos..."
						value={searchQuery}
					/>
				</div>
			</div>

			{/* Contenido principal */}
			<ScrollArea className="flex-1">
				<div className="p-6">
					{filteredItems.length === 0 ? (
						<EmptyState
							description={
								searchQuery
									? `No se encontraron archivos que coincidan con "${searchQuery}"`
									: 'Comienza subiendo algunos archivos para verlos aquí.'
							}
							icon={Grid}
							title={searchQuery ? 'No se encontraron archivos' : 'No hay archivos disponibles'}
						/>
					) : (
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
							{filteredItems.map(renderCard)}
						</div>
					)}
				</div>
			</ScrollArea>
		</div>
	);
}

/**
 * 📝 Documentación:
 * - Vista unificada que muestra todos los tipos de archivos
 * - Integra múltiples stores (image, video, document, audio, folder)
 * - Sistema de filtrado por tipo de archivo
 * - Búsqueda unificada entre todos los elementos
 * - Cards apropiados para cada tipo de archivo
 * - Navegación a vistas de contenido específicas
 * - Manejo de estados de carga y error combinados
 * - Ordenación por fecha de modificación
 */
