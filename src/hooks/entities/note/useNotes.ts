import { useCallback, useMemo } from 'react';
import { shallow } from 'zustand/shallow';

import { useNoteStore } from '@/store/entities/note';
import { NoteViewMode } from '@/types/entities/note/enums';
import { NoteFilters } from '@/types/entities/note/extended';

/**
 * Hook para acceder al estado y acciones relacionadas con las notas
 * Proporciona una interfaz simplificada y optimizada al store de notas
 */
export const useNotes = () => {
  // Seleccionar solo lo que necesitamos del store para evitar rerenderizados
  const {
    // Estado de Core
    notes,
    loading,
    error,

    // Acciones de Core
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,

    // Estado de Filters
    filters,
    sortBy,
    page,
    pageSize,

    // Acciones de Filters
    setFilters,
    setSortBy,
    setPage,
    setPageSize,
    resetFilters,

    // Estado de Selection
    selectedNoteId,
    selectedNoteIds,
    isMultiSelectMode,

    // Acciones de Selection
    selectNote,
    unselectNote,
    toggleMultiSelectMode,
    toggleNoteSelection,
    selectAllNotes,
    clearSelection,

    // Estado de UI
    isCreateModalOpen,
    isEditModalOpen,
    isDeleteDialogOpen,
    isDetailsDrawerOpen,
    viewMode,

    // Acciones de UI
    openCreateModal,
    closeCreateModal,
    openEditModal,
    closeEditModal,
    openDeleteDialog,
    closeDeleteDialog,
    openDetailsDrawer,
    closeDetailsDrawer,
    setViewMode
  } = useNoteStore(
    state => ({
      // Core
      notes: state.notes,
      loading: state.loading,
      error: state.error,
      fetchNotes: state.fetchNotes,
      createNote: state.createNote,
      updateNote: state.updateNote,
      deleteNote: state.deleteNote,

      // Filters
      filters: state.filters,
      sortBy: state.sortBy,
      page: state.page,
      pageSize: state.pageSize,
      setFilters: state.setFilters,
      setSortBy: state.setSortBy,
      setPage: state.setPage,
      setPageSize: state.setPageSize,
      resetFilters: state.resetFilters,

      // Selection
      selectedNoteId: state.selectedNoteId,
      selectedNoteIds: state.selectedNoteIds,
      isMultiSelectMode: state.isMultiSelectMode,
      selectNote: state.selectNote,
      unselectNote: state.unselectNote,
      toggleMultiSelectMode: state.toggleMultiSelectMode,
      toggleNoteSelection: state.toggleNoteSelection,
      selectAllNotes: state.selectAllNotes,
      clearSelection: state.clearSelection,

      // UI
      isCreateModalOpen: state.isCreateModalOpen,
      isEditModalOpen: state.isEditModalOpen,
      isDeleteDialogOpen: state.isDeleteDialogOpen,
      isDetailsDrawerOpen: state.isDetailsDrawerOpen,
      viewMode: state.viewMode,
      openCreateModal: state.openCreateModal,
      closeCreateModal: state.closeCreateModal,
      openEditModal: state.openEditModal,
      closeEditModal: state.closeEditModal,
      openDeleteDialog: state.openDeleteDialog,
      closeDeleteDialog: state.closeDeleteDialog,
      openDetailsDrawer: state.openDetailsDrawer,
      closeDetailsDrawer: state.closeDetailsDrawer,
      setViewMode: state.setViewMode
    }),
    shallow // Comparar superficialmente para evitar rerenders innecesarios
  );

  // Memoizar la nota seleccionada para evitar recálculos
  const selectedNote = useMemo(() => {
    if (!selectedNoteId) return null;
    return notes.find(note => note.id === selectedNoteId) || null;
  }, [notes, selectedNoteId]);

  // Memoizar las notas seleccionadas
  const selectedNotes = useMemo(() => {
    if (selectedNoteIds.length === 0) return [];
    return notes.filter(note => selectedNoteIds.includes(note.id));
  }, [notes, selectedNoteIds]);

  // Manejador para filtros combinados
  const handleFilterChange = useCallback((newFilters: Partial<NoteFilters>) => {
    // Mezclamos los filtros actuales con los nuevos
    setFilters({ ...filters, ...newFilters });
    // Volvemos a la primera página cuando cambian los filtros
    setPage(1);
  }, [filters, setFilters, setPage]);

  // Manejador para cambio de vista
  const handleViewModeChange = useCallback((mode: NoteViewMode) => {
    setViewMode(mode);
  }, [setViewMode]);

  // Manejador de selección que controla tanto selección individual como múltiple
  const handleNoteSelect = useCallback((id: string) => {
    if (isMultiSelectMode) {
      toggleNoteSelection(id);
    } else {
      selectNote(id);
    }
  }, [isMultiSelectMode, toggleNoteSelection, selectNote]);

  // Manejador para seleccionar y abrir detalles
  const handleViewNoteDetails = useCallback((id: string) => {
    selectNote(id);
    openDetailsDrawer();
  }, [selectNote, openDetailsDrawer]);

  // Manejador para editar una nota
  const handleEditNote = useCallback((id: string) => {
    selectNote(id);
    openEditModal();
  }, [selectNote, openEditModal]);

  // Manejador para confirmar eliminación
  const handleConfirmDelete = useCallback((id: string) => {
    selectNote(id);
    openDeleteDialog();
  }, [selectNote, openDeleteDialog]);

  // Manejador para eliminación de múltiples notas
  const handleBulkDelete = useCallback(async () => {
    // Eliminar todas las notas seleccionadas
    const deletePromises = selectedNoteIds.map(id => deleteNote(id));
    await Promise.all(deletePromises);
    clearSelection();
  }, [selectedNoteIds, deleteNote, clearSelection]);

  return {
    // Estado
    notes,
    loading,
    error,
    filters,
    sortBy,
    page,
    pageSize,
    selectedNote,
    selectedNoteId,
    selectedNotes,
    selectedNoteIds,
    isMultiSelectMode,
    isCreateModalOpen,
    isEditModalOpen,
    isDeleteDialogOpen,
    isDetailsDrawerOpen,
    viewMode,

    // Acciones básicas
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,

    // Filtros
    setFilters: handleFilterChange,
    setSortBy,
    setPage,
    setPageSize,
    resetFilters,

    // Selección
    selectNote,
    unselectNote,
    toggleMultiSelectMode,
    toggleNoteSelection,
    selectAllNotes,
    clearSelection,

    // UI - Modales y drawers
    openCreateModal,
    closeCreateModal,
    openEditModal,
    closeEditModal,
    openDeleteDialog,
    closeDeleteDialog,
    openDetailsDrawer,
    closeDetailsDrawer,

    // UI - Vista
    setViewMode: handleViewModeChange,

    // Acciones compuestas
    handleNoteSelect,
    handleViewNoteDetails,
    handleEditNote,
    handleConfirmDelete,
    handleBulkDelete
  };
};