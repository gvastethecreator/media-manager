import { getActiveProfile, getProfiles } from '@/app/actions/profiles';
import type { ProfileExtended } from '@/types/entities/profile';
import { createProfileActions } from '../actions';
import type { ProfileStoreState } from '../types';

// Mock de los módulos
jest.mock('@/app/actions/profiles', () => ({
	getActiveProfile: jest.fn(),
	getProfiles: jest.fn(),
}));

describe('Profile Store Actions', () => {
	const mockProfile: ProfileExtended = {
		id: '1',
		name: 'Test Profile',
		isActive: true,
		avatarUrl: 'https://example.com/avatar.jpg',
	};

	let mockState: ProfileStoreState;
	let mockSet: jest.Mock;
	let mockGet: jest.Mock;
	let actions: ReturnType<typeof createProfileActions>;

	beforeEach(() => {
		mockState = {
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
				search: '',
			},
			pagination: {
				page: 1,
				limit: 10,
				orderBy: 'createdAt',
				order: 'desc',
			},

			// ProfileUIState
			viewConfig: {
				mode: 'grid',
				showStats: true,
				showDescription: true,
				defaultView: 'grid',
				gridColumns: 3,
				cardSize: 'medium',
			},
			selectedProfileId: null,
			hoveredProfileId: null,
			expandedProfileIds: [],

			// ProfileFiltersState
			activeFilters: [],
			searchTerm: '',
			defaultSortOption: 'createdAt_desc',
			currentSortOption: 'createdAt_desc',
			groupBy: 'none',
		};

		mockSet = jest.fn();
		mockGet = jest.fn(() => mockState);
		actions = createProfileActions(mockSet, mockGet);

		// Limpiar los mocks
		jest.clearAllMocks();
	});

	describe('Active Profile Actions', () => {
		it('should fetch active profile successfully', async () => {
			(getActiveProfile as jest.Mock).mockResolvedValue(mockProfile);

			await actions.fetchActiveProfile();

			expect(mockSet).toHaveBeenCalledWith({ isLoadingActive: true, activeProfileError: null });
			expect(getActiveProfile).toHaveBeenCalled();
			expect(mockSet).toHaveBeenCalledWith({ activeProfile: mockProfile, isLoadingActive: false });
		});

		it('should handle fetch active profile error', async () => {
			const error = new Error('Failed to fetch');
			(getActiveProfile as jest.Mock).mockRejectedValue(error);

			await actions.fetchActiveProfile();

			expect(mockSet).toHaveBeenCalledWith({ isLoadingActive: true, activeProfileError: null });
			expect(mockSet).toHaveBeenCalledWith({
				activeProfileError: 'Failed to fetch',
				isLoadingActive: false,
			});
		});

		it('should set active profile', () => {
			actions.setActiveProfile(mockProfile);
			expect(mockSet).toHaveBeenCalledWith({ activeProfile: mockProfile });
		});
	});

	describe('Profiles List Actions', () => {
		it('should fetch profiles successfully', async () => {
			const response = { profiles: [mockProfile], total: 1 };
			(getProfiles as jest.Mock).mockResolvedValue(response);

			await actions.fetchProfiles();

			expect(mockSet).toHaveBeenCalledWith({ isLoadingProfiles: true, profilesError: null });
			expect(getProfiles).toHaveBeenCalledWith({
				filters: mockState.filters,
				pagination: mockState.pagination,
			});
			expect(mockSet).toHaveBeenCalledWith({
				profiles: [mockProfile],
				totalProfiles: 1,
				isLoadingProfiles: false,
			});
		});

		it('should handle fetch profiles error', async () => {
			const error = new Error('Failed to fetch profiles');
			(getProfiles as jest.Mock).mockRejectedValue(error);

			await actions.fetchProfiles();

			expect(mockSet).toHaveBeenCalledWith({ isLoadingProfiles: true, profilesError: null });
			expect(mockSet).toHaveBeenCalledWith({
				profilesError: 'Failed to fetch profiles',
				isLoadingProfiles: false,
			});
		});
	});

	describe('View Configuration Actions', () => {
		it('should update view mode', () => {
			actions.setViewMode('list');
			expect(mockSet).toHaveBeenCalledWith(expect.any(Function));

			const setStateFunction = mockSet.mock.calls[0][0];
			const newState = setStateFunction(mockState);
			expect(newState.viewConfig.mode).toBe('list');
		});

		it('should update grid columns', () => {
			actions.setGridColumns(4);
			expect(mockSet).toHaveBeenCalledWith(expect.any(Function));

			const setStateFunction = mockSet.mock.calls[0][0];
			const newState = setStateFunction(mockState);
			expect(newState.viewConfig.gridColumns).toBe(4);
		});
	});

	describe('UI State Actions', () => {
		it('should update selected profile', () => {
			actions.setSelectedProfileId('123');
			expect(mockSet).toHaveBeenCalledWith({ selectedProfileId: '123' });
		});

		it('should toggle expanded profile', () => {
			// Añadir un perfil expandido
			actions.toggleExpandedProfileId('123');
			const firstUpdate = mockSet.mock.calls[0][0];
			const stateAfterFirstToggle = firstUpdate(mockState);
			expect(stateAfterFirstToggle.expandedProfileIds).toContain('123');

			// Quitar el perfil expandido
			mockState.expandedProfileIds = ['123'];
			actions.toggleExpandedProfileId('123');
			const secondUpdate = mockSet.mock.calls[1][0];
			const stateAfterSecondToggle = secondUpdate(mockState);
			expect(stateAfterSecondToggle.expandedProfileIds).not.toContain('123');
		});
	});

	describe('Filter Actions', () => {
		it('should update search term', () => {
			actions.setSearchTerm('test');
			expect(mockSet).toHaveBeenCalledWith({ searchTerm: 'test' });
		});

		it('should update active filters', () => {
			actions.setActiveFilters(['active', 'hasAvatar']);
			expect(mockSet).toHaveBeenCalledWith({ activeFilters: ['active', 'hasAvatar'] });
		});

		it('should reset filters', () => {
			actions.resetFilters();
			expect(mockSet).toHaveBeenCalledWith(expect.any(Function));

			const setStateFunction = mockSet.mock.calls[0][0];
			const newState = setStateFunction(mockState);
			expect(newState).toEqual({
				activeFilters: [],
				searchTerm: '',
				currentSortOption: mockState.defaultSortOption,
				groupBy: 'none',
			});
		});
	});

	describe('Reset Actions', () => {
		it('should reset UI state', () => {
			actions.resetUI();
			expect(mockSet).toHaveBeenCalledWith({
				selectedProfileId: null,
				hoveredProfileId: null,
				expandedProfileIds: [],
			});
		});
	});
});
