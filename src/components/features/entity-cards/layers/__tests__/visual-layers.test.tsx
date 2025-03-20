import { render, screen, act } from '@testing-library/react';
import { EntityCardProvider } from '../../providers/EntityCardProvider';
import { RegisterLayers } from '../register-layers';
import { EntityCard } from '../../EntityCard';
import { useLayerAnimation } from '../hooks/useLayerAnimation';

// 🎨 Mock de capas visuales para pruebas
const GradientLayer = {
  id: 'gradient-layer',
  name: 'Gradient Layer',
  type: 'visual',
  Component: ({ enabled, config }) => (
    enabled ? (
      <div
        data-testid="gradient-layer"
        style={{
          background: `linear-gradient(${config?.angle || '45deg'}, ${config?.colors?.join(', ') || '#000, #fff'})`
        }}
      />
    ) : null
  )
};

const BlurLayer = {
  id: 'blur-layer',
  name: 'Blur Layer',
  type: 'visual',
  Component: ({ enabled, config }) => (
    enabled ? (
      <div
        data-testid="blur-layer"
        style={{
          backdropFilter: `blur(${config?.intensity || '0'}px)`
        }}
      />
    ) : null
  )
};

const GlowLayer = {
  id: 'glow-layer',
  name: 'Glow Layer',
  type: 'visual',
  Component: ({ enabled, config }) => (
    enabled ? (
      <div
        data-testid="glow-layer"
        style={{
          boxShadow: `0 0 ${config?.spread || '20'}px ${config?.color || '#fff'}`
        }}
      />
    ) : null
  )
};

// 🧪 Componente de prueba que usa el hook useLayerAnimation
function TestAnimationComponent() {
  const { animate } = useLayerAnimation();

  return (
    <EntityCard
      entityId="test"
      entityType="test"
      layers={{
        'gradient-layer': {
          enabled: true,
          config: {
            angle: '45deg',
            colors: ['#ff0000', '#00ff00'],
            animation: animate({
              from: { angle: '0deg' },
              to: { angle: '360deg' },
              duration: 1000
            })
          }
        }
      }}
    />
  );
}

