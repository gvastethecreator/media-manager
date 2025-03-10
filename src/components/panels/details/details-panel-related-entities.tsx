'use client';

import { Camera, FileImage, HardDrive, MapPin, Tag, User2 } from 'lucide-react';
import * as React from 'react';
import { InfoItem } from './details-panel-info-item';
import type { ItemComponentProps } from './details-panel-types';

/**
 * Componente que muestra las entidades relacionadas con la imagen
 */
export function RelatedEntities({ item }: ItemComponentProps) {
	return (
		<div className="flex flex-col gap-2">
			<h3 className="text-xs font-medium text-muted-foreground">Entidades relacionadas</h3>
			<div className="flex flex-col gap-1.5">
				{item.collections?.length > 0 && (
					<InfoItem
						icon={<FileImage className="h-3.5 w-3.5 text-blue-400" />}
						label="Colecciones"
						value={`${item.collections.length} ${item.collections.length === 1 ? 'colección' : 'colecciones'}`}
					/>
				)}
				{item.tags?.length > 0 && (
					<InfoItem
						icon={<Tag className="h-3.5 w-3.5 text-green-400" />}
						label="Etiquetas"
						value={`${item.tags.length} ${item.tags.length === 1 ? 'etiqueta' : 'etiquetas'}`}
					/>
				)}
				{item.albums?.length > 0 && (
					<InfoItem
						icon={<Camera className="h-3.5 w-3.5 text-purple-400" />}
						label="Álbumes"
						value={`${item.albums.length} ${item.albums.length === 1 ? 'álbum' : 'álbumes'}`}
					/>
				)}
				{item.characters?.length > 0 && (
					<InfoItem
						icon={<User2 className="h-3.5 w-3.5 text-yellow-400" />}
						label="Personajes"
						value={`${item.characters.length} ${item.characters.length === 1 ? 'personaje' : 'personajes'}`}
					/>
				)}
				{item.places?.length > 0 && (
					<InfoItem
						icon={<MapPin className="h-3.5 w-3.5 text-orange-400" />}
						label="Lugares"
						value={`${item.places.length} ${item.places.length === 1 ? 'lugar' : 'lugares'}`}
					/>
				)}
				{item.objects?.length > 0 && (
					<InfoItem
						icon={<HardDrive className="h-3.5 w-3.5 text-indigo-400" />}
						label="Objetos"
						value={`${item.objects.length} ${item.objects.length === 1 ? 'objeto' : 'objetos'}`}
					/>
				)}
			</div>
		</div>
	);
}
