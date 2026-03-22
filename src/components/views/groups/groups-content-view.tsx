import { Group as GroupIcon } from 'lucide-react';
import React, { memo } from 'react';
import { GroupCard } from '@/components/cards/group-card/group-card';
import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { LoadingScreen } from '@/components/core/feedback/loading/loading-screen';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from '@/components/ui/motion-shim';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { clientLogger } from '@/lib/logger/client-logger';
import type { GroupWithStats } from '@/types/entities/group';

interface GroupsContentViewProps {
	className?: string;
	error: string | null;
	groups: GroupWithStats[];
	handleCreateGroup: () => void;
	handleGroupClick: (group: GroupWithStats) => void;
	isLoading: boolean;
	newGroupDescription: string;
	newGroupName: string;
	optimisticGroups: GroupWithStats[];
	setNewGroupDescription: (description: string) => void;
	setNewGroupName: (name: string) => void;
	setShowForm: (show: boolean) => void;
	showForm: boolean;
}

// Componente memoizado para cada tarjeta de grupo
const MemoizedGroupCard = memo(
	({ group, onGroupClick }: { group: GroupWithStats; onGroupClick: () => void }) => {
		return <GroupCard className="h-full" group={group} onClick={onGroupClick} />;
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
			<div className="flex h-full items-center justify-center">
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
				<h2 className="mb-4 font-bold text-xl">Vista de Grupos</h2>

				<Button className="mb-4" onClick={() => setShowForm(!showForm)}>
					{showForm ? 'Cancelar' : 'Crear Grupo'}
				</Button>

				{showForm && (
					<div className="mb-6 rounded-lg border p-4 shadow-sm">
						<h3 className="mb-3 font-semibold text-lg">Nuevo Grupo</h3>
						<div className="mb-3 grid gap-2">
							<Label htmlFor="groupName">Nombre</Label>
							<Input
								id="groupName"
								onChange={(e) => setNewGroupName(e.target.value)}
								placeholder="Nombre del grupo"
								value={newGroupName}
							/>
						</div>
						<div className="mb-4 grid gap-2">
							<Label htmlFor="groupDescription">Descripción</Label>
							<Textarea
								id="groupDescription"
								onChange={(e) => setNewGroupDescription(e.target.value)}
								placeholder="Descripción del grupo (opcional)"
								value={newGroupDescription}
							/>
						</div>
						<Button onClick={handleCreateGroup}>Guardar Grupo</Button>
					</div>
				)}

				{!optimisticGroups || (optimisticGroups.length === 0 && !isLoading && !showForm) ? (
					<EmptyState
						description="Crea un grupo para organizar tus entidades."
						icon={GroupIcon}
						title="No hay grupos creados"
					/>
				) : (
					<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
						{optimisticGroups.map((group, index) => {
							// Verificar que el grupo tenga un id válido
							if (!group?.id) {
								clientLogger.error('Grupo sin id válido:', group);
								return null;
							}

							// Crear una función de clic específica para este grupo
							const onGroupClick = () => handleGroupClick(group);

							return (
								<motion.div
									animate={{ opacity: 1, y: 0 }}
									className="perspective-1000"
									initial={{ opacity: 0, y: 20 }}
									key={group.id}
									transition={{ delay: index * 0.1 }}
								>
									<div
										className="h-full w-full transition-all duration-dt-normal ease-dt-out hover:z-10 hover:scale-[1.03] active:scale-[0.98]"
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
					<div className="mt-8 border-border border-t pt-6">
						<p className="text-center text-muted-foreground text-sm">
							Mostrando {optimisticGroups.length} {optimisticGroups.length === 1 ? 'grupo' : 'grupos'}
						</p>
					</div>
				)}
			</div>
		</ScrollArea>
	);
};

export default GroupsContentView;
