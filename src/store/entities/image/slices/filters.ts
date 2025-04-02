/**
 * @file Slice para filtros y ordenación del store de imágenes
 * @module store/entities/image/slices/filters
 */

import type { StateCreator } from 'zustand';
import { transformImageToExtended } from '../../../../transformers/image/transformer';
import type { Image, ImageExtended, ImageSortCriteria } from '../../../../types/entities/image';
import type { ImageGroup, ImageGroupType, ImageState, ImageStoreStats } from '../types';

// Slice para filtrado y ordenación
export interface ImageFiltersSlice {
	// Establecer filtros
	setSortBy: (sortBy: ImageSortCriteria) => void;
	setSearchQuery: (query: string) => void;
	setFilterByTag: (tags: string[]) => void;
	addTagFilter: (tag: string) => void;
	removeTagFilter: (tag: string) => void;
	setFilterByAlbum: (albums: string[]) => void;
	setFilterByFolder: (folderId: string | null) => void;
	setFilterFavorites: (onlyFavorites: boolean) => void;
	setFilterPublic: (onlyPublic: boolean) => void;
	setDateRange: (from: Date | null, to: Date | null) => void;
	resetFilters: () => void;

	// Obtener imágenes filtradas
	getFilteredImages: () => Image[];
	applySort: (images: Image[]) => Image[];
	applyFilters: (images: Image[]) => Image[];

	// Selectores optimizados
	selectImageById: (id: string) => ImageExtended | null;
	selectImagesByIds: (ids: string[]) => ImageExtended[];
	selectFilteredImages: () => ImageExtended[];
	selectFilteredImagesCount: () => number;
	selectSortedImages: () => ImageExtended[];
	selectGroupedImages: (groupBy: ImageGroupType) => ImageGroup[];
	selectFilteredByTag: (tagId: string) => ImageExtended[];
	selectFilteredByFolder: (folderId: string) => ImageExtended[];
	selectFavorites: () => ImageExtended[];
	selectPublic: () => ImageExtended[];
	selectPrivate: () => ImageExtended[];
	selectWithThumbnails: () => ImageExtended[];
	selectWithoutThumbnails: () => ImageExtended[];
	selectImagesByDateRange: (from: Date, to: Date) => ImageExtended[];
	selectImageByPath: (path: string) => ImageExtended | null;
	selectImagesByFolder: (folderId: string, includeStats?: boolean) => ImageExtended[];
	selectFolderImageStats: (folderId: string) => ImageStoreStats;

	// Estadísticas
	selectImageStats: () => ImageStoreStats;
}

