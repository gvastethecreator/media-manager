import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientEvents } from '@/lib/client/events.client';
import { clientLogger } from '@/lib/logger/client-logger';
import { useGroupStore } from '@/store/entities/group';
import type { GroupWithStats } from '@/types/entities/group';
import type { ViewProps } from '../types';
import GroupsContentView from './groups-content-view';

const viewLogger = clientLogger.withContext('GroupsView');

export function GroupsView(_props: ViewProps) {
	const navigate = useNavigate();

	// Leer el estado y las acciones directamente del store de Zustand
	const { groups, isLoading, error, fetchGroups, addGroup } = useGroupStore((state) => ({
		groups: Object.values(state.groups) as GroupWithStats[],
		isLoading: state.isLoading,
		error: state.error,
		fetchGroups: state.loadGroups,
		addGroup: state.createGroup,
	}));

	const [showForm, setShowForm] = useState(false);
	const [newGroupName, setNewGroupName] = useState('');
	const [newGroupDescription, setNewGroupDescription] = useState('');

	// Usar el hook de eventos optimistas del cliente con los datos del store
	const [optimisticGroups, _addEvent] = clientEvents.useEvents<GroupWithStats[]>(groups);

	useEffect(() => {
		// Cargar grupos inicialmente a través de la acción del store.
		// El store se encargará de manejar el estado de carga y los errores.
		fetchGroups();
	}, [fetchGroups]);

	const handleGroupClick = useCallback(
		(group: GroupWithStats) => {
			viewLogger.info('🖱️ Click en grupo:', group.name);
			// Navegar a la vista de detalle del grupo usando React Router
			navigate('/group-content');
			// Emitir evento para otros componentes que puedan necesitar este dato
			clientEvents.emit('group:selected', { groupId: group.id });
		},
		[navigate]
	);

	const handleCreateGroup = useCallback(() => {
		if (newGroupName.trim() === '') {
			viewLogger.error('Nombre del grupo vacío');
			return;
		}
		addGroup({ name: newGroupName, description: newGroupDescription });
		setNewGroupName('');
		setNewGroupDescription('');
		setShowForm(false);
	}, [newGroupName, newGroupDescription, addGroup]);

	return (
		<GroupsContentView
			error={error}
			groups={groups}
			handleCreateGroup={handleCreateGroup}
			handleGroupClick={handleGroupClick}
			isLoading={isLoading}
			newGroupDescription={newGroupDescription}
			newGroupName={newGroupName}
			optimisticGroups={optimisticGroups}
			setNewGroupDescription={setNewGroupDescription}
			setNewGroupName={setNewGroupName}
			setShowForm={setShowForm}
			showForm={showForm}
		/>
	);
}
