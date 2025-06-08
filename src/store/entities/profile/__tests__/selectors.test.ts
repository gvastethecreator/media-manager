import {
  selectActiveProfile,
  selectProfileById,
  selectIsProfileSelected,
  selectFilteredProfiles,
} from '../selectors';
import type { ProfileStoreState } from '../types';

const mockProfiles = [
  { id: '1', name: 'Alice', isActive: true, avatarUrl: '' },
  { id: '2', name: 'Bob', isActive: false, avatarUrl: 'bob.jpg' },
] as any;

const state: ProfileStoreState = {
  activeProfile: mockProfiles[0],
  isLoadingActive: false,
  activeProfileError: null,
  profiles: mockProfiles,
  isLoadingProfiles: false,
  profilesError: null,
  totalProfiles: 2,
  currentPage: 1,
  filters: { status: 'all', theme: 'all', language: 'all', search: '' },
  pagination: { page: 1, limit: 10, orderBy: 'createdAt', order: 'desc' },
  viewConfig: {
    mode: 'grid',
    showStats: true,
    showDescription: true,
    defaultView: 'grid',
    gridColumns: 3,
    cardSize: 'medium',
  },
  selectedProfileId: '1',
  hoveredProfileId: null,
  expandedProfileIds: [],
  activeFilters: [],
  searchTerm: '',
  defaultSortOption: 'createdAt_desc',
  currentSortOption: 'createdAt_desc',
  groupBy: 'none',
};

describe('Profile Selectors', () => {
  test('selectActiveProfile returns active profile', () => {
    expect(selectActiveProfile(state)).toBe(mockProfiles[0]);
  });

  test('selectProfileById finds profile by id', () => {
    const selector = selectProfileById('2');
    expect(selector(state)).toBe(mockProfiles[1]);
  });

  test('selectIsProfileSelected checks selected id', () => {
    const selector = selectIsProfileSelected('1');
    expect(selector(state)).toBe(true);
  });

  test('selectFilteredProfiles filters by active filter', () => {
    const filteredState = { ...state, activeFilters: ['inactive'] } as ProfileStoreState;
    const result = selectFilteredProfiles(filteredState);
    expect(result).toEqual([mockProfiles[1]]);
  });
});
