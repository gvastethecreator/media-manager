import { Sparkles } from 'lucide-react';
import { useCallback, useState } from 'react';
import { WildcardCard } from '@/components/cards/wildcard-card';
import { LoadingScreen } from '@/components/core/feedback';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from '@/components/ui/motion-shim';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useEntitySelection } from '@/hooks/use-entity-selection';
import { useCreateWildcard, useWildcards } from '@/lib/api/wildcards';
import { clientEvents } from '@/lib/client/events.client';
import { clientLogger } from '@/lib/logger/client-logger';
// El store se expone desde el barrel de la entidad
import { useWildcardStore } from '@/store/entities/wildcard';
import type { ViewProps } from '../types';

const viewLogger = clientLogger.withContext('WildcardsView');

export function WildcardsView({ isVisible }: ViewProps) {
	const {
		ui: { currentWildcardId },
		setCurrentWildcard,
	} = useWildcardStore();
	const { mutate: createWildcard } = useCreateWildcard();
	const { handleItemClick: updateSelection } = useEntitySelection();

	const [localSearch, setLocalSearch] = useState('');
	const [showForm, setShowForm] = useState(false);
	const [newWildcardName, setNewWildcardName] = useState('');
	const [newWildcardDescription, setNewWildcardDescription] = useState('');

	// Usar React Query hook en lugar de server action
	const {
		data: wildcardsResponse,
		isLoading,
		error,
		refetch,
	} = useWildcards({
		search: localSearch,
		sortBy: 'name',
		sortOrder: 'asc',
	});

	const wildcards = wildcardsResponse?.data || [];

	const handleWildcardSelect = useCallback(
		(wildcardId: string) => {
			viewLogger.info('✨ Seleccionando wildcard', { wildcardId });
			setCurrentWildcard(wildcardId);

			// Actualizar panel de detalles con el wildcard seleccionado
			const wildcard = wildcards.find((w) => w.id === wildcardId);
			if (wildcard) {
				updateSelection(wildcard as any);
			}

			clientEvents.emit('wildcard:selected', { wildcardId });
		},
		[setCurrentWildcard, wildcards, updateSelection]
	);

	const { toast } = useToast();
	const handleCreateWildcard = useCallback(() => {
		if (newWildcardName.trim() === '') {
			toast({
				title: '❌ Error',
				description: 'El nombre del wildcard no puede estar vacío.',
				variant: 'destructive',
			});
			return;
		}
		createWildcard({ name: newWildcardName, description: newWildcardDescription });
		setNewWildcardName('');
		setNewWildcardDescription('');
		setShowForm(false);
	}, [newWildcardName, newWildcardDescription, createWildcard, toast]);

	const handleRetry = useCallback(() => {
		viewLogger.info('🔄 Reintentando cargar wildcards');
		refetch();
	}, [refetch]);

	if (!isVisible) {
		return null;
	}

	if (isLoading) {
		return <LoadingScreen message="Cargando wildcards..." />;
	}

	if (error) {
		return (
			<EmptyState
				actions={
					<Button onClick={handleRetry} variant="outline">
						Reintentar
					</Button>
				}
				description={error instanceof Error ? error.message : 'Ha ocurrido un error inesperado'}
				icon={Sparkles}
				title="Error al cargar wildcards"
			/>
		);
	}

	return (
		<ScrollArea className="flex-1">
			<div className="p-6">
				<h2 className="mb-4 font-bold text-xl">Vista de Wildcards</h2>

				<Button className="mb-4" onClick={() => setShowForm(!showForm)}>
					{showForm ? 'Cancelar' : 'Crear Wildcard'}
				</Button>

				{showForm && (
					<div className="mb-6 rounded-lg border p-4 shadow-sm">
						<h3 className="mb-3 font-semibold text-lg">Nuevo Wildcard</h3>
						<div className="mb-3 grid gap-2">
							<Label htmlFor="wildcardName">Nombre</Label>
							<Input
								id="wildcardName"
								onChange={(e) => setNewWildcardName(e.target.value)}
								placeholder="Nombre del wildcard"
								value={newWildcardName}
							/>
						</div>
						<div className="mb-4 grid gap-2">
							<Label htmlFor="wildcardDescription">Descripción</Label>
							<Textarea
								id="wildcardDescription"
								onChange={(e) => setNewWildcardDescription(e.target.value)}
								placeholder="Descripción del wildcard (opcional)"
								value={newWildcardDescription}
							/>
						</div>
						<Button onClick={handleCreateWildcard}>Guardar Wildcard</Button>
					</div>
				)}

				{wildcards.length || isLoading || showForm ? (
					<motion.div
						animate={{ opacity: 1, y: 0 }}
						className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
						initial={{ opacity: 0, y: 20 }}
						transition={{ duration: 0.3 }}
					>
						{wildcards.map((wildcard, index) => (
							<motion.div
								animate={{ opacity: 1, y: 0 }}
								initial={{ opacity: 0, y: 20 }}
								key={wildcard.id}
								transition={{ duration: 0.3, delay: index * 0.05 }}
							>
								<WildcardCard
									className={wildcard.id === currentWildcardId ? 'ring-2 ring-primary' : ''}
									onClick={() => handleWildcardSelect(wildcard.id)}
									wildcard={wildcard}
								/>
							</motion.div>
						))}
					</motion.div>
				) : (
					<EmptyState
						description={
							localSearch
								? `No se encontraron wildcards que coincidan con "${localSearch}"`
								: 'No hay wildcards disponibles'
						}
						icon={Sparkles}
						title="Sin wildcards"
					/>
				)}
			</div>
		</ScrollArea>
	);
}
