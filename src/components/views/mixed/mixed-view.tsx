import { Filter, Grid, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DocumentCard } from '@/components/cards/document-card/document-card';
import { FolderCard } from '@/components/cards/folder-card/folder-card';
import { ImageCard } from '@/components/cards/image-card/image-card';
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

	// State from each store
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

	// Local state
	const [selectedType, setSelectedType] = useState<FileType>('all');
	const [searchQuery, setSearchQuery] = useState('');
	const [isRetrying, setIsRetrying] = useState(false);

	// Load initial data
	useEffect(() => {
		logger.info('🔄 Loading data for all file types');
		fetchImages();
		fetchVideos();
		fetchDocuments();
		fetchAudios();
		fetchFolders();
	}, [fetchImages, fetchVideos, fetchDocuments, fetchAudios, fetchFolders]);

	// Combine all items with their type information
	const allItems = useMemo(() => {
		const items: (MixedItem & { itemType: FileType })[] = [];

		// Add images
		if (images && typeof images === 'object') {
			for (const image of Object.values(images)) {
				const imageWithStats = image as ImageWithStats;
				items.push({ ...imageWithStats, itemType: 'images' });
			}
		}

		// Add videos
		if (Array.isArray(videos)) {
			for (const video of videos) {
				items.push({ ...video, itemType: 'videos' });
			}
		} else {
			for (const video of Object.values((videos as Record<string, VideoWithStats>) || {})) {
				items.push({ ...video, itemType: 'videos' });
			}
		}

		// Add documents
		for (const document of documents) {
			items.push({ ...document, itemType: 'documents' });
		}

		// Add audio files
		for (const audio of audios) {
			items.push({ ...audio, itemType: 'audios' });
		}

		// Add folders
		for (const folder of folders) {
			items.push({ ...folder, itemType: 'folders' });
		}

		// Sort by modification date (newest first)
		return items.sort((a, b) => {
			const dateA = new Date(a.updatedAt || a.createdAt).getTime();
			const dateB = new Date(b.updatedAt || b.createdAt).getTime();
			return dateB - dateA;
		});
	}, [images, videos, documents, audios, folders]);

	// Filter items by the selected type and search query
	const filteredItems = useMemo(() => {
		let filtered = allItems;

		// Filter by type
		if (selectedType !== 'all') {
			filtered = filtered.filter((item) => item.itemType === selectedType);
		}

		// Filter by search query
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

	// Combined loading and error state
	const isLoading = imagesLoading || videosLoading || documentsLoading || audiosLoading || foldersLoading;
	const hasError = imagesError || videosError || documentsError || audiosError || foldersError;

	// Handle item selection
	const handleItemClick = useCallback(
		(item: MixedItem & { itemType: FileType }) => {
			logger.info(`🖱️ Selected item: ${item.name}, type: ${item.itemType}`);

			// Navigate according to the item type
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
					logger.warn(`Unrecognized item type: ${item.itemType}`);
			}
		},
		[navigateWithTransition]
	);

	// Handle retry
	const handleRetry = useCallback(async () => {
		if (isRetrying) {
			return;
		}

		setIsRetrying(true);
		logger.info('🔄 Retrying all file requests');

		try {
			await Promise.all([fetchImages(), fetchVideos(), fetchDocuments(), fetchAudios(), fetchFolders()]);
		} catch (error) {
			logger.error('❌ Retry failed:', error);
		} finally {
			setIsRetrying(false);
		}
	}, [isRetrying, fetchImages, fetchVideos, fetchDocuments, fetchAudios, fetchFolders]);

	// Render the card for each item type
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
							<p className="text-muted-foreground text-sm">Unsupported type: {item.itemType}</p>
							<p className="font-medium">{item.name}</p>
						</div>
					);
			}
		},
		[handleItemClick]
	);

	// Show the loading state
	if (isLoading && allItems.length === 0) {
		return <LoadingScreen message="Loading all files..." />;
	}

	// Show an error when no content could be loaded
	if (hasError && allItems.length === 0) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-4">
				<EmptyState
					actions={<Button onClick={handleRetry}>Retry</Button>}
					description="Some file types could not be loaded. Check your connection and try again."
					icon={Grid}
					title="Could not load files"
				/>
			</div>
		);
	}

	return (
		<div className={`flex h-full flex-col ${className}`}>
			{/* Header controls */}
			<div className="flex flex-col gap-4 border-b p-6">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Grid className="h-5 w-5" />
						<h1 className="font-bold text-2xl">All Files</h1>
						<span className="text-muted-foreground text-sm">({filteredItems.length} items)</span>
					</div>
					<div className="flex items-center gap-2">
						<Button disabled={isRetrying} onClick={handleRetry} size="sm" variant="outline">
							<RefreshCw className={`mr-2 h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
							{isRetrying ? 'Reloading...' : 'Reload'}
						</Button>
					</div>
				</div>

				{/* Filter and search controls */}
				<div className="flex items-center gap-4">
					<div className="flex items-center gap-2">
						<Filter className="h-4 w-4" />
						<Select onValueChange={(value: FileType) => setSelectedType(value)} value={selectedType}>
							<SelectTrigger className="w-40">
								<SelectValue placeholder="Filter by type" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All</SelectItem>
								<SelectItem value="images">Images</SelectItem>
								<SelectItem value="videos">Videos</SelectItem>
								<SelectItem value="documents">Documents</SelectItem>
								<SelectItem value="audios">Audio</SelectItem>
								<SelectItem value="folders">Folders</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<Input
						className="max-w-sm"
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search files..."
						value={searchQuery}
					/>
				</div>
			</div>

			{/* Main content */}
			<ScrollArea className="flex-1">
				<div className="p-6">
					{filteredItems.length === 0 ? (
						<EmptyState
							description={searchQuery ? `No files match "${searchQuery}"` : 'Upload a few files to see them here.'}
							icon={Grid}
							title={searchQuery ? 'No files found' : 'No files yet'}
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
 * 📝 Notes:
 * - Unified view for every file type
 * - Integrates image, video, document, audio, and folder stores
 * - File-type filtering
 * - Unified search across all items
 * - Type-specific cards
 * - Navigation to content views
 * - Combined loading and error handling
 * - Sorted by modification date
 */
