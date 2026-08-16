import { Sparkles } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WildcardCard } from '@/components/cards/wildcard-card/wildcard-card';
import { LoadingScreen } from '@/components/core/feedback/loading/loading-screen';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from '@/components/ui/motion-shim';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useAuthorizedRoots } from '@/lib/api/authorized-roots';
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
	const createWildcardMutation = useCreateWildcard();
	const { data: authorizedRoots = [] } = useAuthorizedRoots();
	const writableRoots = useMemo(
		() =>
			authorizedRoots.filter(
				(root) =>
					root.permissions.includes('read') && root.permissions.includes('write') && root.permissions.includes('index')
			),
		[authorizedRoots]
	);

	const [localSearch, setLocalSearch] = useState('');
	const [showForm, setShowForm] = useState(false);
	const [newWildcardName, setNewWildcardName] = useState('');
	const [newWildcardDescription, setNewWildcardDescription] = useState('');
	const [newWildcardValues, setNewWildcardValues] = useState('');
	const [artifactRootId, setArtifactRootId] = useState('');
	const createInFlight = useRef(false);

	useEffect(() => {
		if (!artifactRootId && writableRoots[0]) setArtifactRootId(writableRoots[0].id);
	}, [artifactRootId, writableRoots]);

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
	const handleCreateWildcard = useCallback(async () => {
		if (createInFlight.current) return;
		if (newWildcardName.trim() === '') {
			toast({
				title: '❌ Error',
				description: 'Wildcard name cannot be empty.',
				variant: 'destructive',
			});
			return;
		}
		const values = newWildcardValues
			.split('\n')
			.map((value) => value.trim())
			.filter(Boolean);
		if (!artifactRootId || values.length === 0) {
			toast({
				title: 'Canonical file missing',
				description: artifactRootId
					? 'Add at least one value, one per line.'
					: 'Configure a root with read, write, and index permissions to create Wildcards.',
				variant: 'destructive',
			});
			return;
		}
		createInFlight.current = true;
		try {
			await createWildcardMutation.mutateAsync({
				description: newWildcardDescription,
				fileBacking: { body: values.join('\n'), rootId: artifactRootId },
				name: newWildcardName,
			});
			setNewWildcardName('');
			setNewWildcardDescription('');
			setNewWildcardValues('');
			setShowForm(false);
		} catch (error) {
			toast({
				title: 'The Wildcard could not be created',
				description: error instanceof Error ? error.message : 'Unexpected error.',
				variant: 'destructive',
			});
		} finally {
			createInFlight.current = false;
		}
	}, [artifactRootId, createWildcardMutation, newWildcardDescription, newWildcardName, newWildcardValues, toast]);

	const handleRetry = useCallback(() => {
		viewLogger.info('🔄 Reintentando cargar wildcards');
		refetch();
	}, [refetch]);

	// Si isVisible es explícitamente false (modo tabs), no renderizar
	if (isVisible === false) {
		return null;
	}

	if (isLoading) {
		return <LoadingScreen message="Loading wildcards..." />;
	}

	if (error) {
		return (
			<EmptyState
				actions={
					<Button onClick={handleRetry} variant="outline">
						Retry
					</Button>
				}
				description={error instanceof Error ? error.message : 'An unexpected error occurred'}
				icon={Sparkles}
				title="Could not load wildcards"
			/>
		);
	}

	return (
		<ScrollArea className="flex-1">
			<div className="p-6">
				<h2 className="mb-4 font-bold text-xl">Wildcards</h2>

				<Button className="mb-4" onClick={() => setShowForm(!showForm)}>
					{showForm ? 'Cancel' : 'Create Wildcard'}
				</Button>

				{showForm && (
					<div className="mb-6 rounded-lg border p-4 shadow-sm">
						<h3 className="mb-3 font-semibold text-lg">New Wildcard</h3>
						<div className="mb-3 grid gap-2">
							<Label htmlFor="wildcardName">Name</Label>
							<Input
								id="wildcardName"
								onChange={(e) => setNewWildcardName(e.target.value)}
								placeholder="Wildcard name"
								value={newWildcardName}
							/>
						</div>
						<div className="mb-4 grid gap-2">
							<Label htmlFor="wildcardDescription">Description</Label>
							<Textarea
								id="wildcardDescription"
								onChange={(e) => setNewWildcardDescription(e.target.value)}
								placeholder="Wildcard description (optional)"
								value={newWildcardDescription}
							/>
						</div>
						<div className="mb-4 grid gap-2">
							<Label htmlFor="wildcardValues">Values</Label>
							<Textarea
								id="wildcardValues"
								onChange={(event) => setNewWildcardValues(event.target.value)}
								placeholder={'One value per line\nred\ngreen\nblue'}
								value={newWildcardValues}
							/>
						</div>
						<div className="mb-4 grid gap-2">
							<Label>Canonical Library</Label>
							<Select onValueChange={setArtifactRootId} value={artifactRootId || undefined}>
								<SelectTrigger>
									<SelectValue placeholder="Select a root" />
								</SelectTrigger>
								<SelectContent>
									{writableRoots.map((root) => (
										<SelectItem key={root.id} value={root.id}>
											{root.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<Button disabled={createWildcardMutation.isPending} onClick={handleCreateWildcard}>
							{createWildcardMutation.isPending ? 'Guardando…' : 'Save Wildcard'}
						</Button>
					</div>
				)}

				{wildcards.length || isLoading || showForm ? (
					<motion.div
						animate={{ opacity: 1, y: 0 }}
						className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
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
