import { Group as GroupIcon } from 'lucide-react';
import { motion } from 'motion/react';
import React, { memo, useCallback } from 'react';
import { GroupCard } from '@/components/cards/group-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import type { GroupWithStats } from '@/types/entities/group';

interface GroupsContentViewProps {
	groups: GroupWithStats[];
	isLoading: boolean;
	error: string | null;
	showForm: boolean;
	newGroupName: string;
	newGroupDescription: string;
	optimisticGroups: GroupWithStats[];
	setShowForm: (show: boolean) => void;
	setNewGroupName: (name: string) => void;
	setNewGroupDescription: (description: string) => void;
	handleGroupClick: (group: GroupWithStats) => void;
	handleCreateGroup: () => void;
	className?: string;
}

// Componente memoizado para cada tarjeta de grupo
const MemoizedGroupCard = memo(
	({ group, onGroupClick }: { group: GroupWithStats; onGroupClick: () => void }) => {
		// Asegurarse de que el grupo tenga todas las propiedades requeridas
		const completeGroup = {
			...group,
			emoji: '📂',
			color: '#60a5fa',
		};

		return <GroupCard groupId={group.id} onClick={onGroupClick} className="h-full" />;
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

const GroupsContentView: React.FC<GroupsContentViewProps> = ({
	groups,
	isLoading,
	error,
	showForm,
	newGroupName,
	newGroupDescription,
	optimisticGroups,
	setShowForm,
	setNewGroupName,
	setNewGroupDescription,
	handleGroupClick,
	handleCreateGroup,
	className,
}) => {
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

	return (
		<ScrollArea className={className || 'h-full'}>
			<div className="container mx-auto p-6">
				<h2 className="text-xl font-bold mb-4">Vista de Grupos</h2>

				<Button onClick={() => setShowForm(!showForm)} className="mb-4">
					{showForm ? 'Cancelar' : 'Crear Grupo'}
				</Button>

				{showForm && (
					<div className="mb-6 p-4 border rounded-lg shadow-sm">
						<h3 className="text-lg font-semibold mb-3">Nuevo Grupo</h3>
						<div className="grid gap-2 mb-3">
							<Label htmlFor="groupName">Nombre</Label>
							<Input
								id="groupName"
								value={newGroupName}
								onChange={(e) => setNewGroupName(e.target.value)}
								placeholder="Nombre del grupo"
							/>
						</div>
						<div className="grid gap-2 mb-4">
							<Label htmlFor="groupDescription">Descripción</Label>
							<Textarea
								id="groupDescription"
								value={newGroupDescription}
								onChange={(e) => setNewGroupDescription(e.target.value)}
								placeholder="Descripción del grupo (opcional)"
							/>
						</div>
						<Button onClick={handleCreateGroup}>Guardar Grupo</Button>
					</div>
				)}

				{!optimisticGroups || (optimisticGroups.length === 0 && !isLoading && !showForm) ? (
					<EmptyState
						icon={GroupIcon}
						title="No hay grupos creados"
						description="Crea un grupo para organizar tus entidades."
					/>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{optimisticGroups.map((group, index) => {
							// Verificar que el grupo tenga un id válido
							if (!group || !group.id) {
								console.error('Grupo sin id válido:', group);
								return null;
							}

							// Crear una función de clic específica para este grupo
							const onGroupClick = () => handleGroupClick(group);

							return (
								<motion.div
									key={group.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.1 }}
									className="perspective-1000"
								>
									<div
										className="h-full w-full transition-all ease-in-out hover:scale-[1.03] active:scale-[0.98] duration-300 hover:z-10"
										data-group-id={group.id}
									>
										<MemoizedGroupCard group={group} onGroupClick={onGroupClick} />
									</div>
								</motion.div>
							);
						})}
					</div>
				)}

				{/* Footer con información adicional */}
				{optimisticGroups.length > 0 && (
					<div className="mt-8 pt-6 border-t border-border">
						<p className="text-sm text-muted-foreground text-center">
							Mostrando {optimisticGroups.length} {optimisticGroups.length === 1 ? 'grupo' : 'grupos'}
						</p>
					</div>
				)}
			</div>
		</ScrollArea>
	);
};

export default GroupsContentView;
