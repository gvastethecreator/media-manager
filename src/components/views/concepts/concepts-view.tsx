'use client';

import type { ConceptWithStats } from '@/app/actions/concepts/concept.actions';
import { getConcepts } from '@/app/actions/concepts/concept.actions';
import { MemoizedConceptCard } from '@/components/cards/concept-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { clientEvents } from '@/lib/client/events.client';
import { clientLogger } from '@/lib/logger/client-logger';
import { useConceptStore } from '@/store/entities/concept';
import { LightbulbIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { ViewProps } from '../types';

const viewLogger = clientLogger.withContext('ConceptsView');

export function ConceptsView(_props: ViewProps) {
	const { setCurrentView } = useNavigationStore();
	const { selectConcept } = useConceptStore();
	const router = useRouter();
	const [concepts, setConcepts] = useState<ConceptWithStats[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Usar el hook de eventos optimistas del cliente
	const [optimisticConcepts, _addEvent] = clientEvents.useEvents<ConceptWithStats[]>(concepts);

	const fetchConcepts = useCallback(async () => {
		try {
			setIsLoading(true);
			viewLogger.info('🔄 Cargando conceptos...');
			const data = await getConcepts();
			setConcepts(data);
			viewLogger.info(`✅ ${data.length} conceptos cargados`);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			viewLogger.error('❌ Error cargando conceptos:', err);
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		// Cargar conceptos inicialmente
		fetchConcepts();
	}, [fetchConcepts]);

	const handleConceptClick = useCallback(
		(concept: ConceptWithStats) => {
			viewLogger.info('🖱️ Click en concepto:', concept.name);
			setCurrentView('concept-content');
			selectConcept(concept);
		},
		[setCurrentView, selectConcept]
	);

	const handleEditConcept = useCallback(
		(concept: ConceptWithStats) => {
			viewLogger.info('⚙️ Editando concepto:', concept.name);
			router.push(`/settings/concepts?id=${concept.id}`);
		},
		[router]
	);

	const handleDeleteConcept = useCallback((id: string) => {
		viewLogger.info('🗑️ Eliminando concepto:', id);
		// Implementar lógica de eliminación
	}, []);

	if (error) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-destructive">Error: {error}</p>
			</div>
		);
	}

	if (isLoading) {
		return <LoadingScreen />;
	}

	if (!optimisticConcepts || optimisticConcepts.length === 0) {
		return (
			<EmptyState
				icon={LightbulbIcon}
				title="No hay conceptos"
				description="Los conceptos te ayudan a organizar tus ideas y proyectos. Crea un nuevo concepto desde el panel de configuración."
			/>
		);
	}

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{optimisticConcepts.map((concept, index) => (
						<motion.div
							key={concept.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.1 }}
							className="cursor-pointer"
						>
							<MemoizedConceptCard concept={concept} onClick={() => handleConceptClick(concept)} className="h-full" />
						</motion.div>
					))}
				</div>
			</div>
		</ScrollArea>
	);
}
