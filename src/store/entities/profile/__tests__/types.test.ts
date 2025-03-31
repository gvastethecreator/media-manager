import type {
    ProfileFiltersState,
    ProfileState,
    ProfileStoreState,
    ProfileUIState,
    ProfileViewConfig
} from '../types';

describe('Profile Store Types', () => {
  describe('ProfileState', () => {
    it('should have all required properties', () => {
      const mockState: ProfileState = {
        activeProfile: null,
        isLoadingActive: false,
        activeProfileError: null,
        profiles: [],
        isLoadingProfiles: false,
        profilesError: null,
        totalProfiles: 0,
        currentPage: 1,
        filters: {
          status: 'all',
          theme: 'all',
          language: 'all',
          search: ''
        },
        pagination: {
          page: 1,
          limit: 10,
          orderBy: 'createdAt',
          order: 'desc'
        }
      };

      expect(mockState).toHaveProperty('activeProfile');
      expect(mockState).toHaveProperty('isLoadingActive');
      expect(mockState).toHaveProperty('activeProfileError');
      expect(mockState).toHaveProperty('profiles');
      expect(mockState).toHaveProperty('isLoadingProfiles');
      expect(mockState).toHaveProperty('profilesError');
      expect(mockState).toHaveProperty('totalProfiles');
      expect(mockState).toHaveProperty('currentPage');
      expect(mockState).toHaveProperty('filters');
      expect(mockState).toHaveProperty('pagination');
    });
  });

  describe('ProfileViewConfig', () => {
    it('should accept valid view modes', () => {
      const mockConfig: ProfileViewConfig = {
        mode: 'grid',
        showStats: true,
        showDescription: true,
        defaultView: 'grid',
        gridColumns: 3,
        cardSize: 'medium'
      };

      // @ts-expect-error Testing invalid mode
      mockConfig.mode = 'invalid';
      expect(mockConfig.mode).toBe('invalid'); // TypeScript should catch this at compile time

      mockConfig.mode = 'list';
      expect(mockConfig.mode).toBe('list');
    });

    it('should accept valid grid columns', () => {
      const mockConfig: ProfileViewConfig = {
        mode: 'grid',
        showStats: true,
        showDescription: true,
        defaultView: 'grid',
        gridColumns: 3,
        cardSize: 'medium'
      };

      // @ts-expect-error Testing invalid columns
      mockConfig.gridColumns = 5;
      expect(mockConfig.gridColumns).toBe(5); // TypeScript should catch this at compile time

      mockConfig.gridColumns = 2;
      expect(mockConfig.gridColumns).toBe(2);
    });
  });

  describe('ProfileUIState', () => {
    it('should handle UI state correctly', () => {
      const mockUIState: ProfileUIState = {
        viewConfig: {
          mode: 'grid',
          showStats: true,
          showDescription: true,
          defaultView: 'grid',
          gridColumns: 3,
          cardSize: 'medium'
        },
        selectedProfileId: null,
        hoveredProfileId: null,
        expandedProfileIds: []
      };

      expect(mockUIState.selectedProfileId).toBeNull();
      expect(mockUIState.hoveredProfileId).toBeNull();
      expect(mockUIState.expandedProfileIds).toHaveLength(0);

      mockUIState.selectedProfileId = '123';
      mockUIState.hoveredProfileId = '456';
      mockUIState.expandedProfileIds = ['789'];

      expect(mockUIState.selectedProfileId).toBe('123');
      expect(mockUIState.hoveredProfileId).toBe('456');
      expect(mockUIState.expandedProfileIds).toContain('789');
    });
  });

  describe('ProfileFiltersState', () => {
    it('should handle filter state correctly', () => {
      const mockFiltersState: ProfileFiltersState = {
        activeFilters: [],
        searchTerm: '',
        defaultSortOption: 'createdAt_desc',
        currentSortOption: 'createdAt_desc',
        groupBy: 'none'
      };

      expect(mockFiltersState.activeFilters).toHaveLength(0);
      expect(mockFiltersState.searchTerm).toBe('');
      expect(mockFiltersState.defaultSortOption).toBe('createdAt_desc');
      expect(mockFiltersState.currentSortOption).toBe('createdAt_desc');
      expect(mockFiltersState.groupBy).toBe('none');

      mockFiltersState.activeFilters = ['active', 'hasAvatar'];
      mockFiltersState.searchTerm = 'test';
      mockFiltersState.groupBy = 'theme';

      expect(mockFiltersState.activeFilters).toContain('active');
      expect(mockFiltersState.activeFilters).toContain('hasAvatar');
      expect(mockFiltersState.searchTerm).toBe('test');
      expect(mockFiltersState.groupBy).toBe('theme');
    });
  });

  describe('ProfileStoreState', () => {
    it('should combine all state types correctly', () => {
      const mockStore: ProfileStoreState = {
        // ProfileState
        activeProfile: null,
        isLoadingActive: false,
        activeProfileError: null,
        profiles: [],
        isLoadingProfiles: false,
        profilesError: null,
        totalProfiles: 0,
        currentPage: 1,
        filters: {
          status: 'all',
          theme: 'all',
          language: 'all',
          search: ''
        },
        pagination: {
          page: 1,
          limit: 10,
          orderBy: 'createdAt',
          order: 'desc'
        },

        // ProfileUIState
        viewConfig: {
          mode: 'grid',
          showStats: true,
          showDescription: true,
          defaultView: 'grid',
          gridColumns: 3,
          cardSize: 'medium'
        },
        selectedProfileId: null,
        hoveredProfileId: null,
        expandedProfileIds: [],

        // ProfileFiltersState
        activeFilters: [],
        searchTerm: '',
        defaultSortOption: 'createdAt_desc',
        currentSortOption: 'createdAt_desc',
        groupBy: 'none'
      };

      // Verificar que todas las propiedades estén presentes
      expect(mockStore).toMatchObject({
        // ProfileState
        activeProfile: null,
        isLoadingActive: false,
        activeProfileError: null,
        profiles: [],
        isLoadingProfiles: false,
        profilesError: null,
        totalProfiles: 0,
        currentPage: 1,
        filters: expect.any(Object),
        pagination: expect.any(Object),

        // ProfileUIState
        viewConfig: expect.any(Object),
        selectedProfileId: null,
        hoveredProfileId: null,
        expandedProfileIds: expect.any(Array),

        // ProfileFiltersState
        activeFilters: expect.any(Array),
        searchTerm: '',
        defaultSortOption: expect.any(String),
        currentSortOption: expect.any(String),
        groupBy: 'none'
      });
    });
  });
});