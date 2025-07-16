import { Camera, FileImage, HardDrive, MapPin, Tag, User2 } from 'lucide-react';
import { InfoItem } from './details-panel-info-item';
import type { ItemComponentProps } from './details-panel-types';

/**
 * Componente que muestra las entidades relacionadas con el item seleccionado.
 * Realiza comprobaciones de propiedad para manejar el tipo de unión `AnyFileItem`.
 */
export function RelatedEntities({ item }: ItemComponentProps) {
	// Helper para verificar si la propiedad existe y tiene elementos.
	const hasRelation = (prop: keyof ItemComponentProps['item']): boolean => {
		const value = item[prop];
		return Array.isArray(value) && value.length > 0;
	};

	const relations = [
		{
			key: 'collections',
			icon: <FileImage className="h-3.5 w-3.5 text-blue-400" />,
			label: 'Colecciones',
			singular: 'colección',
			plural: 'colecciones',
		},
		{
			key: 'tags',
			icon: <Tag className="h-3.5 w-3.5 text-green-400" />,
			label: 'Etiquetas',
			singular: 'etiqueta',
			plural: 'etiquetas',
		},
		{
			key: 'albums',
			icon: <Camera className="h-3.5 w-3.5 text-purple-400" />,
			label: 'Álbumes',
			singular: 'álbum',
			plural: 'álbumes',
		},
		{
			key: 'characters',
			icon: <User2 className="h-3.5 w-3.5 text-yellow-400" />,
			label: 'Personajes',
			singular: 'personaje',
			plural: 'personajes',
		},
		{
			key: 'places',
			icon: <MapPin className="h-3.5 w-3.5 text-orange-400" />,
			label: 'Lugares',
			singular: 'lugar',
			plural: 'lugares',
		},
		{
			key: 'worldItems',
			icon: <HardDrive className="h-3.5 w-3.5 text-indigo-400" />,
			label: 'Objetos',
			singular: 'objeto',
			plural: 'objetos',
		},
	];

	const availableRelations = relations.filter((rel) => hasRelation(rel.key));

	if (availableRelations.length === 0) {
		return null;
	}

	return (
		<div className="flex flex-col gap-2">
			<h3 className="text-xs font-medium text-muted-foreground">Entidades relacionadas</h3>
			<div className="flex flex-col gap-1.5">
				{availableRelations.map((rel) => {
					const value = item[rel.key as keyof typeof item];
					const count = Array.isArray(value) ? value.length : 0;
					return (
						<InfoItem
							key={rel.key}
							icon={rel.icon}
							label={rel.label}
							value={`${count} ${count === 1 ? rel.singular : rel.plural}`}
						/>
					);
				})}
			</div>
		</div>
	);
}
