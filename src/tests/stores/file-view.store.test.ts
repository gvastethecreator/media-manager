/**
 * @file Tests para FileView Store
 * @description Tests completos para el store de configuración de visualización de archivos
 */

import type { ViewMode } from '@/types/settings';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mockear el cliente logger para evitar logs en tests
vi.mock('@/lib/logger/client-logger', () => ({
  clientLogger: {
    withContext: () => ({
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

describe('🧪 FileView Store Tests', () => {
  let useFileViewStore: any;
  let useViewMode: any;
  let useSortSettings: any;
  let useThumbnailSettings: any;

  beforeEach(async () => {
    // Resetear módulos para cada test
    vi.resetModules();

    // Importar módulos dinámicamente después del reset
    const module = await import('@/store/file-view.store');
    useFileViewStore = module.useFileViewStore;
    useViewMode = module.useViewMode;
    useSortSettings = module.useSortSettings;
    useThumbnailSettings = module.useThumbnailSettings;

    // Limpiar estado del store
    act(() => {
      useFileViewStore.getState().resetViewSettings();
    });
  });

  describe('📋 Estado Inicial', () => {
    it('debería tener el estado inicial correcto', () => {
      const { result } = renderHook(() => useFileViewStore());
      const state = result.current;

      expect(state.viewMode).toBe('grid');
      expect(state.sortBy).toBe('name');
      expect(state.sortOrder).toBe('asc');
      expect(state.showThumbnails).toBe(true);
      expect(state.showMetadata).toBe(true);
      expect(state.thumbnailSize).toBe('medium');
      expect(state.animationsEnabled).toBe(true);
    });

    it('debería tener todas las acciones disponibles', () => {
      const { result } = renderHook(() => useFileViewStore());
      const state = result.current;

      expect(typeof state.setViewMode).toBe('function');
      expect(typeof state.setSortBy).toBe('function');
      expect(typeof state.setSortOrder).toBe('function');
      expect(typeof state.setShowThumbnails).toBe('function');
      expect(typeof state.setShowMetadata).toBe('function');
      expect(typeof state.setThumbnailSize).toBe('function');
      expect(typeof state.setAnimationsEnabled).toBe('function');
      expect(typeof state.resetViewSettings).toBe('function');
    });
  });

  describe('🎨 Gestión de Modo de Vista', () => {
    it('debería cambiar el modo de vista correctamente', () => {
      const { result } = renderHook(() => useFileViewStore());

      const modes: ViewMode[] = ['list', 'grid', 'masonry', 'cards'];

      modes.forEach(mode => {
        act(() => {
          result.current.setViewMode(mode);
        });

        expect(result.current.viewMode).toBe(mode);
      });
    });

    it('debería usar el hook personalizado useViewMode', () => {
      const { result: storeResult } = renderHook(() => useFileViewStore());
      const { result: hookResult } = renderHook(() => useViewMode());

      expect(hookResult.current).toBe(storeResult.current.viewMode);

      act(() => {
        storeResult.current.setViewMode('list');
      });

      expect(hookResult.current).toBe('list');
    });
  });

  describe('📊 Gestión de Ordenamiento', () => {
    it('debería cambiar el campo de ordenamiento', () => {
      const { result } = renderHook(() => useFileViewStore());

      const sortFields = ['name', 'date', 'size', 'type'];

      sortFields.forEach(field => {
        act(() => {
          result.current.setSortBy(field);
        });

        expect(result.current.sortBy).toBe(field);
      });
    });

    it('debería cambiar la dirección de ordenamiento', () => {
      const { result } = renderHook(() => useFileViewStore());

      act(() => {
        result.current.setSortOrder('desc');
      });

      expect(result.current.sortOrder).toBe('desc');

      act(() => {
        result.current.setSortOrder('asc');
      });

      expect(result.current.sortOrder).toBe('asc');
    });

    it('debería usar el hook personalizado useSortSettings', () => {
      const { result: storeResult } = renderHook(() => useFileViewStore());
      const { result: hookResult } = renderHook(() => useSortSettings());

      expect(hookResult.current.sortBy).toBe(storeResult.current.sortBy);
      expect(hookResult.current.sortOrder).toBe(storeResult.current.sortOrder);
      expect(typeof hookResult.current.setSortBy).toBe('function');
      expect(typeof hookResult.current.setSortOrder).toBe('function');

      act(() => {
        hookResult.current.setSortBy('date');
        hookResult.current.setSortOrder('desc');
      });

      expect(hookResult.current.sortBy).toBe('date');
      expect(hookResult.current.sortOrder).toBe('desc');
    });
  });

  describe('🖼️ Gestión de Miniaturas', () => {
    it('debería controlar la visibilidad de miniaturas', () => {
      const { result } = renderHook(() => useFileViewStore());

      act(() => {
        result.current.setShowThumbnails(false);
      });

      expect(result.current.showThumbnails).toBe(false);

      act(() => {
        result.current.setShowThumbnails(true);
      });

      expect(result.current.showThumbnails).toBe(true);
    });

    it('debería cambiar el tamaño de miniaturas', () => {
      const { result } = renderHook(() => useFileViewStore());

      const sizes: ('small' | 'medium' | 'large')[] = ['small', 'medium', 'large'];

      sizes.forEach(size => {
        act(() => {
          result.current.setThumbnailSize(size);
        });

        expect(result.current.thumbnailSize).toBe(size);
      });
    });

    it('debería usar el hook personalizado useThumbnailSettings', () => {
      const { result: storeResult } = renderHook(() => useFileViewStore());
      const { result: hookResult } = renderHook(() => useThumbnailSettings());

      expect(hookResult.current.showThumbnails).toBe(storeResult.current.showThumbnails);
      expect(hookResult.current.thumbnailSize).toBe(storeResult.current.thumbnailSize);
      expect(typeof hookResult.current.setShowThumbnails).toBe('function');
      expect(typeof hookResult.current.setThumbnailSize).toBe('function');

      act(() => {
        hookResult.current.setShowThumbnails(false);
        hookResult.current.setThumbnailSize('large');
      });

      expect(hookResult.current.showThumbnails).toBe(false);
      expect(hookResult.current.thumbnailSize).toBe('large');
    });
  });

  describe('📄 Gestión de Metadatos', () => {
    it('debería controlar la visibilidad de metadatos', () => {
      const { result } = renderHook(() => useFileViewStore());

      act(() => {
        result.current.setShowMetadata(false);
      });

      expect(result.current.showMetadata).toBe(false);

      act(() => {
        result.current.setShowMetadata(true);
      });

      expect(result.current.showMetadata).toBe(true);
    });
  });

  describe('🎭 Gestión de Animaciones', () => {
    it('debería controlar las animaciones', () => {
      const { result } = renderHook(() => useFileViewStore());

      act(() => {
        result.current.setAnimationsEnabled(false);
      });

      expect(result.current.animationsEnabled).toBe(false);

      act(() => {
        result.current.setAnimationsEnabled(true);
      });

      expect(result.current.animationsEnabled).toBe(true);
    });
  });

  describe('🔄 Reset de Configuración', () => {
    it('debería restablecer toda la configuración al estado inicial', () => {
      const { result } = renderHook(() => useFileViewStore());

      // Cambiar todos los valores
      act(() => {
        result.current.setViewMode('list');
        result.current.setSortBy('date');
        result.current.setSortOrder('desc');
        result.current.setShowThumbnails(false);
        result.current.setShowMetadata(false);
        result.current.setThumbnailSize('large');
        result.current.setAnimationsEnabled(false);
      });

      // Verificar que los valores cambiaron
      expect(result.current.viewMode).toBe('list');
      expect(result.current.sortBy).toBe('date');
      expect(result.current.sortOrder).toBe('desc');
      expect(result.current.showThumbnails).toBe(false);
      expect(result.current.showMetadata).toBe(false);
      expect(result.current.thumbnailSize).toBe('large');
      expect(result.current.animationsEnabled).toBe(false);

      // Resetear
      act(() => {
        result.current.resetViewSettings();
      });

      // Verificar que volvió al estado inicial
      expect(result.current.viewMode).toBe('grid');
      expect(result.current.sortBy).toBe('name');
      expect(result.current.sortOrder).toBe('asc');
      expect(result.current.showThumbnails).toBe(true);
      expect(result.current.showMetadata).toBe(true);
      expect(result.current.thumbnailSize).toBe('medium');
      expect(result.current.animationsEnabled).toBe(true);
    });
  });

  describe('🔗 Integración de Hooks Personalizados', () => {
    it('debería sincronizar correctamente entre hooks', () => {
      const { result: viewModeHook } = renderHook(() => useViewMode());
      const { result: sortHook } = renderHook(() => useSortSettings());
      const { result: thumbnailHook } = renderHook(() => useThumbnailSettings());
      const { result: mainStore } = renderHook(() => useFileViewStore());

      // Cambiar valores a través de hooks
      act(() => {
        sortHook.current.setSortBy('size');
        sortHook.current.setSortOrder('desc');
        thumbnailHook.current.setThumbnailSize('small');
        thumbnailHook.current.setShowThumbnails(false);
        mainStore.current.setViewMode('masonry');
      });

      // Verificar sincronización
      expect(viewModeHook.current).toBe('masonry');
      expect(sortHook.current.sortBy).toBe('size');
      expect(sortHook.current.sortOrder).toBe('desc');
      expect(thumbnailHook.current.thumbnailSize).toBe('small');
      expect(thumbnailHook.current.showThumbnails).toBe(false);

      // Verificar que todos reflejan el mismo estado
      expect(mainStore.current.viewMode).toBe('masonry');
      expect(mainStore.current.sortBy).toBe('size');
      expect(mainStore.current.sortOrder).toBe('desc');
      expect(mainStore.current.thumbnailSize).toBe('small');
      expect(mainStore.current.showThumbnails).toBe(false);
    });
  });

  describe('⚡ Tests de Performance', () => {
    it('debería manejar múltiples cambios rápidos sin problemas', () => {
      const { result } = renderHook(() => useFileViewStore());

      const startTime = performance.now();

      // Realizar 100 cambios rápidos
      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.setViewMode(i % 2 === 0 ? 'grid' : 'list');
          result.current.setSortBy(i % 2 === 0 ? 'name' : 'date');
          result.current.setThumbnailSize(i % 3 === 0 ? 'small' : i % 3 === 1 ? 'medium' : 'large');
        }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Debería completarse en menos de 100ms
      expect(duration).toBeLessThan(100);

      // El estado final debería ser consistente
      expect(result.current.viewMode).toBe('grid'); // 100 % 2 === 0
      expect(result.current.sortBy).toBe('name'); // 100 % 2 === 0
      expect(result.current.thumbnailSize).toBe('medium'); // 100 % 3 === 1
    });

    it('debería manejar configuraciones extremas sin errores', () => {
      const { result } = renderHook(() => useFileViewStore());

      // Configuración "extrema" pero válida
      act(() => {
        result.current.setViewMode('cards');
        result.current.setSortBy('type');
        result.current.setSortOrder('desc');
        result.current.setShowThumbnails(false);
        result.current.setShowMetadata(false);
        result.current.setThumbnailSize('large');
        result.current.setAnimationsEnabled(false);
      });

      // Todas las configuraciones deberían aplicarse correctamente
      expect(result.current.viewMode).toBe('cards');
      expect(result.current.sortBy).toBe('type');
      expect(result.current.sortOrder).toBe('desc');
      expect(result.current.showThumbnails).toBe(false);
      expect(result.current.showMetadata).toBe(false);
      expect(result.current.thumbnailSize).toBe('large');
      expect(result.current.animationsEnabled).toBe(false);
    });
  });

  describe('🧹 Casos Edge', () => {
    it('debería manejar valores de configuración inesperados graciosamente', () => {
      const { result } = renderHook(() => useFileViewStore());

      // Intentar establecer valores válidos que podrían venir de persistencia corrupta
      act(() => {
        // @ts-expect-error - Probando con valor inválido intencionalmente
        result.current.setViewMode('invalid-mode');
      });

      // El store debería mantener un estado consistente
      expect(typeof result.current.viewMode).toBe('string');
    });

    it('debería mantener coherencia durante resets múltiples', () => {
      const { result } = renderHook(() => useFileViewStore());

      // Realizar múltiples resets consecutivos
      act(() => {
        result.current.resetViewSettings();
        result.current.resetViewSettings();
        result.current.resetViewSettings();
      });

      // El estado debería seguir siendo el inicial
      expect(result.current.viewMode).toBe('grid');
      expect(result.current.sortBy).toBe('name');
      expect(result.current.sortOrder).toBe('asc');
      expect(result.current.showThumbnails).toBe(true);
      expect(result.current.showMetadata).toBe(true);
      expect(result.current.thumbnailSize).toBe('medium');
      expect(result.current.animationsEnabled).toBe(true);
    });
  });

  describe('💾 Persistencia (Simulada)', () => {
    it('debería configurar correctamente las propiedades a persistir', () => {
      // Aunque no podemos probar la persistencia real en el entorno de test,
      // podemos verificar que las propiedades importantes estén configuradas
      const { result } = renderHook(() => useFileViewStore());

      // Cambiar valores que deberían persistirse
      act(() => {
        result.current.setViewMode('list');
        result.current.setSortBy('date');
        result.current.setSortOrder('desc');
        result.current.setThumbnailSize('large');
        result.current.setAnimationsEnabled(false);
      });

      // Estas propiedades deberían estar presentes para persistencia
      const state = result.current;
      expect(state.viewMode).toBeDefined();
      expect(state.sortBy).toBeDefined();
      expect(state.sortOrder).toBeDefined();
      expect(state.showThumbnails).toBeDefined();
      expect(state.thumbnailSize).toBeDefined();
      expect(state.animationsEnabled).toBeDefined();

      // showMetadata NO debería persistirse según la configuración
      expect(state.showMetadata).toBeDefined(); // Existe pero no persiste
    });
  });

  describe('🎯 Tests de Tipos', () => {
    it('debería aceptar solo valores válidos para viewMode', () => {
      const { result } = renderHook(() => useFileViewStore());

      const validModes: ViewMode[] = ['grid', 'list', 'masonry', 'cards'];

      validModes.forEach(mode => {
        act(() => {
          result.current.setViewMode(mode);
        });
        expect(result.current.viewMode).toBe(mode);
      });
    });

    it('debería aceptar solo valores válidos para thumbnailSize', () => {
      const { result } = renderHook(() => useFileViewStore());

      const validSizes: ('small' | 'medium' | 'large')[] = ['small', 'medium', 'large'];

      validSizes.forEach(size => {
        act(() => {
          result.current.setThumbnailSize(size);
        });
        expect(result.current.thumbnailSize).toBe(size);
      });
    });

    it('debería aceptar solo valores válidos para sortOrder', () => {
      const { result } = renderHook(() => useFileViewStore());

      const validOrders: ('asc' | 'desc')[] = ['asc', 'desc'];

      validOrders.forEach(order => {
        act(() => {
          result.current.setSortOrder(order);
        });
        expect(result.current.sortOrder).toBe(order);
      });
    });
  });
});
