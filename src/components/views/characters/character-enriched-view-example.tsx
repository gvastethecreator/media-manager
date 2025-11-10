/**
 * @file Ejemplo de vista enriquecida de personaje
 * @module components/views/characters/character-enriched-view-example
 * @description Demostración de cómo crear una vista completa usando componentes existentes
 */

import { useState, useMemo } from 'react';
import { Users, Image, Video, PencilIcon, TrashIcon } from 'lucide-react';
import { EntityHeader } from '@/components/ui/entity-header';
import { ContentFilters } from '@/components/ui/content-filters';
import { FileBrowser } from '@/components/features/file-browser/file-browser';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCharacterStore } from '@/store/entities/character';
import {
	useCharacter,
	useCharacterImages,
	useRecentCharacterMedia,
	useRelatedCharacters,
	useUpdateCharacter,
	useDeleteCharacter,
} from '@/lib/api/characters';
import { toastService } from '@/lib/ui/toast';
import type { AnyEntityWithStats } from '@/types/entities';

export function CharacterEnrichedViewExample() {
	const { selectedCharacterId } = useCharacterStore();

	// React Query hooks
	const { data: character, isLoading } = useCharacter(selectedCharacterId || '');
	const { data: images = [], isLoading: loadingImages } = useCharacterImages(selectedCharacterId || '');
	const { data: recentMedia = [], isLoading: loadingMedia } = useRecentCharacterMedia(selectedCharacterId || '', 50);
	const { data: relatedCharacters = [], isLoading: loadingRelated } = useRelatedCharacters(
		selectedCharacterId || '',
		20
	);

	const updateMutation = useUpdateCharacter();
	const deleteMutation = useDeleteCharacter();

	// Estados locales
	const [searchQuery, setSearchQuery] = useState('');
	const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
	const [activeTab, setActiveTab] = useState('images');
	const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

	// Filtrar items según búsqueda y filtros
	const filteredImages = useMemo(() => {
		return images.filter((img) => {
			const matchesSearch = img.name.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesFavorite = !showOnlyFavorites || img.isFavorite;
			return matchesSearch && matchesFavorite;
		});
	}, [images, searchQuery, showOnlyFavorites]);

	const filteredRecentMedia = useMemo(() => {
		return recentMedia.filter((item) => item.name?.toLowerCase() || ''.includes(searchQuery.toLowerCase()));
	}, [recentMedia, searchQuery]);

	// Handlers
	const handleToggleFavorite = async () => {
		if (!character) return;

		try {
			await updateMutation.mutateAsync({
				id: character.id,
				data: { isFavorite: !character.isFavorite },
			});
			toastService.success(character.isFavorite ? 'Quitado de favoritos' : 'Agregado a favoritos');
		} catch (error) {
			toastService.error('Error al actualizar favorito');
		}
	};

	const handleEdit = () => {
		toastService.info('Función de edición en desarrollo');
	};

	const handleDelete = async () => {
		if (!character || !confirm(`¿Estás seguro de eliminar el personaje "${character.name}"?`)) {
			return;
		}

		try {
			await deleteMutation.mutateAsync(character.id);
			toastService.success('Personaje eliminado');
		} catch (error) {
			toastService.error('Error al eliminar personaje');
		}
	};

	const handleItemClick = (item: AnyEntityWithStats) => {
		console.log('Item clicked:', item);
		// TODO: Abrir panel de detalles o modal
	};

	// Loading state
	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-full p-8">
				<div className="text-gray-500">Cargando personaje...</div>
			</div>
		);
	}

	// No character selected
	if (!character) {
		return (
			<div className="flex flex-col items-center justify-center h-full p-8 text-gray-500">
				<Users className="w-16 h-16 mb-4 opacity-50" />
				<p className="text-lg font-medium">No hay personaje seleccionado</p>
				<p className="text-sm mt-2">Selecciona un personaje para ver sus detalles</p>
			</div>
		);
	}

	return (
		<div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
			<div className="flex-none p-6 space-y-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
				{/* Header enriquecido con toda la información */}
				<EntityHeader
					title={character.name}
					subtitle={character.species || character.occupation || undefined}
					description={character.description || undefined}
					icon={<Users className="w-5 h-5" />}
					primaryColor={character.color || '#3b82f6'}
					stats={[
						{ label: 'Imágenes', value: character._count?.images || 0, icon: <Image className="w-4 h-4" /> },
						{ label: 'Videos', value: character._count?.videos || 0, icon: <Video className="w-4 h-4" /> },
						{ label: 'Related', value: relatedCharacters.length, icon: <Users className="w-4 h-4" /> },
					]}
					actions={[
						{ label: 'Editar', icon: <PencilIcon className="w-4 h-4" />, onClick: handleEdit, variant: 'outline' },
						{
							label: 'Eliminar',
							icon: <TrashIcon className="w-4 h-4" />,
							onClick: handleDelete,
							variant: 'destructive',
							inDropdown: true,
						},
					]}
					isFavorite={character.isFavorite}
					onToggleFavorite={handleToggleFavorite}
					showFavoriteButton
					backUrl="/characters"
					backLabel="Volver a personajes"
					featuredImage={character.featuredImage || undefined}
				/>

				{/* Información adicional con badges */}
				<div className="flex flex-wrap gap-2">
					{character.age && (
						<Badge variant="secondary">
							Edad: {character.age}
						</Badge>
					)}
					{character.gender && (
						<Badge variant="secondary">
							{character.gender}
						</Badge>
					)}
					{character.class && (
						<Badge variant="outline" style={{ borderColor: character.color || undefined }}>
							{character.class}
						</Badge>
					)}
					{character.level && (
						<Badge variant="outline">
							Nivel {character.level}
						</Badge>
					)}
				</div>

				{/* Tabs para diferentes tipos de contenido */}
				<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
					<TabsList className="w-full justify-start">
						<TabsTrigger value="images">
							<Image className="w-4 h-4 mr-2" />
							Imágenes ({images.length})
						</TabsTrigger>
						<TabsTrigger value="recent">
							<Video className="w-4 h-4 mr-2" />
							Media Reciente ({recentMedia.length})
						</TabsTrigger>
						<TabsTrigger value="related">
							<Users className="w-4 h-4 mr-2" />
							Relacionados ({relatedCharacters.length})
						</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>

			{/* Contenido scrolleable */}
			<div className="flex-1 overflow-auto">
				<div className="p-6 space-y-4">
					{/* Filtros y búsqueda */}
					<ContentFilters
						searchValue={searchQuery}
						onSearchChange={setSearchQuery}
						searchPlaceholder={`Buscar en ${activeTab}...`}
						viewMode={viewMode}
						onViewModeChange={setViewMode}
						filterGroups={
							activeTab === 'images'
								? [
										{
											label: 'Filtros',
											options: [
												{
													label: 'Solo favoritos',
													value: 'favorites',
													checked: showOnlyFavorites,
													onChange: setShowOnlyFavorites,
												},
											],
										},
									]
								: []
						}
						showResultCount
						resultCount={
							activeTab === 'images'
								? filteredImages.length
								: activeTab === 'recent'
									? filteredRecentMedia.length
									: relatedCharacters.length
						}
						resultLabel={activeTab === 'images' ? 'imagen' : activeTab === 'recent' ? 'item' : 'personaje'}
					/>

					{/* Contenido de cada tab */}
					<div className="mt-4">
						{activeTab === 'images' && (
							<FileBrowser
								className="h-full"
								isLoading={loadingImages}
								items={filteredImages as unknown as AnyEntityWithStats[]}
								onItemClick={handleItemClick}
							/>
						)}

						{activeTab === 'recent' && (
							<FileBrowser className="h-full" isLoading={loadingMedia} items={filteredRecentMedia as unknown as AnyEntityWithStats[]} onItemClick={handleItemClick} />
						)}

						{activeTab === 'related' && (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
								{relatedCharacters.map((relatedChar: any) => (
									<Card key={relatedChar.id} className="cursor-pointer hover:shadow-lg transition-shadow">
										<CardHeader>
											<div className="flex items-center gap-2">
												<div
													className="w-10 h-10 rounded-full flex items-center justify-center text-2xl"
													style={{ backgroundColor: relatedChar.color + '20' || '#3b82f620' }}
												>
													{relatedChar.emoji || '👤'}
												</div>
												<div>
													<CardTitle className="text-base">{relatedChar.name}</CardTitle>
													{relatedChar.species && (
														<CardDescription className="text-xs">{relatedChar.species}</CardDescription>
													)}
												</div>
											</div>
										</CardHeader>
										{relatedChar.description && (
											<CardContent>
												<p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{relatedChar.description}</p>
											</CardContent>
										)}
									</Card>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
