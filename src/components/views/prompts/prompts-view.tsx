'use client';

import type { PromptWithStats } from '@/app/actions/prompts/prompt.actions';
import { getPrompts } from '@/app/actions/prompts/prompt.actions';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { EntityCardAdapter } from '@/components/features/entity-cards/adapters/entity-card-adapter';
import type { CardOptions } from '@/components/features/entity-cards/types/unified-card-types';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { clientEvents } from '@/lib/client/events.client';
import { serverLogger } from '@/lib/logger/server-logger';
import { useFileManager } from '@/store/file-manager.store';
import { MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { ViewProps } from '../types';

const viewLogger = serverLogger.withContext('PromptsView');

// Configuración visual predeterminada para prompts
const DEFAULT_PROMPT_OPTIONS: CardOptions = {
	enable3DEffect: true,
	enableHolographicEffect: true,
	enableScanlines: false,
	enableLightHalo: true,
	enableAnimatedBorder: true,
	enableGlowEffect: true,
	enableGrainEffect: false,
	useImageGrid: true,
	imageGridLayout: 'quad',
	imageGridGap: 4,
	imageGridStyle: 'standard',
	designSystem: {
		preset: 'prompt',
		variant: 'default',
		aspectRatio: '3/2',
		cornerStyle: 'rounded',
		cornerRadius: 12,
		elevation: 3,
		shadowStyle: 'soft',
	},
	layerSystem: {
		order: ['background', 'content', 'effects', 'holographic', 'border', 'filter'],
		layerBlending: 'screen',
		layerSpacing: 2,
	},
	primaryColor: '#10b981',
	secondaryColor: '#059669',
	hoverLiftHeight: 10,
	maxRotation: 15,
};

export function PromptsView(_props: ViewProps) {
	const { setCurrentView } = useNavigationStore();
	const { setCurrentPrompt } = useFileManager();
	const router = useRouter();
	const [prompts, setPrompts] = useState<PromptWithStats[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [visualConfig, setVisualConfig] = useState<CardOptions>(DEFAULT_PROMPT_OPTIONS);

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

	// Cargar la configuración visual desde el servidor
	const loadVisualConfig = useCallback(async () => {
		try {
			viewLogger.info('🔄 Cargando configuración visual para prompts...');
			const response = await fetch('/api/entities/prompts/visual-config');
			if (!response.ok) {
				throw new Error(`Error ${response.status}: ${response.statusText}`);
			}
			const config = await response.json();
			setVisualConfig({ ...DEFAULT_PROMPT_OPTIONS, ...config });
			viewLogger.info('✅ Configuración visual cargada');
		} catch (err) {
			viewLogger.error('❌ Error cargando configuración visual:', err);
			// Mantener la configuración predeterminada en caso de error
		}
	}, []);

	useEffect(() => {
		// Cargar prompts inicialmente
		fetchPrompts();
		// Cargar configuración visual
		loadVisualConfig();
	}, [fetchPrompts, loadVisualConfig]);

	const handlePromptClick = useCallback(
		(prompt: PromptWithStats) => {
			viewLogger.info('🖱️ Click en prompt:', prompt.name);
			setCurrentView('prompt-content');
			setCurrentPrompt(prompt.id);
		},
		[setCurrentView, setCurrentPrompt]
	);

	const handleEditPrompt = useCallback(
		(id: string) => {
			viewLogger.info('⚙️ Editando prompt:', id);
			router.push(`/settings/prompts?id=${id}`);
		},
		[router]
	);

	const handleDeletePrompt = useCallback((id: string) => {
		viewLogger.info('🗑️ Eliminando prompt:', id);
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

	if (!optimisticPrompts || optimisticPrompts.length === 0) {
		return (
			<EmptyState
				icon={MessageSquare}
				title="No hay prompts"
				description="Los prompts te ayudan a generar contenido con IA. Crea un nuevo prompt desde el panel de configuración."
			/>
		);
	}

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{optimisticPrompts.map((prompt, index) => (
						<motion.div
							key={prompt.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.1 }}
							className="cursor-pointer"
						>
							<EntityCardAdapter
								entityType="prompt"
								entity={prompt}
								onClick={() => handlePromptClick(prompt)}
								showVisualConfig={true}
								enableExplode={true}
								options={visualConfig}
							/>
						</motion.div>
					))}
				</div>
			</div>
		</ScrollArea>
	);
}
