'use client';

import * as React from 'react';
import { AlbumDialog } from './album/album-dialog';
import { CharacterDialog } from './character/character-dialog';
import { CollectionDialog } from './collection/collection-dialog';
import { ConceptDialog } from './concept/concept-dialog';
import { NoteDialog } from './note/note-dialog';
import { PlaceDialog } from './place/place-dialog';
import { PromptDialog } from './prompt/prompt-dialog';
import { TagDialog } from './tag/tag-dialog';
import { WorldItemDialog } from './world-item/world-item-dialog';
// Importaremos más diálogos a medida que los creemos

/**
 * Componente que provee todos los diálogos de creación de entidades.
 * Este componente debe montarse una sola vez en la aplicación para que
 * los diálogos estén disponibles globalmente mediante eventos.
 */
export function EntityDialogsProvider() {
	return (
		<>
			{/* Diálogo para crear colecciones */}
			<CollectionDialog />

			{/* Diálogo para crear etiquetas */}
			<TagDialog />

			{/* Diálogo para crear prompts */}
			<PromptDialog />

			{/* Diálogo para crear álbumes */}
			<AlbumDialog />

			{/* Diálogo para crear personajes */}
			<CharacterDialog />

			{/* Diálogo para crear lugares */}
			<PlaceDialog />

			{/* Diálogo para crear objetos (legacy - ya no se utiliza) */}
			{/* <ObjectDialog /> */}

			{/* Diálogo para crear objetos del mundo (reemplazo de Object) */}
			<WorldItemDialog />

			{/* Diálogo para crear notas */}
			<NoteDialog />

			{/* Diálogo para crear conceptos */}
			<ConceptDialog />

			{/* Aquí se agregarán más diálogos a medida que se implementen */}
			{/* <NoteDialog /> */}
			{/* <ConceptDialog /> */}
		</>
	);
}