// 📚 Suite de pruebas principal
describe('Visual Layers', () => {
  // 🎨 Pruebas de renderizado básico
  describe('Basic Rendering', () => {
    it('should render gradient layer with correct styles', () => {
      render(
        <EntityCardProvider>
          <RegisterLayers initialLayers={[GradientLayer]} />
          <EntityCard
            entityId="test"
            entityType="test"
            layers={{
              'gradient-layer': {
                enabled: true,
                config: {
                  angle: '90deg',
                  colors: ['#ff0000', '#0000ff']
                }
              }
            }}
          />
        </EntityCardProvider>
      );

      const gradientElement = screen.getByTestId('gradient-layer');
      expect(gradientElement).toHaveStyle({
        background: 'linear-gradient(90deg, #ff0000, #0000ff)'
      });
    });

    it('should render blur layer with correct intensity', () => {
      render(
        <EntityCardProvider>
          <RegisterLayers initialLayers={[BlurLayer]} />
          <EntityCard
            entityId="test"
            entityType="test"
            layers={{
              'blur-layer': {
                enabled: true,
                config: {
                  intensity: 10
                }
              }
            }}
          />
        </EntityCardProvider>
      );

      const blurElement = screen.getByTestId('blur-layer');
      expect(blurElement).toHaveStyle({
        backdropFilter: 'blur(10px)'
      });
    });

    it('should render glow layer with correct parameters', () => {
      render(
        <EntityCardProvider>
          <RegisterLayers initialLayers={[GlowLayer]} />
          <EntityCard
            entityId="test"
            entityType="test"
            layers={{
              'glow-layer': {
                enabled: true,
                config: {
                  spread: 30,
                  color: '#ff0000'
                }
              }
            }}
          />
        </EntityCardProvider>
      );

      const glowElement = screen.getByTestId('glow-layer');
      expect(glowElement).toHaveStyle({
        boxShadow: '0 0 30px #ff0000'
      });
    });
  });

  // 🎭 Pruebas de múltiples capas visuales
  describe('Multiple Visual Layers', () => {
    it('should render multiple layers in correct order', () => {
      render(
        <EntityCardProvider>
          <RegisterLayers
            initialLayers={[GradientLayer, BlurLayer, GlowLayer]}
          />
          <EntityCard
            entityId="test"
            entityType="test"
            layers={{
              'gradient-layer': {
                enabled: true,
                config: {
                  angle: '45deg',
                  colors: ['#ff0000', '#00ff00']
                }
              },
              'blur-layer': {
                enabled: true,
                config: {
                  intensity: 5
                }
              },
              'glow-layer': {
                enabled: true,
                config: {
                  spread: 20,
                  color: '#0000ff'
                }
              }
            }}
          />
        </EntityCardProvider>
      );

      const layers = screen.getAllByTestId(/-layer$/);
      expect(layers).toHaveLength(3);
      expect(layers[0]).toHaveAttribute('data-testid', 'gradient-layer');
      expect(layers[1]).toHaveAttribute('data-testid', 'blur-layer');
      expect(layers[2]).toHaveAttribute('data-testid', 'glow-layer');
    });
  });

  // ✨ Pruebas de animaciones
  describe('Layer Animations', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should animate layer properties', () => {
      render(
        <EntityCardProvider>
          <RegisterLayers initialLayers={[GradientLayer]} />
          <TestAnimationComponent />
        </EntityCardProvider>
      );

      const gradientElement = screen.getByTestId('gradient-layer');

      // Verificar estado inicial
      expect(gradientElement).toHaveStyle({
        background: expect.stringContaining('0deg')
      });

      // Avanzar la animación
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Verificar estado intermedio
      expect(gradientElement).toHaveStyle({
        background: expect.stringContaining('180deg')
      });

      // Completar la animación
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Verificar estado final
      expect(gradientElement).toHaveStyle({
        background: expect.stringContaining('360deg')
      });
    });
  });

  // 🎨 Pruebas de estilos condicionales
  describe('Conditional Styles', () => {
    const ConditionalLayer = {
      id: 'conditional-layer',
      name: 'Conditional Layer',
      type: 'visual',
      Component: ({ enabled, config }) => {
        const style = {
          opacity: config?.isActive ? 1 : 0.5,
          transform: config?.isHovered ? 'scale(1.1)' : 'scale(1)'
        };

        return enabled ? (
          <div
            data-testid="conditional-layer"
            style={style}
          />
        ) : null;
      }
    };

    it('should update styles based on conditions', () => {
      const { rerender } = render(
        <EntityCardProvider>
          <RegisterLayers initialLayers={[ConditionalLayer]} />
          <EntityCard
            entityId="test"
            entityType="test"
            layers={{
              'conditional-layer': {
                enabled: true,
                config: {
                  isActive: false,
                  isHovered: false
                }
              }
            }}
          />
        </EntityCardProvider>
      );

      const layer = screen.getByTestId('conditional-layer');
      expect(layer).toHaveStyle({
        opacity: 0.5,
        transform: 'scale(1)'
      });

      rerender(
        <EntityCardProvider>
          <RegisterLayers initialLayers={[ConditionalLayer]} />
          <EntityCard
            entityId="test"
            entityType="test"
            layers={{
              'conditional-layer': {
                enabled: true,
                config: {
                  isActive: true,
                  isHovered: true
                }
              }
            }}
          />
        </EntityCardProvider>
      );

      expect(layer).toHaveStyle({
        opacity: 1,
        transform: 'scale(1.1)'
      });
    });
  });

  // 🎨 Pruebas de composición de capas
  describe('Layer Composition', () => {
    const CompositeLayer = {
      id: 'composite-layer',
      name: 'Composite Layer',
      type: 'visual',
      Component: ({ enabled, config }) => {
        const filters = [
          config?.blur && `blur(${config.blur}px)`,
          config?.brightness && `brightness(${config.brightness}%)`,
          config?.contrast && `contrast(${config.contrast}%)`
        ].filter(Boolean).join(' ');

        return enabled ? (
          <div
            data-testid="composite-layer"
            style={{ filter: filters }}
          />
        ) : null;
      }
    };

    it('should compose multiple visual effects', () => {
      render(
        <EntityCardProvider>
          <RegisterLayers initialLayers={[CompositeLayer]} />
          <EntityCard
            entityId="test"
            entityType="test"
            layers={{
              'composite-layer': {
                enabled: true,
                config: {
                  blur: 5,
                  brightness: 120,
                  contrast: 150
                }
              }
            }}
          />
        </EntityCardProvider>
      );

      const layer = screen.getByTestId('composite-layer');
      expect(layer).toHaveStyle({
        filter: 'blur(5px) brightness(120%) contrast(150%)'
      });
    });
  });

  // 🔄 Pruebas de ciclo de vida
  describe('Lifecycle', () => {
    it('should clean up visual effects on unmount', () => {
      const { unmount } = render(
        <EntityCardProvider>
          <RegisterLayers initialLayers={[GlowLayer]} />
          <EntityCard
            entityId="test"
            entityType="test"
            layers={{
              'glow-layer': {
                enabled: true,
                config: {
                  spread: 20,
                  color: '#ff0000'
                }
              }
            }}
          />
        </EntityCardProvider>
      );

      expect(screen.getByTestId('glow-layer')).toBeInTheDocument();
      unmount();

      // Re-renderizar para verificar que los efectos se limpiaron
      render(
        <EntityCardProvider>
          <RegisterLayers initialLayers={[GlowLayer]} />
          <EntityCard
            entityId="test"
            entityType="test"
            layers={{
              'glow-layer': {
                enabled: false
              }
            }}
          />
        </EntityCardProvider>
      );

      expect(screen.queryByTestId('glow-layer')).not.toBeInTheDocument();
    });
  });
});