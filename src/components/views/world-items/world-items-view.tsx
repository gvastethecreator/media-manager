'use client';

import type { WorldItemWithStats } from '@/app/actions/world-items/world-item.actions';
import { getWorldItems } from '@/app/actions/world-items/world-item.actions';
import { WorldItemCard } from '@/components/cards/world-item-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { clientEvents } from '@/lib/client/events.client';
import { serverLogger } from '@/lib/logger/server-logger';
import { useFileManager } from '@/store/files/file-manager.store';
import { Box } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import type { ViewProps } from '../types';

const viewLogger = serverLogger.withContext('WorldItemsView');

// Configuración visual simplificada para objetos del mundo
const DEFAULT_WORLD_ITEM_OPTIONS: CardOptions = {
	primaryColor: '#f59e0b',
	secondaryColor: '#d97706',
};

export function WorldItemsView(_props: ViewProps) {
	const { setCurrentView } = useNavigationStore();
	const { setCurrentWorldItem } = useFileManager();
	const [worldItems, setWorldItems] = useState<WorldItemWithStats[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [visualConfig, setVisualConfig] = useState<CardOptions>(DEFAULT_WORLD_ITEM_OPTIONS);

	// Usar el hook de eventos optimistas del cliente
	const [optimisticWorldItems, _addEvent] = clientEvents.useEvents<WorldItemWithStats[]>(worldItems);

	const fetchWorldItems = useCallback(async () => {
		try {
			setIsLoading(true);
			viewLogger.info('🔄 Cargando objetos del mundo...');
			const data = await getWorldItems();
			setWorldItems(data);
			viewLogger.info(`✅ ${data.length} objetos del mundo cargados`);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			viewLogger.error('❌ Error cargando objetos del mundo:', err);
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Cargar la configuración visual desde el servidor
	const loadVisualConfig = useCallback(async () => {
		try {
			viewLogger.info('🔄 Cargando configuración visual para objetos del mundo...');
			const response = await fetch('/api/entities/world-items/visual-config');
			if (!response.ok) {
				throw new Error(`Error ${response.status}: ${response.statusText}`);
			}
			const config = await response.json();
			setVisualConfig({ ...DEFAULT_WORLD_ITEM_OPTIONS, ...config });
			viewLogger.info('✅ Configuración visual cargada');
		} catch (err) {
			viewLogger.error('❌ Error cargando configuración visual:', err);
			// Mantener la configuración predeterminada en caso de error
		}
	}, []);

	useEffect(() => {
		// Cargar objetos inicialmente
		fetchWorldItems();
		// Cargar configuración visual
		loadVisualConfig();
	}, [fetchWorldItems, loadVisualConfig]);

	const handleWorldItemClick = useCallback(
		(worldItem: WorldItemWithStats) => {
			viewLogger.info('🖱️ Click en objeto del mundo:', worldItem.name);
			setCurrentView('world-item-content');
			setCurrentWorldItem(worldItem.id);
		},
		[setCurrentView, setCurrentWorldItem]
	);

	const handleEditWorldItem = useCallback((worldItem: WorldItemWithStats) => {
		viewLogger.info('✏️ Editando objeto del mundo:', worldItem.name);
		// Implementar lógica de edición
	}, []);

	const handleDeleteWorldItem = useCallback((id: string) => {
		viewLogger.info('🗑️ Eliminando objeto del mundo:', id);
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

	if (!optimisticWorldItems || optimisticWorldItems.length === 0) {
		return (
			<EmptyState
				icon={Box}
				title="No hay objetos del mundo"
				description="Los objetos del mundo te ayudan a organizar tus imágenes. Crea un nuevo objeto del mundo desde el panel de configuración."
			/>
		);
	}

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{optimisticWorldItems.map((worldItem, index) => (
						<motion.div
							key={worldItem.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.1 }}
						>
							<WorldItemCard
								worldItem={worldItem}
								onClick={handleWorldItemClick}
								className="h-full"
							/>
						</motion.div>
					))}
				</div>
			</div>
		</ScrollArea>
	);
}
