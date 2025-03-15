'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { EntityForm } from './entity-form';
import type { AlbumFormData } from './entity-types';

interface AlbumFormProps {
	initialData?: AlbumFormData;
	onSubmit: (data: AlbumFormData) => Promise<void>;
	onCancel?: () => void;
	isLoading?: boolean;
}

export function AlbumForm({ initialData, onSubmit, onCancel, isLoading }: AlbumFormProps) {
	const [formData, setFormData] = useState<Partial<AlbumFormData>>({
		sortBy: initialData?.sortBy || 'name',
		filters: initialData?.filters || '[]',
	});

	const handleSubmit = async (data: AlbumFormData) => {
		const completeData = {
			...data,
			...formData,
		};
		await onSubmit(completeData as AlbumFormData);
	};

	const handleChange = <T extends keyof AlbumFormData>(field: T, value: AlbumFormData[T]) => {
		setFormData((prev: Partial<AlbumFormData>) => ({
			...prev,
			[field]: value,
		}));
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
						<Label htmlFor="sortBy" className="text-sm font-medium">
							Ordenar Por
						</Label>
						<Input
							id="sortBy"
							name="sortBy"
							value={formData.sortBy || ''}
							onChange={(e) => handleChange('sortBy', e.target.value)}
							placeholder="Campo de ordenamiento"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="filters" className="text-sm font-medium">
							Filtros (JSON)
						</Label>
						<Textarea
							id="filters"
							name="filters"
							value={formData.filters || '[]'}
							onChange={(e) => handleChange('filters', e.target.value)}
							placeholder="[]"
							className="font-mono text-sm"
						/>
					</div>
				</div>
			}
		/>
	);
}
