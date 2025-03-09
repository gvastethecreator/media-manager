'use client';

import { AttributeForm } from '@/components/features/entity-cards/forms/attribute-form';
import {
	type AttributeFormData,
	attributeToFormData,
	formDataToAttribute,
} from '@/components/features/entity-cards/forms/entity-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useAttributeStore } from '@/store/attribute.store';
import { PlusIcon } from 'lucide-react';
import * as React from 'react';
import { columns } from './columns/attribute-columns';

export function AttributesSection() {
	const [open, setOpen] = React.useState(false);
	const { attributes, addAttribute: createAttribute, updateAttribute, deleteAttribute } = useAttributeStore();

	const handleCreate = async (data: AttributeFormData) => {
		await createAttribute(formDataToAttribute(data));
		setOpen(false);
	};

	const handleUpdate = async (data: AttributeFormData) => {
		if (!data.id) {
			return;
		}
		await updateAttribute(data.id, formDataToAttribute(data));
	};

	const handleDelete = async (data: AttributeFormData) => {
		if (!data.id) {
			return;
		}
		await deleteAttribute(data.id);
	};

	const formattedAttributes = React.useMemo(() => attributes.map(attributeToFormData), [attributes]);

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle>Atributos</CardTitle>
						<CardDescription>Gestiona los atributos del sistema</CardDescription>
					</div>
					<Dialog open={open} onOpenChange={setOpen}>
						<DialogTrigger asChild>
							<Button>
								<PlusIcon className="h-4 w-4 mr-2" />
								Nuevo Atributo
							</Button>
						</DialogTrigger>
						<DialogContent>
							<AttributeForm onSubmit={handleCreate} onCancel={() => setOpen(false)} />
						</DialogContent>
					</Dialog>
				</div>
			</CardHeader>
			<CardContent>
				<DataTable columns={columns} data={formattedAttributes} onUpdate={handleUpdate} onDelete={handleDelete} />
			</CardContent>
		</Card>
	);
}
