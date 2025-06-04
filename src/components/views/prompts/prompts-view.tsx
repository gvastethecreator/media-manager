'use client';

import type { PromptWithStats } from '@/app/actions/prompts/prompt.actions';
import { getPrompts } from '@/app/actions/prompts/prompt.actions';
import { MemoizedPromptCard } from '@/components/cards/prompt-card';
import { EmptyState } from '@/components/core/data-display';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { Alert, AlertCircle, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { clientEvents } from '@/lib/client/events.client';
import { clientLogger } from '@/lib/logger/client-logger';
import { usePromptStore } from '@/store/entities/prompt/store';
import { MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { ViewProps } from '../types';

const viewLogger = clientLogger.withContext('PromptsView');

export function PromptsView(_props: ViewProps) {
	const { setCurrentView } = useNavigationStore();
	const { selectPrompt } = usePromptStore();
	const router = useRouter();
	const [prompts, setPrompts] = useState<PromptWithStats[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Usar el hook de eventos optimistas del cliente
	const [optimisticPrompts, _addEvent] = clientEvents.useEvents<PromptWithStats[]>(prompts);

	const fetchPrompts = useCallback(async () => {
		try {
			setIsLoading(true);
			viewLogger.info('🔄 Cargando prompts...');
			const data = await getPrompts();
			setPrompts(data);
			viewLogger.info(`✅ ${data.length} prompts cargados`);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			viewLogger.error('❌ Error cargando prompts:', err);
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		// Cargar prompts inicialmente
		fetchPrompts();
	}, [fetchPrompts]);

	const handlePromptClick = useCallback(
		(prompt: PromptWithStats) => {
			viewLogger.info('🖱️ Click en prompt:', prompt.name);
			setCurrentView('prompt-content');
			selectPrompt(prompt);
		},
		[setCurrentView, selectPrompt]
	);

	const handlePromptEdit = useCallback(
		(id: string) => {
			viewLogger.info('⚙️ Editando prompt:', id);
			router.push(`/settings/prompts?id=${id}`);
		},
		[router]
	);

	const handlePromptDelete = useCallback((id: string) => {
		viewLogger.info('🗑️ Eliminando prompt:', id);
		// Implementar lógica de eliminación
	}, []);

	// Renderizar el contenido según el estado
	return (
		<motion.div
			className="container mx-auto p-4"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.5 }}
		>
			<ScrollArea className="h-[calc(100vh-120px)]">
				{isLoading ? (
					<div className="flex justify-center items-center h-64">
						<Spinner size="lg" />
					</div>
				) : error ? (
					<Alert variant="destructive" className="mb-4">
						<AlertCircle className="h-4 w-4" />
						<AlertTitle>Error</AlertTitle>
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				) : optimisticPrompts.length === 0 ? (
					<EmptyState
						icon={MessageSquare}
						title="No hay prompts disponibles"
						description="Crea un nuevo prompt para empezar"
					/>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{optimisticPrompts.map((prompt) => (
							<MemoizedPromptCard
								key={prompt.id}
								prompt={prompt}
								onClick={() => handlePromptClick(prompt)}
								className="h-full"
							/>
						))}
					</div>
				)}
			</ScrollArea>
		</motion.div>
	);
}
