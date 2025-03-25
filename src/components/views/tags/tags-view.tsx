'use client';

import { getTags, type TagWithStats } from '@/app/actions/tags/tag.actions';
import type { CardOptions } from '@/components/features/entity-cards/types/unified-card-types';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { serverLogger } from '@/lib/logger/server-logger';
import { useFileManager } from '@/store/files/file-manager.store';
import { useCallback } from 'react';
import type { ViewProps } from '../types';

// Configuración visual simplificada para etiquetas
const DEFAULT_TAG_OPTIONS: CardOptions = {
	primaryColor: '#3b82f6',
	secondaryColor: '#10b981',
};

// Definir los tipos de etiquetas permitidos
type TagType = 'normal' | 'trap' | 'spell' | 'effect' | 'ritual';

// Función para determinar el tipo de etiqueta basado en categoría o alguna propiedad
const getTagType = (category?: string | null): TagType => {
	if (!category) {
		return 'normal';
	}

	// Mapeo simple de categorías a tipos
	switch (category.toLowerCase()) {
		case 'trap':
		case 'trampa': {
			return 'trap';
		}
		case 'spell':
		case 'hechizo':
		case 'magic':
		case 'magia': {
			return 'spell';
		}
		case 'effect':
		case 'efecto': {
			return 'effect';
		}
		case 'ritual': {
			return 'ritual';
		}
		default: {
			return 'normal';
		}
	}
};

/**
 * 🏷️ Vista de etiquetas
 *
 * Muestra todas las etiquetas disponibles en el sistema utilizando el componente EntityCard
 */
export function TagsView(props: ViewProps) {
	const { setCurrentView } = useNavigationStore();
	const { setCurrentTag } = useFileManager();

	// Función para cargar etiquetas
	const fetchTags = useCallback(async () => {
		const data = await getTags();

		// Transformar los datos para adaptarlos al formato esperado
		return data.map((tagData) => {
			// La TagWithStats de la API ya tiene todas las propiedades necesarias
			// Asumiendo que el objeto ya tiene la estructura correcta, solo convertimos
			// las fechas si es necesario
			return {
				...tagData,
				createdAt: tagData.createdAt instanceof Date ? tagData.createdAt : new Date(tagData.createdAt),
				updatedAt: tagData.updatedAt instanceof Date ? tagData.updatedAt : new Date(tagData.updatedAt),
				lastUpdated: tagData.lastUpdated instanceof Date ? tagData.lastUpdated : new Date(tagData.lastUpdated),
			};
		});
	}, []);

	// Manejar el clic en una etiqueta
	const handleTagClick = useCallback(
		(tag: TagWithStats) => {
			if (!tag || !tag.id) {
				console.error('❌ Error: Intento de seleccionar una etiqueta inválida', tag);
				return;
			}

			// Comprobar que la etiqueta tiene todos los datos necesarios
			if (!tag.name) {
				console.warn('⚠️ Advertencia: La etiqueta no tiene un nombre definido');
			}

			serverLogger.info('🔍 Seleccionando etiqueta:', tag.id, tag.name);

			// Primero actualizar el estado con la información completa
			useFileManager.setState({
				currentTag: {
					id: tag.id,
					name: tag.name || 'Sin nombre',
					color: tag.color || '#cccccc',
					count: tag._count?.images || 0
				},
			});

			// Luego cambiar la vista y cargar el contenido
			setCurrentView('tag-content');
			setCurrentTag(tag.id);
		},
		[setCurrentView, setCurrentTag]
	);

}
