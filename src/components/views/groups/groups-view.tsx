'use client';

import { Group as GroupIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';
import { type GroupWithStats, getGroups } from '@/app/actions/groups/group.actions';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { clientEvents } from '@/lib/client/events.client';
import { clientLogger } from '@/lib/logger/client-logger';
import { useGroupStore } from '@/store/entities/group';
import type { ViewProps } from '../types';
import { GroupCard } from './group-card';

const viewLogger = clientLogger.withContext('GroupsView');

// Componente memoizado para cada tarjeta de grupo
const MemoizedGroupCard = React.memo(
	({ group, onGroupClick }: { group: GroupWithStats; onGroupClick: () => void }) => {
		// Asegurarse de que el grupo tenga todas las propiedades requeridas
		const completeGroup = {
			...group,
			emoji: group.emoji || '📂',
			color: group.color || '#60a5fa',
		};

		return <GroupCard group={completeGroup} onClick={onGroupClick} className="h-full" />;
	},
	(prevProps, nextProps) => {
		// Memoización personalizada para solo re-renderizar si cambian propiedades importantes
		return (
			prevProps.group.id === nextProps.group.id &&
			prevProps.group.name === nextProps.group.name &&
			prevProps.group.updatedAt === nextProps.group.updatedAt
		);
	}
);

// Para evitar advertencias de displayName
MemoizedGroupCard.displayName = 'MemoizedGroupCard';

export function GroupsView(_props: ViewProps) {
	const { setCurrentView } = useNavigationStore();
	const { addGroup, addGroups } = useGroupStore();
	const router = useRouter();
	const [groups, setGroups] = useState<GroupWithStats[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Usar el hook de eventos optimistas del cliente
	const [optimisticGroups, _addEvent] = clientEvents.useEvents<GroupWithStats[]>(groups);

	const fetchGroups = useCallback(async () => {
		try {
			setIsLoading(true);
			viewLogger.info('🔄 Cargando grupos...');
			const data = await getGroups();
			setGroups(data);
			// Actualizar el store con los grupos obtenidos
			addGroups(data);
			viewLogger.info(`✅ ${data.length} grupos cargados`);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			viewLogger.error('❌ Error cargando grupos:', err);
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, [addGroups]);

	useEffect(() => {
		// Cargar grupos inicialmente
		fetchGroups();
	}, [fetchGroups]);

	const handleGroupClick = useCallback(
		(group: GroupWithStats) => {
			viewLogger.info('🖱️ Click en grupo:', group.name);
			setCurrentView('group-content');
			// Actualizar la información del grupo en el store
			addGroup(group);
			// Navegar a la vista de detalle del grupo
			router.push(`/groups/${group.id}`);
		},
		[setCurrentView, addGroup, router]
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

	if (!optimisticGroups || optimisticGroups.length === 0) {
		return (
			<EmptyState
				icon={GroupIcon}
				title="No hay grupos creados"
				description="Crea un grupo para organizar tus entidades."
			/>
		);
	}

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{optimisticGroups.map((group, index) => {
						// Verificar que el grupo tenga un id válido
						if (!group || !(group as any).id) {
							console.error('Grupo sin id válido:', group);
							return null;
						}

						// Crear una función de clic específica para este grupo
						const onGroupClick = () => handleGroupClick(group);

						return (
							<motion.div
								key={(group as any).id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.1 }}
								className="perspective-1000"
							>
								<div
									className="h-full w-full transition-all ease-in-out hover:scale-[1.03] active:scale-[0.98] duration-300 hover:z-10"
									data-group-id={(group as any).id}
								>
									<MemoizedGroupCard group={group} onGroupClick={onGroupClick} />
								</div>
							</motion.div>
						);
					})}
				</div>
			</div>
		</ScrollArea>
	);
}