// Creador del slice
export const createImageFiltersSlice: StateCreator<ImageState, [], [], ImageFiltersSlice> = (set, get) => ({
	// Establecer filtros
	setSortBy: (sortBy: ImageSortCriteria) => {
		set((state) => ({
			filters: {
				...state.filters,
				sortBy,
			},
		}));
	},

	setSearchQuery: (query: string) => {
		set((state) => ({
			filters: {
				...state.filters,
				searchQuery: query,
			},
		}));
	},

	setFilterByTag: (tags: string[]) => {
		set((state) => ({
			filters: {
				...state.filters,
				filterByTag: tags,
			},
		}));
	},

	addTagFilter: (tag: string) => {
		set((state) => {
			if (state.filters.filterByTag.includes(tag)) {
				return state;
			}
			return {
				filters: {
					...state.filters,
					filterByTag: [...state.filters.filterByTag, tag],
				},
			};
		});
	},

	removeTagFilter: (tag: string) => {
		set((state) => ({
			filters: {
				...state.filters,
				filterByTag: state.filters.filterByTag.filter((t) => t !== tag),
			},
		}));
	},

	setFilterByAlbum: (albums: string[]) => {
		set((state) => ({
			filters: {
				...state.filters,
				filterByAlbum: albums,
			},
		}));
	},

	setFilterByFolder: (folderId: string | null) => {
		set((state) => ({
			filters: {
				...state.filters,
				filterByFolderId: folderId,
			},
		}));
	},

	setFilterFavorites: (onlyFavorites: boolean) => {
		set((state) => ({
			filters: {
				...state.filters,
				filterFavorites: onlyFavorites,
			},
		}));
	},

	setFilterPublic: (onlyPublic: boolean) => {
		set((state) => ({
			filters: {
				...state.filters,
				filterPublic: onlyPublic,
			},
		}));
	},

	setDateRange: (from: Date | null, to: Date | null) => {
		set((state) => ({
			filters: {
				...state.filters,
				dateRange: { from, to },
			},
		}));
	},

	resetFilters: () => {
		set((state) => ({
			filters: {
				...state.filters,
				searchQuery: '',
				filterByTag: [],
				filterByAlbum: [],
				filterByFolderId: null,
				filterFavorites: false,
				filterPublic: false,
				dateRange: { from: null, to: null },
			},
		}));
	},

	// Funciones de filtrado
	getFilteredImages: () => {
		const { getImages } = get();
		const allImages = getImages(); // Obtener todas las imágenes
		const filteredImages = get().applyFilters(allImages); // Aplicar filtros
		return get().applySort(filteredImages); // Ordenar las filtradas
	},

	// Reimplementación síncrona de applyFilters
	applyFilters: (images: Image[]) => {
		const {
			searchQuery,
			filterByTag,
			filterByAlbum,
			filterByFolderId,
			filterFavorites,
			filterPublic,
			dateRange,
		} = get().filters;

		let filtered = [...images];

		// Filtro por búsqueda de texto
		if (searchQuery) {
			const lowerQuery = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(img) =>
					img.name.toLowerCase().includes(lowerQuery) ||
					(img.description || '').toLowerCase().includes(lowerQuery) ||
					(img.path || '').toLowerCase().includes(lowerQuery)
			);
		}

		// Filtro por etiquetas (debe tener TODAS las etiquetas seleccionadas)
		if (filterByTag.length > 0) {
			filtered = filtered.filter((img) =>
				filterByTag.every((tagId) => img.tags?.some((t) => t.id === tagId))
			);
		}

		// Filtro por álbumes (debe estar en ALGUNO de los álbumes seleccionados)
		if (filterByAlbum.length > 0) {
			filtered = filtered.filter((img) =>
				filterByAlbum.some((albumId) => img.albums?.some((a) => a.id === albumId))
			);
		}

		// Filtro por carpeta
		if (filterByFolderId) {
			filtered = filtered.filter((img) => img.folderId === filterByFolderId);
		}

		// Filtro por favoritos
		if (filterFavorites) {
			filtered = filtered.filter((img) => img.isFavorite);
		}

		// Filtro por público/privado (si filterPublic es true, solo públicos)
		if (filterPublic) {
			filtered = filtered.filter((img) => img.isPublic);
		}

		// Filtro por rango de fechas
		if (dateRange.from || dateRange.to) {
			const fromTime = dateRange.from ? new Date(dateRange.from).getTime() : 0;
			// Añadir un día al límite superior para hacerlo inclusivo
			const toTime = dateRange.to
				? new Date(new Date(dateRange.to).setDate(new Date(dateRange.to).getDate() + 1)).getTime()
				: Number.POSITIVE_INFINITY;

			filtered = filtered.filter((img) => {
				const imgTime = new Date(img.createdAt).getTime();
				return imgTime >= fromTime && imgTime < toTime;
			});
		}

		return filtered;
	},

	applySort: (images: Image[]) => {
		const { sortBy } = get().filters;

		return [...images].sort((a, b) => {
			switch (sortBy) {
				case 'name_asc':
					return a.name.localeCompare(b.name);
				case 'name_desc':
					return b.name.localeCompare(a.name);
				case 'date_asc':
					return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
				case 'date_desc':
					return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
				case 'size_asc':
					return a.size - b.size;
				case 'size_desc':
					return b.size - a.size;
				case 'dimensions_asc':
					return a.width * a.height - b.width * b.height;
				case 'dimensions_desc':
					return b.width * b.height - a.width * a.height;
				case 'views_asc':
					return (a.stats?.views || 0) - (b.stats?.views || 0);
				case 'views_desc':
					return (b.stats?.views || 0) - (a.stats?.views || 0);
				default:
					return 0;
			}
		});
	},

	// Selectores optimizados
	selectImageById: (id: string) => {
		const image = get().core.images[id];
		if (!image) return null;

		const { selectedIds } = get().ui;
		return transformImageToExtended(image, { isSelected: selectedIds.includes(id) });
	},

	selectImagesByIds: (ids: string[]) => {
		const { selectedIds } = get().ui;
		return ids
			.map(id => {
				const image = get().core.images[id];
				if (!image) return null;
				return transformImageToExtended(image, { isSelected: selectedIds.includes(id) });
			})
			.filter((image): image is ImageExtended => image !== null);
	},

	selectImageByPath: (path: string) => {
		const { getImages } = get();
		const images = getImages();
		const image = images.find(img => img.path === path);

		if (!image) return null;

		const { selectedIds } = get().ui;
		return transformImageToExtended(image, { isSelected: selectedIds.includes(image.id) });
	},

	selectImagesByFolder: (folderId: string, includeStats = false) => {
		const allImages = Object.values(get().core.images).map(img => transformImageToExtended(img));
		const images = allImages.filter(img => img.folderId === folderId);
		const selectedIds = get().ui.selectedIds;

		if (includeStats) {
			return images.map(image =>
				transformImageToExtended(image, { isSelected: selectedIds.includes(image.id) })
			);
		}

		return images;
	},

	selectFolderImageStats: (folderId: string) => {
		const imagesInFolder = get().selectImagesByFolder(folderId);

		const totalSize = imagesInFolder.reduce((sum, img) => sum + (img.size || 0), 0);
		const withThumbnails = imagesInFolder.filter(img => img.thumbnails && Object.keys(img.thumbnails).length > 0).length;
		const largest = imagesInFolder.reduce((max, img) => (img.size > (max?.size || 0) ? img : max), null as ImageExtended | null);
		const smallest = imagesInFolder.reduce((min, img) => (img.size < (min?.size || Number.POSITIVE_INFINITY) ? img : min), null as ImageExtended | null);
		const newest = imagesInFolder.reduce((latest, img) => (new Date(img.createdAt) > new Date(latest?.createdAt || 0) ? img : latest), null as ImageExtended | null);
		const oldest = imagesInFolder.reduce((earliest, img) => (new Date(img.createdAt) < new Date(earliest?.createdAt || Date.now()) ? img : earliest), null as ImageExtended | null);

		return {
			total: imagesInFolder.length,
			totalSize,
			avgSize: imagesInFolder.length > 0 ? totalSize / imagesInFolder.length : 0,
			withThumbnails,
			withoutThumbnails: imagesInFolder.length - withThumbnails,
			largest: largest ? transformImageToExtended(largest) : null,
			smallest: smallest ? transformImageToExtended(smallest) : null,
			newest: newest ? transformImageToExtended(newest) : null,
			oldest: oldest ? transformImageToExtended(oldest) : null
		};
	},

	selectFilteredImages: () => {
		const filteredImages = get().getFilteredImages();
		const { selectedIds } = get().ui;

		return filteredImages.map(image =>
			transformImageToExtended(image, { isSelected: selectedIds.includes(image.id) })
		);
	},

	selectFilteredImagesCount: () => {
		return get().getFilteredImages().length;
	},

	selectSortedImages: () => {
		const { getImages } = get();
		const images = getImages();
		const sortedImages = get().applySort(images);
		const { selectedIds } = get().ui;

		return sortedImages.map(image =>
			transformImageToExtended(image, { isSelected: selectedIds.includes(image.id) })
		);
	},

	selectGroupedImages: (groupBy: ImageGroupType) => {
		const filteredImages = get().selectFilteredImages();
		const groups: Record<string, ImageGroup> = {};

		switch (groupBy) {
			case 'folder': {
				// Agrupar por carpeta
				for (const image of filteredImages) {
					const folderId = image.folderId || 'sin-carpeta';
					const folderName = image.folder?.name || 'Sin carpeta';

					if (!groups[folderId]) {
						groups[folderId] = {
							id: folderId,
							label: folderName,
							count: 0,
							images: []
						};
					}

					groups[folderId].images.push(image);
					groups[folderId].count++;
				}
				break;
			}

			case 'tag': {
				// Imágenes sin etiquetas
				groups['sin-etiquetas'] = {
					id: 'sin-etiquetas',
					label: 'Sin etiquetas',
					count: 0,
					images: []
				};

				// Agrupar por etiqueta
				for (const image of filteredImages) {
					if (!image.tags || image.tags.length === 0) {
						groups['sin-etiquetas'].images.push(image);
						groups['sin-etiquetas'].count++;
						continue;
					}

					for (const tag of image.tags) {
						if (!groups[tag.id]) {
							groups[tag.id] = {
								id: tag.id,
								label: tag.name,
								count: 0,
								images: []
							};
						}

						groups[tag.id].images.push(image);
						groups[tag.id].count++;
					}
				}
				break;
			}

			case 'date': {
				// Agrupar por fecha (día)
				for (const image of filteredImages) {
					const date = new Date(image.createdAt);
					const dateKey = date.toISOString().split('T')[0];
					const dateLabel = new Intl.DateTimeFormat('es', {
						year: 'numeric',
						month: 'long',
						day: 'numeric'
					}).format(date);

					if (!groups[dateKey]) {
						groups[dateKey] = {
							id: dateKey,
							label: dateLabel,
							count: 0,
							images: []
						};
					}

					groups[dateKey].images.push(image);
					groups[dateKey].count++;
				}
				break;
			}

			case 'month': {
				// Agrupar por mes
				for (const image of filteredImages) {
					const date = new Date(image.createdAt);
					const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
					const monthLabel = new Intl.DateTimeFormat('es', {
						year: 'numeric',
						month: 'long'
					}).format(date);

					if (!groups[monthKey]) {
						groups[monthKey] = {
							id: monthKey,
							label: monthLabel,
							count: 0,
							images: []
						};
					}

					groups[monthKey].images.push(image);
					groups[monthKey].count++;
				}
				break;
			}

			case 'year': {
				// Agrupar por año
				for (const image of filteredImages) {
					const date = new Date(image.createdAt);
					const yearKey = `${date.getFullYear()}`;

					if (!groups[yearKey]) {
						groups[yearKey] = {
							id: yearKey,
							label: yearKey,
							count: 0,
							images: []
						};
					}

					groups[yearKey].images.push(image);
					groups[yearKey].count++;
				}
				break;
			}

			case 'size': {
				// Definir rangos de tamaño
				const sizeRanges = [
					{ key: 'tiny', label: 'Muy pequeño (< 100KB)', max: 100 * 1024 },
					{ key: 'small', label: 'Pequeño (100KB - 1MB)', max: 1024 * 1024 },
					{ key: 'medium', label: 'Medio (1MB - 5MB)', max: 5 * 1024 * 1024 },
					{ key: 'large', label: 'Grande (5MB - 20MB)', max: 20 * 1024 * 1024 },
					{ key: 'huge', label: 'Muy grande (> 20MB)', max: Number.POSITIVE_INFINITY }
				];

				// Inicializar grupos
				for (const range of sizeRanges) {
					groups[range.key] = {
						id: range.key,
						label: range.label,
						count: 0,
						images: []
					};
				}

				// Asignar imágenes a grupos
				for (const image of filteredImages) {
					const range = sizeRanges.find((r, i) =>
						image.size < r.max || i === sizeRanges.length - 1
					);

					if (range) {
						groups[range.key].images.push(image);
						groups[range.key].count++;
					}
				}
				break;
			}

			case 'resolution': {
				// Definir rangos de resolución
				const resRanges = [
					{ key: 'sd', label: 'SD (< 1MP)', max: 1000000 },
					{ key: 'hd', label: 'HD (1-2MP)', max: 2000000 },
					{ key: 'fhd', label: 'Full HD (2-4MP)', max: 4000000 },
					{ key: '4k', label: '4K (4-10MP)', max: 10000000 },
					{ key: '8k', label: '8K+ (> 10MP)', max: Number.POSITIVE_INFINITY }
				];

				// Inicializar grupos
				for (const range of resRanges) {
					groups[range.key] = {
						id: range.key,
						label: range.label,
						count: 0,
						images: []
					};
				}

				// Asignar imágenes a grupos
				for (const image of filteredImages) {
					const resolution = image.width * image.height;
					const range = resRanges.find((r, i) =>
						resolution < r.max || i === resRanges.length - 1
					);

					if (range) {
						groups[range.key].images.push(image);
						groups[range.key].count++;
					}
				}
				break;
			}

			default: {
				// Sin agrupación, un solo grupo con todas las imágenes
				groups['all'] = {
					id: 'all',
					label: 'Todas las imágenes',
					count: filteredImages.length,
					images: filteredImages
				};
			}
		}

		// Convertir el objeto a array y ordenar por número de imágenes
		return Object.values(groups).sort((a, b) => b.count - a.count);
	},

	selectFilteredByTag: (tagId: string) => {
		const { getImages } = get();
		const images = getImages();
		const { selectedIds } = get().ui;

		return images
			.filter(image => image.tags?.some(tag => tag.id === tagId))
			.map(image => transformImageToExtended(image, { isSelected: selectedIds.includes(image.id) }));
	},

	selectFilteredByFolder: (folderId: string) => {
		const { getImagesByFolder } = get();
		const images = getImagesByFolder(folderId);
		const { selectedIds } = get().ui;

		return images.map(image =>
			transformImageToExtended(image, { isSelected: selectedIds.includes(image.id) })
		);
	},

	selectFavorites: () => {
		const { getImages } = get();
		const images = getImages();
		const { selectedIds } = get().ui;

		return images
			.filter(image => image.isFavorite)
			.map(image => transformImageToExtended(image, { isSelected: selectedIds.includes(image.id) }));
	},

	selectPublic: () => {
		const { getImages } = get();
		const images = getImages();
		const { selectedIds } = get().ui;

		return images
			.filter(image => image.isPublic)
			.map(image => transformImageToExtended(image, { isSelected: selectedIds.includes(image.id) }));
	},

	selectPrivate: () => {
		const { getImages } = get();
		const images = getImages();
		const { selectedIds } = get().ui;

		return images
			.filter(image => !image.isPublic)
			.map(image => transformImageToExtended(image, { isSelected: selectedIds.includes(image.id) }));
	},

	selectWithThumbnails: () => {
		const { getImages } = get();
		const images = getImages();
		const { selectedIds } = get().ui;

		return images
			.filter(image => !!image.thumbnailPath)
			.map(image => transformImageToExtended(image, { isSelected: selectedIds.includes(image.id) }));
	},

	selectWithoutThumbnails: () => {
		const { getImages } = get();
		const images = getImages();
		const { selectedIds } = get().ui;

		return images
			.filter(image => !image.thumbnailPath)
			.map(image => transformImageToExtended(image, { isSelected: selectedIds.includes(image.id) }));
	},

	selectImagesByDateRange: (from: Date, to: Date) => {
		const { getImages } = get();
		const images = getImages();
		const { selectedIds } = get().ui;

		// Agregar un día al límite superior para que sea inclusivo
		const maxDate = new Date(to);
		maxDate.setDate(maxDate.getDate() + 1);

		return images
			.filter(image => {
				const date = new Date(image.createdAt);
				return date >= from && date < maxDate;
			})
			.map(image => transformImageToExtended(image, { isSelected: selectedIds.includes(image.id) }));
	},

	selectImageStats: () => {
		const { getImages } = get();
		const images = getImages();

		if (images.length === 0) {
			return {
				totalImages: 0,
				totalSize: 0,
				averageSize: 0,
				byFolder: {},
				byTag: {},
				byMonth: {},
				byResolution: {},
				favorites: 0,
				public: 0,
				private: 0,
				withThumbnails: 0,
				withoutThumbnails: 0,
				largest: null,
				smallest: null,
				newest: null,
				oldest: null
			};
		}

		// Estadísticas básicas
		let totalSize = 0;
		let favorites = 0;
		let publicImages = 0;
		let withThumbnails = 0;

		// Categorías
		const byFolder: Record<string, number> = {};
		const byTag: Record<string, number> = {};
		const byMonth: Record<string, number> = {};
		const byResolution: Record<string, number> = {};

		// Encontrar valores extremos
		let largest = images[0];
		let smallest = images[0];
		let newest = images[0];
		let oldest = images[0];

		// Procesar cada imagen
		for (const image of images) {
			// Estadísticas básicas
			totalSize += image.size;
			if (image.isFavorite) favorites++;
			if (image.isPublic) publicImages++;
			if (image.thumbnailPath) withThumbnails++;

			// Por carpeta
			const folderId = image.folderId || 'sin-carpeta';
			byFolder[folderId] = (byFolder[folderId] || 0) + 1;

			// Por etiqueta
			if (image.tags) {
				for (const tag of image.tags) {
					byTag[tag.id] = (byTag[tag.id] || 0) + 1;
				}
			}

			// Por mes
			const date = new Date(image.createdAt);
			const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
			byMonth[monthKey] = (byMonth[monthKey] || 0) + 1;

			// Por resolución
			const resolution = `${image.width}x${image.height}`;
			byResolution[resolution] = (byResolution[resolution] || 0) + 1;

			// Valores extremos
			if (image.size > largest.size) largest = image;
			if (image.size < smallest.size) smallest = image;

			const imageDate = new Date(image.createdAt).getTime();
			if (imageDate > new Date(newest.createdAt).getTime()) newest = image;
			if (imageDate < new Date(oldest.createdAt).getTime()) oldest = image;
		}

		return {
			totalImages: images.length,
			totalSize,
			averageSize: totalSize / images.length,
			byFolder,
			byTag,
			byMonth,
			byResolution,
			favorites,
			public: publicImages,
			private: images.length - publicImages,
			withThumbnails,
			withoutThumbnails: images.length - withThumbnails,
			largest: largest ? transformImageToExtended(transformImageToExtended(largest)) : null,
			smallest: smallest ? transformImageToExtended(transformImageToExtended(smallest)) : null,
			newest: newest ? transformImageToExtended(transformImageToExtended(newest)) : null,
			oldest: oldest ? transformImageToExtended(transformImageToExtended(oldest)) : null
		};
	}
});
