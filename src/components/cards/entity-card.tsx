/**
 * @file Componente despachador de tarjetas de entidad.
 * @module components/cards/entity-card
 * @description Este componente actúa como un router, renderizando la tarjeta específica
 * para cada tipo de entidad basado en la propiedad `entityType`.
 */
'use client';

import type { FC } from 'react';
import type { AnyEntity } from '@/types/entities';

import { AlbumCard } from './album-card/album-card';
import { CharacterCard } from './character-card/character-card';
import { CollectionCard } from './collection-card/collection-card';
import { ConceptCard } from './concept-card/concept-card';
import { FolderCard } from './folder-card/folder-card';
import { GroupCard } from './group-card/group-card';
import { ImageCard } from './image-card/image-card-improved';
import { NoteCard } from './note-card/note-card';
import { PlaceCard } from './place-card/place-card';
import { PromptCard } from './prompt-card/prompt-card';
import { PropertyCard } from './property-card/property-card';
import { TagCard } from './tag-card/tag-card';
import { WildcardCard } from './wildcard-card/wildcard-card';
import { WorldItemCard } from './world-item-card/world-item-card';

// Mapeo de tipos de entidad a sus componentes de tarjeta correspondientes.
const entityCardMap: Record<AnyEntity['entityType'], FC<any>> = {
	image: ImageCard,
	album: AlbumCard,
	character: CharacterCard,
	collection: CollectionCard,
	concept: ConceptCard,
	folder: FolderCard,
	group: GroupCard,
	note: NoteCard,
	place: PlaceCard,
	prompt: PromptCard,
	property: PropertyCard,
	tag: TagCard,
	wildcard: WildcardCard,
	worldItem: WorldItemCard,
	// TODO: Añadir tarjetas para Video y otras entidades si es necesario.
	video: () => <div>Video Card Placeholder</div>,
};

interface EntityCardProps {
	item: AnyEntity;
	// Pasamos cualquier otra prop que las tarjetas individuales puedan necesitar (selección, etc.)
	[key: string]: any;
}

export const EntityCard: FC<EntityCardProps> = ({ item, ...props }) => {
	const CardComponent = entityCardMap[item.entityType];

	if (!CardComponent) {
		console.warn(`No card component found for entity type: ${item.entityType}`);
		return (
			<div className="border rounded-lg p-4 bg-destructive/10 text-destructive-foreground">
				<p>Unsupported entity type:</p>
				<pre className="text-xs">{JSON.stringify(item, null, 2)}</pre>
			</div>
		);
	}

	// Preparamos las props para la tarjeta específica.
	// El nombre de la prop principal (ej: `image`, `folder`) debe coincidir con el tipo de entidad.
	const cardProps = {
		[item.entityType]: item,
		...props,
	};

	return <CardComponent {...cardProps} />;
};
