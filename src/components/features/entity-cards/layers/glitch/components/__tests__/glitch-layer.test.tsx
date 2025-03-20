import { render, screen, fireEvent } from '@testing-library/react';
import { GlitchLayer } from '../glitch-layer';
import { useGlitchStore } from '../../actions/glitch-config.action';
import { act } from 'react-dom/test-utils';

// Mock del store
jest.mock('../../actions/glitch-config.action', () => ({
  useGlitchStore: jest.fn(),
}));

// Mock de requestAnimationFrame
global.requestAnimationFrame = jest.fn();
global.cancelAnimationFrame = jest.fn();

describe('GlitchLayer', () => {
  const mockConfig = {
    enabled: true,
    intensity: 0.5,
    frequency: 0.3,
    animated: false,
    speed: 1,
    colorShift: true,
    colorShiftAmount: 0.2,
    scanlines: true,
    scanlinesCount: 50,
    scanlinesOpacity: 0.5,
    noise: true,
    noiseIntensity: 0.3,
    distortion: true,
    distortionAmount: 0.4,
    chromatic: true,
    chromaticOffset: 0.2,
    blend: 'normal',
    layerIndex: 1,
  };

  beforeEach(() => {
    (useGlitchStore as jest.Mock).mockReturnValue({
      config: mockConfig,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza correctamente cuando está habilitado', () => {
    render(<GlitchLayer width={100} height={100} />);
    const canvas = screen.getByRole('presentation');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveAttribute('width', '100');
    expect(canvas).toHaveAttribute('height', '100');
  });

  it('no renderiza cuando está deshabilitado', () => {
    (useGlitchStore as jest.Mock).mockReturnValue({
      config: { ...mockConfig, enabled: false },
    });
    render(<GlitchLayer width={100} height={100} />);
    const canvas = screen.queryByRole('presentation');
    expect(canvas).not.toBeInTheDocument();
  });

  it('aplica las clases correctas basadas en el modo de mezcla', () => {
    const blendModes = ['normal', 'multiply', 'screen', 'overlay', 'color-dodge'];
    blendModes.forEach(blend => {
      (useGlitchStore as jest.Mock).mockReturnValue({
        config: { ...mockConfig, blend },
      });
      const { container } = render(<GlitchLayer width={100} height={100} />);
      expect(container.firstChild).toHaveClass(`mix-blend-${blend}`);
    });
  });

  it('aplica las clases correctas cuando está explotado', () => {
    render(<GlitchLayer width={100} height={100} isExploded={true} />);
    const canvas = screen.getByRole('presentation');
    expect(canvas).toHaveClass('exploded-layer', 'layer-glitch');
  });

  it('aplica las clases correctas cuando está activo', () => {
    render(<GlitchLayer width={100} height={100} activeLayer="glitch" />);
    const canvas = screen.getByRole('presentation');
    expect(canvas).toHaveClass('active-layer');
  });

  it('inicia la animación cuando está configurado', () => {
    (useGlitchStore as jest.Mock).mockReturnValue({
      config: { ...mockConfig, animated: true },
    });
    render(<GlitchLayer width={100} height={100} />);
    expect(requestAnimationFrame).toHaveBeenCalled();
  });

  it('limpia los recursos al desmontar', () => {
    const { unmount } = render(<GlitchLayer width={100} height={100} />);
    unmount();
    expect(cancelAnimationFrame).toHaveBeenCalled();
  });

  it('actualiza la opacidad basada en el hover', () => {
    const { container } = render(<GlitchLayer width={100} height={100} isHovered={true} />);
    const canvas = container.firstChild as HTMLElement;
    expect(canvas).toHaveStyle({ opacity: 1 });
  });

  it('aplica el z-index correcto cuando está explotado', () => {
    render(<GlitchLayer width={100} height={100} isExploded={true} />);
    const canvas = screen.getByRole('presentation');
    expect(canvas).toHaveStyle({ zIndex: mockConfig.layerIndex });
  });
});