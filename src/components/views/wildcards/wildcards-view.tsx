import { Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { WildcardCard } from '@/components/cards/wildcard-card';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingScreen } from '@/components/core/feedback';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useCreateWildcard, useWildcards } from '@/lib/api/wildcards';
import { clientEvents } from '@/lib/client/events.client';
import { clientLogger } from '@/lib/logger/client-logger';
// El store se expone desde el barrel de la entidad
import { useWildcardStore } from '@/store/entities/wildcard';
import type { ViewProps } from '../types';

const viewLogger = clientLogger.withContext('WildcardsView');

export function WildcardsView({ isVisible }: ViewProps) {
	const { ui: { currentWildcardId }, setCurrentWildcard } = useWildcardStore();
	const { mutate: createWildcard } = useCreateWildcard();

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
			clientEvents.emit('wildcard:selected', { wildcardId });
		},
		[setCurrentWildcard]
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
	}, [newWildcardName, newWildcardDescription, createWildcard]);

	const handleRetry = useCallback(() => {
		viewLogger.info('🔄 Reintentando cargar wildcards');
		refetch();
	}, [refetch]);

	if (!isVisible) return null;

	if (isLoading) {
		return <LoadingScreen message="Cargando wildcards..." />;
	}

	if (error) {
		return (
				<EmptyState
					icon={Sparkles}
					title="Error al cargar wildcards"
					description={error instanceof Error ? error.message : 'Ha ocurrido un error inesperado'}
					actions={
						<Button onClick={handleRetry} variant="outline">
							Reintentar
						</Button>
					}
				/>
			);
	}

	return (
		<ScrollArea className="flex-1">
			<div className="p-6">
				<h2 className="text-xl font-bold mb-4">Vista de Wildcards</h2>

				<Button onClick={() => setShowForm(!showForm)} className="mb-4">
					{showForm ? 'Cancelar' : 'Crear Wildcard'}
				</Button>

				{showForm && (
					<div className="mb-6 p-4 border rounded-lg shadow-sm">
						<h3 className="text-lg font-semibold mb-3">Nuevo Wildcard</h3>
						<div className="grid gap-2 mb-3">
							<Label htmlFor="wildcardName">Nombre</Label>
							<Input
								id="wildcardName"
								value={newWildcardName}
								onChange={(e) => setNewWildcardName(e.target.value)}
								placeholder="Nombre del wildcard"
							/>
						</div>
						<div className="grid gap-2 mb-4">
							<Label htmlFor="wildcardDescription">Descripción</Label>
							<Textarea
								id="wildcardDescription"
								value={newWildcardDescription}
								onChange={(e) => setNewWildcardDescription(e.target.value)}
								placeholder="Descripción del wildcard (opcional)"
							/>
						</div>
						<Button onClick={handleCreateWildcard}>Guardar Wildcard</Button>
					</div>
				)}

				{!wildcards.length && !isLoading && !showForm ? (
					<EmptyState
						icon={Sparkles}
						title="Sin wildcards"
						description={
							localSearch
								? `No se encontraron wildcards que coincidan con "${localSearch}"`
								: 'No hay wildcards disponibles'
						}
					/>
				) : (
					<motion.div
						className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3 }}
					>
						{wildcards.map((wildcard, index) => (
							<motion.div
								key={wildcard.id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.3, delay: index * 0.05 }}
							>
								<WildcardCard
									wildcard={wildcard}
									onClick={() => handleWildcardSelect(wildcard.id)}
									className={wildcard.id === currentWildcardId ? 'ring-2 ring-primary' : ''}
								/>
							</motion.div>
						))}
					</motion.div>
				)}
			</div>
		</ScrollArea>
	);
}
