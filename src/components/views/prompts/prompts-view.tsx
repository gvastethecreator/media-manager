'use client';

import { MemoizedPromptCard } from '@/components/cards/prompt-card';
import { EmptyState } from '@/components/core/data-display';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { usePrompts } from '@/lib/api/prompts';
import { clientEvents } from '@/lib/client/events.client';
import { clientLogger } from '@/lib/logger/client-logger';
import { usePromptStore } from '@/store/entities/prompt/store';
import { AlertCircle, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { ViewProps } from '../types';

const viewLogger = clientLogger.withContext('PromptsView');

export function PromptsView({ isVisible }: ViewProps) {
	const router = useRouter();
	const { searchTerm, sortBy, sortOrder } = useNavigationStore();
	const { selectedPromptId, setSelectedPromptId } = usePromptStore();
	const [localSearch, setLocalSearch] = useState(searchTerm || '');

	// Usar React Query hook en lugar de server action
	const {
		data: prompts = [],
		isLoading,
		error,
		refetch
	} = usePrompts({
		search: localSearch,
		sortBy: sortBy as 'name' | 'createdAt' | 'updatedAt',
		sortOrder: sortOrder as 'asc' | 'desc'
	});

	// Sincronizar búsqueda local con store de navegación
	useEffect(() => {
		if (searchTerm !== localSearch) {
			setLocalSearch(searchTerm || '');
		}
	}, [searchTerm, localSearch]);

	const handlePromptSelect = useCallback(
		(promptId: string) => {
			viewLogger.info('🤖 Seleccionando prompt', { promptId });
			setSelectedPromptId(promptId);
			clientEvents.emit('prompt:selected', { promptId });
		},
		[setSelectedPromptId]
	);

	const handlePromptEdit = useCallback(
		(promptId: string) => {
			viewLogger.info('✏️ Editando prompt', { promptId });
			router.push(`/prompts/${promptId}/edit`);
		},
		[router]
	);

	const handleRetry = useCallback(() => {
		viewLogger.info('🔄 Reintentando cargar prompts');
		refetch();
	}, [refetch]);

	if (!isVisible) return null;

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="flex flex-col items-center gap-3">
					<Spinner size="lg" />
					<p className="text-sm text-muted-foreground">Cargando prompts...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-6">
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertTitle>Error al cargar prompts</AlertTitle>
					<AlertDescription>
						{error instanceof Error ? error.message : 'Ha ocurrido un error inesperado'}
						<button
							onClick={handleRetry}
							className="ml-2 underline hover:no-underline"
						>
							Reintentar
						</button>
					</AlertDescription>
				</Alert>
			</div>
		);
	}

	if (!prompts.length) {
		const emptyMessage = localSearch
			? `No se encontraron prompts que coincidan con "${localSearch}"`
			: 'No hay prompts disponibles';

		return (
			<EmptyState
				icon={MessageSquare}
				title="Sin prompts"
				description={emptyMessage}
			/>
		);
	}

	return (
		<ScrollArea className="flex-1">
			<div className="p-6">
				<motion.div
					className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3 }}
				>
					{prompts.map((prompt, index) => (
						<motion.div
							key={prompt.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3, delay: index * 0.05 }}
						>
							<MemoizedPromptCard
								prompt={prompt}
								isSelected={prompt.id === selectedPromptId}
								onSelect={() => handlePromptSelect(prompt.id)}
								onEdit={() => handlePromptEdit(prompt.id)}
							/>
						</motion.div>
					))}
				</motion.div>
			</div>
		</ScrollArea>
	);
}
