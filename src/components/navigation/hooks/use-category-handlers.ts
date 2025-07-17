/**
 * @file Hook para manejar las interacciones con categorías de navegación - VERSIÓN TEMPORAL
 * @module components/navigation/hooks/use-category-handlers
 * @description Hook que maneja clicks y navegación entre categorías - Sin stores problemáticos
 * @updated 2025-01-27
 */

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ViewType } from '@/components/views/types';
import { clientLogger } from '@/lib/logger/client-logger';

const logger = clientLogger.withContext('CategoryHandlers');

export function useCategoryHandlers() {
	const navigate = useNavigate();

	// Handler genérico para categorías
	const handleCategoryClick = useCallback(
		(categoryId: ViewType) => {
			logger.info(`📂 Click en categoría: ${categoryId}`);
			navigate(`/${categoryId}`);
		},
		[navigate]
	);

	// Handlers específicos para cada tipo de entidad - VERSIÓN TEMPORAL SIN STORES
	const handleFolderClick = useCallback(
		(folderId: string) => {
			logger.info(`📁 Click en folder: ${folderId}`);
			navigate(`/folders/${folderId}`);
		},
		[navigate]
	);

	const handleCollectionClick = useCallback(
		(collectionId: string) => {
			logger.info(`📚 Click en collection: ${collectionId}`);
			navigate(`/collections/${collectionId}`);
		},
		[navigate]
	);

	const handleTagClick = useCallback(
		(tagId: string) => {
			logger.info(`🏷️ Click en tag: ${tagId}`);
			navigate(`/tags/${tagId}`);
		},
		[navigate]
	);

	const handleAlbumClick = useCallback(
		(albumId: string) => {
			logger.info(`🎞️ Click en album: ${albumId}`);
			navigate(`/albums/${albumId}`);
		},
		[navigate]
	);

	const handleCharacterClick = useCallback(
		(characterId: string) => {
			logger.info(`👤 Click en character: ${characterId}`);
			navigate(`/characters/${characterId}`);
		},
		[navigate]
	);

	const handlePlaceClick = useCallback(
		(placeId: string) => {
			logger.info(`📍 Click en place: ${placeId}`);
			navigate(`/places/${placeId}`);
		},
		[navigate]
	);

	const handleWorldItemClick = useCallback(
		(worldItemId: string) => {
			logger.info(`🌍 Click en worldItem: ${worldItemId}`);
			navigate(`/world-items/${worldItemId}`);
		},
		[navigate]
	);

	const handleConceptClick = useCallback(
		(conceptId: string) => {
			logger.info(`💡 Click en concept: ${conceptId}`);
			navigate(`/concepts/${conceptId}`);
		},
		[navigate]
	);

	const handlePromptClick = useCallback(
		(promptId: string) => {
			logger.info(`🎨 Click en prompt: ${promptId}`);
			navigate(`/prompts/${promptId}`);
		},
		[navigate]
	);

	const handleNoteClick = useCallback(
		(noteId: string) => {
			logger.info(`📝 Click en note: ${noteId}`);
			navigate(`/notes/${noteId}`);
		},
		[navigate]
	);

	const handleGroupClick = useCallback(
		(groupId: string) => {
			logger.info(`👥 Click en group: ${groupId}`);
			navigate(`/groups/${groupId}`);
		},
		[navigate]
	);

	const handlePropertyClick = useCallback(
		(propertyId: string) => {
			logger.info(`🏷️ Click en property: ${propertyId}`);
			navigate(`/properties/${propertyId}`);
		},
		[navigate]
	);

	const handleWildcardClick = useCallback(
		(wildcardId: string) => {
			logger.info(`🎲 Click en wildcard: ${wildcardId}`);
			navigate(`/wildcards/${wildcardId}`);
		},
		[navigate]
	);

	return {
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
