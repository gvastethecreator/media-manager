/**
 * @file Hook para manejar las interacciones con categorías de navegación - VERSIÓN TEMPORAL
 * @module components/navigation/hooks/use-category-handlers
 * @description Hook que maneja clicks y navegación entre categorías - Sin stores problemáticos
 * @updated 2025-01-27
 */

import type { ViewType } from '@/components/views/types';
import { clientLogger } from '@/lib/logger/client-logger';
import { useUIStore } from '@/store/ui.store';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const logger = clientLogger.withContext('CategoryHandlers');

export function useCategoryHandlers() {
	const navigate = useNavigate();
	const { currentView, setCurrentView } = useUIStore();

	// Handler genérico para categorías
	const handleCategoryClick = useCallback(
		(categoryId: ViewType) => {
			logger.info(`📂 Click en categoría: ${categoryId}`);
			setCurrentView(categoryId);
			navigate(`/${categoryId}`);
		},
		[navigate, setCurrentView]
	);

	// Handlers específicos para cada tipo de entidad - VERSIÓN TEMPORAL SIN STORES
	const handleFolderClick = useCallback(
		(folderId: string) => {
			logger.info(`📁 Click en folder: ${folderId}`);
			setCurrentView('folders');
			navigate(`/folders/${folderId}`);
		},
		[navigate, setCurrentView]
	);

	const handleCollectionClick = useCallback(
		(collectionId: string) => {
			logger.info(`📚 Click en collection: ${collectionId}`);
			setCurrentView('collections');
			navigate(`/collections/${collectionId}`);
		},
		[navigate, setCurrentView]
	);

	const handleTagClick = useCallback(
		(tagId: string) => {
			logger.info(`🏷️ Click en tag: ${tagId}`);
			setCurrentView('tags');
			navigate(`/tags/${tagId}`);
		},
		[navigate, setCurrentView]
	);

	const handleAlbumClick = useCallback(
		(albumId: string) => {
			logger.info(`🎞️ Click en album: ${albumId}`);
			setCurrentView('albums');
			navigate(`/albums/${albumId}`);
		},
		[navigate, setCurrentView]
	);

	const handleCharacterClick = useCallback(
		(characterId: string) => {
			logger.info(`👤 Click en character: ${characterId}`);
			setCurrentView('characters');
			navigate(`/characters/${characterId}`);
		},
		[navigate, setCurrentView]
	);

	const handlePlaceClick = useCallback(
		(placeId: string) => {
			logger.info(`📍 Click en place: ${placeId}`);
			setCurrentView('places');
			navigate(`/places/${placeId}`);
		},
		[navigate, setCurrentView]
	);

	const handleWorldItemClick = useCallback(
		(worldItemId: string) => {
			logger.info(`🌍 Click en worldItem: ${worldItemId}`);
			setCurrentView('world-items');
			navigate(`/world-items/${worldItemId}`);
		},
		[navigate, setCurrentView]
	);

	const handleConceptClick = useCallback(
		(conceptId: string) => {
			logger.info(`💡 Click en concept: ${conceptId}`);
			setCurrentView('concepts');
			navigate(`/concepts/${conceptId}`);
		},
		[navigate, setCurrentView]
	);

	const handlePromptClick = useCallback(
		(promptId: string) => {
			logger.info(`🎨 Click en prompt: ${promptId}`);
			setCurrentView('prompts');
			navigate(`/prompts/${promptId}`);
		},
		[navigate, setCurrentView]
	);

	const handleNoteClick = useCallback(
		(noteId: string) => {
			logger.info(`📝 Click en note: ${noteId}`);
			setCurrentView('notes');
			navigate(`/notes/${noteId}`);
		},
		[navigate, setCurrentView]
	);

	const handleGroupClick = useCallback(
		(groupId: string) => {
			logger.info(`👥 Click en group: ${groupId}`);
			setCurrentView('groups');
			navigate(`/groups/${groupId}`);
		},
		[navigate, setCurrentView]
	);

	const handlePropertyClick = useCallback(
		(propertyId: string) => {
			logger.info(`🏷️ Click en property: ${propertyId}`);
			setCurrentView('properties');
			navigate(`/properties/${propertyId}`);
		},
		[navigate, setCurrentView]
	);

	const handleWildcardClick = useCallback(
		(wildcardId: string) => {
			logger.info(`🎲 Click en wildcard: ${wildcardId}`);
			setCurrentView('wildcards');
			navigate(`/wildcards/${wildcardId}`);
		},
		[navigate, setCurrentView]
	);

	return {
		currentView,
		handleCategoryClick,
		handleFolderClick,
		handleCollectionClick,
		handleTagClick,
		handleAlbumClick,
		handleCharacterClick,
		handlePlaceClick,
		handleWorldItemClick,
		handleConceptClick,
		handlePromptClick,
		handleNoteClick,
		handleGroupClick,
		handlePropertyClick,
		handleWildcardClick,
	};
}
