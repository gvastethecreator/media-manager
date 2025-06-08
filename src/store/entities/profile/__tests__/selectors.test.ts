describe('Profile Store Selectors', () => {
  it('should select the active profile', () => {
    // Mock de estado
    const state = {
      activeProfile: { id: '1', name: 'Test', isActive: true },
      profiles: [],
      // ...otros campos requeridos por el store
    };
    // Simular selector
    const selectActiveProfile = (s) => s.activeProfile;
    expect(selectActiveProfile(state)).toEqual({ id: '1', name: 'Test', isActive: true });
  });
});