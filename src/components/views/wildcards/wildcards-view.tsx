'use client';

import { getWildcards } from '@/app/actions/wildcards/wildcard.actions';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { clientEvents } from '@/lib/client/events.client';
import { clientLogger } from '@/lib/logger/client-logger';
import { useWildcardStore } from '@/store/entities/wildcard';
import { WandSparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';
import type { ViewProps } from '../types';
import { WildcardCard } from './wildcard-card';

// Definir el tipo para comodines con estadísticas
export interface WildcardWithStats {
	id: string;
	name: string;
	pattern: string;
	description: string | null;
	values: string[];
	createdAt: Date;
	updatedAt: Date;
	_count?: {
		groups: number;
		prompts: number;
		images: number;
	};
	usageCount: number;
}

const viewLogger = clientLogger.withContext('WildcardsView');

// Componente memoizado para cada tarjeta de comodín
const MemoizedWildcardCard = React.memo(
	({
		wildcard,
		onWildcardClick,
	}: {
		wildcard: WildcardWithStats;
		onWildcardClick: () => void;
	}) => {
		return <WildcardCard wildcard={wildcard} onClick={onWildcardClick} className="h-full" />;
	},
	(prevProps, nextProps) => {
		// Memoización personalizada para solo re-renderizar si cambian propiedades importantes
		return (
			prevProps.wildcard.id === nextProps.wildcard.id &&
			prevProps.wildcard.name === nextProps.wildcard.name &&
			prevProps.wildcard.updatedAt === nextProps.wildcard.updatedAt
		);
	}
);

// Para evitar advertencias de displayName
MemoizedWildcardCard.displayName = 'MemoizedWildcardCard';

export function WildcardsView(_props: ViewProps) {
	const { setCurrentView } = useNavigationStore();
	const { addWildcard, addWildcards } = useWildcardStore();
	const router = useRouter();
	const [wildcards, setWildcards] = useState<WildcardWithStats[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Usar el hook de eventos optimistas del cliente
	const [optimisticWildcards, _addEvent] = clientEvents.useEvents<WildcardWithStats[]>(wildcards);

	const fetchWildcards = useCallback(async () => {
		try {
			setIsLoading(true);
			viewLogger.info('🔄 Cargando comodines...');
			const data = await getWildcards();

			// Calcular estadísticas adicionales
			const wildcardsWithStats = data.map((wildcard) => {
				const usageCount = (wildcard._count?.prompts || 0) + (wildcard._count?.images || 0);
				return {
					...wildcard,
					usageCount,
				};
			});

			setWildcards(wildcardsWithStats);
			// Actualizar el store con los comodines obtenidos
			addWildcards(data);
			viewLogger.info(`✅ ${data.length} comodines cargados`);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			viewLogger.error('❌ Error cargando comodines:', err);
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, [addWildcards]);

	useEffect(() => {
		// Cargar comodines inicialmente
		fetchWildcards();
	}, [fetchWildcards]);

	const handleWildcardClick = useCallback(
		(wildcard: WildcardWithStats) => {
			viewLogger.info('🖱️ Click en comodín:', wildcard.name);
			setCurrentView('wildcard-detail');
			// Actualizar la información del comodín en el store
			addWildcard(wildcard);
			// Navegar a la vista de detalle del comodín
			router.push(`/wildcards/${wildcard.id}`);
		},
		[setCurrentView, addWildcard, router]
	);

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

	if (!optimisticWildcards || optimisticWildcards.length === 0) {
		return (
			<EmptyState
				icon={WandSparkles}
				title="No hay comodines creados"
				description="Crea comodines para usar en tus prompts con valores aleatorios o específicos."
			/>
		);
	}

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{optimisticWildcards.map((wildcard, index) => {
						// Verificar que el comodín tenga un id válido
						if (!wildcard || !(wildcard as any).id) {
							console.error('Comodín sin id válido:', wildcard);
							return null;
						}

						// Crear una función de clic específica para este comodín
						const onWildcardClick = () => handleWildcardClick(wildcard);

						return (
							<motion.div
								key={(wildcard as any).id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.1 }}
								className="perspective-1000"
							>
								<div
									className="h-full w-full transition-all ease-in-out hover:scale-[1.03] active:scale-[0.98] duration-300 hover:z-10"
									data-wildcard-id={(wildcard as any).id}
								>
									<MemoizedWildcardCard wildcard={wildcard} onWildcardClick={onWildcardClick} />
								</div>
							</motion.div>
						);
					})}
				</div>
			</div>
		</ScrollArea>
	);
}
