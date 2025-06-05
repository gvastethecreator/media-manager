import { act, renderHook } from '@testing-library/react';
import { useProfileStore } from '../store';

describe('Profile Store', () => {
	beforeEach(() => {
		// Limpiar el store antes de cada test
		const store = useProfileStore.getState();
		act(() => {
			store.resetFilters();
			store.resetUI();
			store.setActiveProfile(null);
			store.setProfiles([]);
		});
	});

	describe('Store Initialization', () => {
		it('should initialize with default state', () => {
			const store = useProfileStore.getState();

			expect(store.activeProfile).toBeNull();
			expect(store.isLoadingActive).toBe(false);
			expect(store.activeProfileError).toBeNull();
			expect(store.profiles).toEqual([]);
			expect(store.isLoadingProfiles).toBe(false);
			expect(store.profilesError).toBeNull();
			expect(store.totalProfiles).toBe(0);
			expect(store.currentPage).toBe(1);

			expect(store.viewConfig).toEqual({
				mode: 'grid',
				showStats: true,
				showDescription: true,
				defaultView: 'grid',
				gridColumns: 3,
				cardSize: 'medium',
			});

			expect(store.selectedProfileId).toBeNull();
			expect(store.hoveredProfileId).toBeNull();
			expect(store.expandedProfileIds).toEqual([]);

			expect(store.activeFilters).toEqual([]);
			expect(store.searchTerm).toBe('');
			expect(store.defaultSortOption).toBe('createdAt_desc');
			expect(store.currentSortOption).toBe('createdAt_desc');
			expect(store.groupBy).toBe('none');
		});
	});

	describe('Store Actions', () => {
		const mockProfile = {
			id: '1',
			name: 'Test Profile',
			isActive: true,
			avatarUrl: 'https://example.com/avatar.jpg',
		};

		it('should update active profile', () => {
			const { result } = renderHook(() => useProfileStore());

			act(() => {
				result.current.setActiveProfile(mockProfile);
			});

			expect(result.current.activeProfile).toEqual(mockProfile);
		});

		it('should update profiles list', () => {
			const { result } = renderHook(() => useProfileStore());

			act(() => {
				result.current.setProfiles([mockProfile]);
			});

			expect(result.current.profiles).toEqual([mockProfile]);
			expect(result.current.totalProfiles).toBe(0); // No se actualiza automáticamente
		});

		it('should update view configuration', () => {
			const { result } = renderHook(() => useProfileStore());

			act(() => {
				result.current.setViewMode('list');
				result.current.setShowStats(false);
				result.current.setGridColumns(2);
			});

			expect(result.current.viewConfig.mode).toBe('list');
			expect(result.current.viewConfig.showStats).toBe(false);
			expect(result.current.viewConfig.gridColumns).toBe(2);
		});

		it('should update UI state', () => {
			const { result } = renderHook(() => useProfileStore());

			act(() => {
				result.current.setSelectedProfileId('123');
				result.current.setHoveredProfileId('456');
				result.current.toggleExpandedProfileId('789');
			});

			expect(result.current.selectedProfileId).toBe('123');
			expect(result.current.hoveredProfileId).toBe('456');
			expect(result.current.expandedProfileIds).toEqual(['789']);
		});

		it('should update filters', () => {
			const { result } = renderHook(() => useProfileStore());

			act(() => {
				result.current.setActiveFilters(['active']);
				result.current.setSearchTerm('test');
				result.current.setSortOption('name_asc');
				result.current.setGroupBy('theme');
			});

			expect(result.current.activeFilters).toEqual(['active']);
			expect(result.current.searchTerm).toBe('test');
			expect(result.current.currentSortOption).toBe('name_asc');
			expect(result.current.groupBy).toBe('theme');
		});

		it('should reset filters', () => {
			const { result } = renderHook(() => useProfileStore());

			// Establecer algunos filtros
			act(() => {
				result.current.setActiveFilters(['active']);
				result.current.setSearchTerm('test');
				result.current.setSortOption('name_asc');
				result.current.setGroupBy('theme');
			});

			// Resetear filtros
			act(() => {
				result.current.resetFilters();
			});

			expect(result.current.activeFilters).toEqual([]);
			expect(result.current.searchTerm).toBe('');
			expect(result.current.currentSortOption).toBe(result.current.defaultSortOption);
			expect(result.current.groupBy).toBe('none');
		});

		it('should reset UI state', () => {
			const { result } = renderHook(() => useProfileStore());

			// Establecer algunos valores de UI
			act(() => {
				result.current.setSelectedProfileId('123');
				result.current.setHoveredProfileId('456');
				result.current.toggleExpandedProfileId('789');
			});

			// Resetear UI
			act(() => {
				result.current.resetUI();
			});

			expect(result.current.selectedProfileId).toBeNull();
			expect(result.current.hoveredProfileId).toBeNull();
			expect(result.current.expandedProfileIds).toEqual([]);
		});
	});

	describe('Store Persistence', () => {
		it('should persist view configuration', () => {
			const { result } = renderHook(() => useProfileStore());

			// Modificar la configuración
			act(() => {
				result.current.setViewMode('list');
				result.current.setShowStats(false);
				result.current.setGridColumns(2);
			});

			// Simular recarga creando una nueva instancia del store
			const newStore = useProfileStore.getState();

			expect(newStore.viewConfig.mode).toBe('list');
			expect(newStore.viewConfig.showStats).toBe(false);
			expect(newStore.viewConfig.gridColumns).toBe(2);
		});

		it('should persist filter preferences', () => {
			const { result } = renderHook(() => useProfileStore());

			// Modificar los filtros
			act(() => {
				result.current.setActiveFilters(['active']);
				result.current.setSortOption('name_asc');
				result.current.setGroupBy('theme');
			});

			// Simular recarga creando una nueva instancia del store
			const newStore = useProfileStore.getState();

			expect(newStore.activeFilters).toEqual(['active']);
			expect(newStore.currentSortOption).toBe('name_asc');
			expect(newStore.groupBy).toBe('theme');
		});
	});
});
