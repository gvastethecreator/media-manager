'use client';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import * as React from 'react';
import { EntityForm } from './entity-form';
import type { AlbumFormData } from './entity-types';

interface AlbumFormProps {
	initialData?: AlbumFormData;
	onSubmit: (data: AlbumFormData) => Promise<void>;
	onCancel?: () => void;
	isLoading?: boolean;
}

export function AlbumForm({ initialData, onSubmit, onCancel, isLoading }: AlbumFormProps) {
	const handleSubmit = async (data: AlbumFormData) => {
		await onSubmit(data);
	};

	return (
		<EntityForm<AlbumFormData>
			initialData={initialData}
			onSubmit={handleSubmit}
			onCancel={onCancel}
			isLoading={isLoading}
			title={initialData ? 'Editar Álbum' : 'Nuevo Álbum'}
			submitLabel={initialData ? 'Guardar Cambios' : 'Crear Álbum'}
			extraFields={
				<div className="space-y-4">
					<div className="space-y-2">
						<label htmlFor="sortBy" className="text-sm font-medium">
							Ordenar Por
						</label>
						<Input
							id="sortBy"
							name="sortBy"
							value={initialData?.sortBy || 'name'}
							placeholder="Campo de ordenamiento"
						/>
					</div>

					<div className="space-y-2">
						<label htmlFor="filters" className="text-sm font-medium">
							Filtros (JSON)
						</label>
						<Textarea
							id="filters"
							name="filters"
							placeholder="[]"
							defaultValue={initialData?.filters}
							className="font-mono text-sm"
						/>
					</div>
				</div>
			}
		/>
	);
}
