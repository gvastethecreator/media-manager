// 🧪 Test básico de configuración de Jest
// Verifica que el setup de testing funciona correctamente

import { renderWithProviders } from '@/tests/helpers/test-utils';
import { mockFolders, mockImages, mockTags } from '@/tests/fixtures/entities';

describe('🚀 Jest Configuration', () => {
  test('✅ should render test utilities correctly', () => {
    // 🎯 Verificar que las utilidades básicas funcionan
    expect(renderWithProviders).toBeDefined();
    expect(mockFolders).toBeDefined();
    expect(mockImages).toBeDefined();
    expect(mockTags).toBeDefined();
  });

  test('📦 should have correct mock data structure', () => {
    // 🗂️ Verificar estructura de folders
    expect(mockFolders).toHaveLength(3);
    expect(mockFolders[0]).toHaveProperty('id');
    expect(mockFolders[0]).toHaveProperty('name');
    expect(mockFolders[0]).toHaveProperty('path');

    // 🖼️ Verificar estructura de images
    expect(mockImages).toHaveLength(3);
    expect(mockImages[0]).toHaveProperty('filename');
    expect(mockImages[0]).toHaveProperty('mimeType');
    expect(mockImages[0]).toHaveProperty('size');

    // 🏷️ Verificar estructura de tags
    expect(mockTags).toHaveLength(3);
    expect(mockTags[0]).toHaveProperty('name');
    expect(mockTags[0]).toHaveProperty('color');
    expect(mockTags[0]).toHaveProperty('emoji');
  });

  test('🎭 should have working mocks', () => {
    // 🔍 Verificar que jest está funcionando
    const mockFn = jest.fn();
    mockFn('test');
    expect(mockFn).toHaveBeenCalledWith('test');
    
    // 📅 Verificar que las fechas funcionan
    const testDate = new Date('2025-06-05');
    expect(testDate).toBeInstanceOf(Date);
  });

  test('🌐 should handle environment setup', () => {
    // ✓ Verificar que el DOM está disponible
    expect(document).toBeDefined();
    expect(window).toBeDefined();
    
    // ✓ Verificar que fetch está mockeado
    expect(global.fetch).toBeDefined();
    expect(jest.isMockFunction(global.fetch)).toBe(true);
  });
});
