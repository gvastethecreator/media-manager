'use client';

import type { ConceptWithStats } from '@/app/actions/concepts/concept.actions';
import { getConcepts } from '@/app/actions/concepts/concept.actions';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { EntityCardAdapter } from '@/components/features/entity-cards/entity-card-adapter';
import type { CardOptions } from '@/components/features/entity-cards/types/unified-card-types';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { clientEvents } from '@/lib/client/events.client';
import { serverLogger } from '@/lib/logger/server-logger';
import { useFileManager } from '@/store/file-manager.store';
import { LightbulbIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { ViewProps } from '../types';

const viewLogger = serverLogger.withContext('ConceptsView');

// Configuración visual simplificada para conceptos
const DEFAULT_CONCEPT_OPTIONS: CardOptions = {
	primaryColor: '#a855f7',
	secondaryColor: '#8b5cf6',
};

export function ConceptsView(_props: ViewProps) {
	const { setCurrentView } = useNavigationStore();
	const { setCurrentConcept } = useFileManager();
	const router = useRouter();
	const [concepts, setConcepts] = useState<ConceptWithStats[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [visualConfig, setVisualConfig] = useState<CardOptions>(DEFAULT_CONCEPT_OPTIONS);

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

	// Cargar la configuración visual desde el servidor
	const loadVisualConfig = useCallback(async () => {
		try {
			viewLogger.info('🔄 Cargando configuración visual para conceptos...');
			const response = await fetch('/api/entities/concepts/visual-config');
			if (!response.ok) {
				throw new Error(`Error ${response.status}: ${response.statusText}`);
			}
			const config = await response.json();
			setVisualConfig({ ...DEFAULT_CONCEPT_OPTIONS, ...config });
			viewLogger.info('✅ Configuración visual cargada');
		} catch (err) {
			viewLogger.error('❌ Error cargando configuración visual:', err);
			// Mantener la configuración predeterminada en caso de error
		}
	}, []);

	useEffect(() => {
		// Cargar conceptos inicialmente
		fetchConcepts();
		// Cargar configuración visual
		loadVisualConfig();
	}, [fetchConcepts, loadVisualConfig]);

	const handleConceptClick = useCallback(
		(concept: ConceptWithStats) => {
			viewLogger.info('🖱️ Click en concepto:', concept.name);
			setCurrentView('concept-content');
			setCurrentConcept(concept.id);
		},
		[setCurrentView, setCurrentConcept]
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
							<EntityCardAdapter
								entityType="concept"
								entity={concept}
								onClick={() => handleConceptClick(concept)}
								options={visualConfig}
								className="h-full"
							/>
						</motion.div>
					))}
				</div>
			</div>
		</ScrollArea>
	);
}
