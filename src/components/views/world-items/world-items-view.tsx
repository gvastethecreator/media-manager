import { Box } from 'lucide-react';
import { useCallback, useState } from 'react';
import { WorldItemCard } from '@/components/cards/world-item-card/world-item-card';
import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { LoadingScreen } from '@/components/core/feedback/loading/loading-screen';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from '@/components/ui/motion-shim';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useSeamlessNavigation } from '@/hooks/use-seamless-navigation';
import { useCreateWorldItem, useWorldItems } from '@/lib/api/world-items';
import { clientLogger } from '@/lib/logger/client-logger';
import { useWorldItemStore } from '@/store/entities/world-item';
import type { ViewProps } from '../types';

const viewLogger = clientLogger.withContext('WorldItemsView');

export function WorldItemsView(_props: ViewProps) {
	const { navigateWithTransition } = useSeamlessNavigation();
	const selectWorldItem = useWorldItemStore((state) => state.selectWorldItem);

	const { data: worldItemsResponse, isLoading, error } = useWorldItems();
	const { mutate: createWorldItem } = useCreateWorldItem();
	const worldItems = worldItemsResponse?.data || [];

	const [showForm, setShowForm] = useState(false);
	const [newItemName, setNewItemName] = useState('');
	const [newItemDescription, setNewItemDescription] = useState('');

	const handleWorldItemClick = useCallback(
		(worldItem: any) => {
			viewLogger.info('🖱️ Click en objeto del mundo:', worldItem.name);
			navigateWithTransition('/world-item-content');
			selectWorldItem(worldItem.id);
		},
		[navigateWithTransition, selectWorldItem]
	);

	const handleCreateWorldItem = useCallback(() => {
		if (newItemName.trim() === '') return;
		createWorldItem({ name: newItemName, description: newItemDescription });
		setNewItemName('');
		setNewItemDescription('');
		setShowForm(false);
	}, [newItemName, newItemDescription, createWorldItem]);

	if (error) {
		return (
			<div className="flex h-full items-center justify-center">
				<p className="text-destructive">Error: {error.message}</p>
			</div>
		);
	}

	if (isLoading) {
		return <LoadingScreen />;
	}

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				<h2 className="mb-4 font-bold text-xl">Objetos del Mundo</h2>

				<Button className="mb-4" onClick={() => setShowForm(!showForm)}>
					{showForm ? 'Cancelar' : 'Crear Objeto'}
				</Button>

				{showForm && (
					<div className="mb-6 rounded-lg border p-4 shadow-sm">
						<h3 className="mb-3 font-semibold text-lg">Nuevo Objeto</h3>
						<div className="mb-3 grid gap-2">
							<Label htmlFor="itemName">Nombre</Label>
							<Input
								id="itemName"
								onChange={(e) => setNewItemName(e.target.value)}
								placeholder="Nombre del objeto"
								value={newItemName}
							/>
						</div>
						<div className="mb-4 grid gap-2">
							<Label htmlFor="itemDescription">Descripción</Label>
							<Textarea
								id="itemDescription"
								onChange={(e) => setNewItemDescription(e.target.value)}
								placeholder="Descripción del objeto (opcional)"
								value={newItemDescription}
							/>
						</div>
						<Button onClick={handleCreateWorldItem}>Guardar Objeto</Button>
					</div>
				)}

				{(!worldItems || worldItems.length === 0) && !showForm ? (
					<EmptyState
						description="Los objetos del mundo te ayudan a organizar tus imágenes. Crea un nuevo objeto del mundo."
						icon={Box}
						title="No hay objetos del mundo"
					/>
				) : (
					<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
						{worldItems.map((worldItem, index) => (
							<motion.div
								animate={{ opacity: 1, y: 0 }}
								initial={{ opacity: 0, y: 20 }}
								key={worldItem.id}
								transition={{ delay: index * 0.1 }}
							>
								<WorldItemCard
									className="h-full"
									onClick={handleWorldItemClick}
									worldItem={worldItem}
									worldItemId={worldItem.id}
								/>
							</motion.div>
						))}
					</div>
				)}
			</div>
		</ScrollArea>
	);
}
