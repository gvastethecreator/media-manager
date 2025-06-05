// 🧪 Test básico para componentes React
// Verifica que el rendering de componentes funciona

import React from 'react';
import { render, screen } from '@testing-library/react';

// 🎨 Componente simple para testing
const TestComponent = ({ title, children }: { title: string; children?: React.ReactNode }) => (
  <div data-testid="test-component">
    <h1>{title}</h1>
    {children && <div data-testid="content">{children}</div>}
  </div>
);

describe('⚛️ React Component Testing', () => {
  test('✅ should render basic component', () => {
    // 🎯 Renderizar componente simple
    render(<TestComponent title="Test Title" />);

    // 🔍 Verificar que se renderizó correctamente
    expect(screen.getByTestId('test-component')).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  test('🎭 should render component with children', () => {
    // 🎯 Renderizar con children
    render(
      <TestComponent title="Parent Component">
        <span>Child content</span>
      </TestComponent>
    );

    // 🔍 Verificar contenido
    expect(screen.getByTestId('content')).toBeInTheDocument();
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  test('📦 should handle props correctly', () => {
    // 🎯 Props dinámicos
    const props = {
      title: 'Dynamic Title',
      children: <button>Click me</button>
    };

    render(<TestComponent {...props} />);

    // 🔍 Verificar props
    expect(screen.getByText('Dynamic Title')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });
});
