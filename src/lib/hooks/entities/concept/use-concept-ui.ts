import { useCallback } from 'react';
import { useConceptStore } from '@/store/entities/concept';
import type { ConceptWithStats } from '@/types/entities/concept/base';

/**
 * Hook que proporciona funcionalidades para gestionar el estado de UI relacionado con conceptos
 */
export function useConceptUI() {
	// Obtener estado y acciones del store relacionadas con UI
	const {
		isCreateModalOpen,
		isEditModalOpen,
		isDeleteDialogOpen,
		isDetailsDrawerOpen,
		selectedConcept,
		openCreateModal,
		closeCreateModal,
		openEditModal,
		closeEditModal,
		openDeleteDialog,
		closeDeleteDialog,
		openDetailsDrawer,
		closeDetailsDrawer,
		selectConcept,
		resetUI,
	} = useConceptStore();

	// Abrir modal de creación
	const handleOpenCreateModal = useCallback(() => {
		openCreateModal();
	}, [openCreateModal]);

	// Cerrar modal de creación
	const handleCloseCreateModal = useCallback(() => {
		closeCreateModal();
	}, [closeCreateModal]);

	// Abrir modal de edición para un concepto específico
	const handleOpenEditModal = useCallback(
		(concept: ConceptWithStats) => {
			selectConcept(concept);
			openEditModal();
		},
		[selectConcept, openEditModal]
	);

	// Cerrar modal de edición
	const handleCloseEditModal = useCallback(() => {
		closeEditModal();
	}, [closeEditModal]);

	// Abrir diálogo de confirmación para eliminar un concepto
	const handleOpenDeleteDialog = useCallback(
		(concept: ConceptWithStats) => {
			selectConcept(concept);
			openDeleteDialog();
		},
		[selectConcept, openDeleteDialog]
	);

	// Cerrar diálogo de eliminación
	const handleCloseDeleteDialog = useCallback(() => {
		closeDeleteDialog();
	}, [closeDeleteDialog]);

	// Abrir drawer de detalles para un concepto específico
	const handleOpenDetailsDrawer = useCallback(
		(concept: ConceptWithStats) => {
			selectConcept(concept);
			openDetailsDrawer();
		},
		[selectConcept, openDetailsDrawer]
	);

	// Cerrar drawer de detalles
	const handleCloseDetailsDrawer = useCallback(() => {
		closeDetailsDrawer();
		// Opcionalmente, limpiar el concepto seleccionado al cerrar
		// selectConcept(null);
	}, [closeDetailsDrawer]);

	// Resetear todo el estado de UI
	const handleResetUI = useCallback(() => {
		resetUI();
		selectConcept(null);
	}, [resetUI, selectConcept]);

	return {
		// Estado actual
		isCreateModalOpen,
		isEditModalOpen,
		isDeleteDialogOpen,
		isDetailsDrawerOpen,
		selectedConcept,

		// Acciones
		openCreateModal: handleOpenCreateModal,
		closeCreateModal: handleCloseCreateModal,
		openEditModal: handleOpenEditModal,
		closeEditModal: handleCloseEditModal,
		openDeleteDialog: handleOpenDeleteDialog,
		closeDeleteDialog: handleCloseDeleteDialog,
		openDetailsDrawer: handleOpenDetailsDrawer,
		closeDetailsDrawer: handleCloseDetailsDrawer,
		resetUI: handleResetUI,
		selectConcept,
	};
}
