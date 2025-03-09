'use client';

import * as React from 'react';
import { AlbumDialog } from './album-dialog';
import { CharacterDialog } from './character-dialog';
import { CollectionDialog } from './collection-dialog';
import { ConceptDialog } from './concept-dialog';
import { NoteDialog } from './note-dialog';
import { ObjectDialog } from './object-dialog';
import { PlaceDialog } from './place-dialog';
import { PromptDialog } from './prompt-dialog';
import { TagDialog } from './tag-dialog';
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

			{/* Diálogo para crear objetos */}
			<ObjectDialog />

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
