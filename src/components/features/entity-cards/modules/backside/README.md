# Módulo Backside

## Descripción

El módulo Backside permite configurar y gestionar el reverso de las cartas en el sistema Entity Cards. Este módulo ofrece una amplia gama de opciones para personalizar la apariencia, el contenido, la interacción y el estilo del reverso de las cartas.

## Componentes Principales

### BacksidePanel

Panel de configuración que permite a los usuarios personalizar todos los aspectos del reverso de las cartas:

- **Configuración de Diseño**: Tipo de layout, modo de color, opacidad, efectos de desenfoque
- **Configuración de Contenido**: Control sobre qué información se muestra (atributos, descripción, estadísticas, metadatos, relaciones)
- **Configuración de Interacción**: Animación de volteo, duración, activadores, volteo automático
- **Configuración de Estilo UI**: Estilos de títulos, información y separadores

### BacksideLayer

Componente que renderiza el reverso de la carta basado en las configuraciones definidas.

## Hooks

### useBacksideSystem

Hook personalizado que encapsula toda la lógica del sistema de backside:

```tsx
const { backsideOptions, handleBacksideChange, disabled } = useBacksideSystem({
  options, // Opciones actuales de la carta
  onChange, // Función para actualizar las opciones
  disabled, // Estado deshabilitado
});
```

## Tipos

El módulo define los siguientes tipos principales:

### BacksideOptions

```typescript
interface BacksideOptions {
  enabled: boolean;
  layoutType?: string;
  colorMode?: string;
  customColor?: string;
  opacity?: number;
  blurBackground?: boolean;
  blurAmount?: number;
  showAttributes?: boolean;
  showDescription?: boolean;
  showStats?: boolean;
  showMetadata?: boolean;
  showRelations?: boolean;
  maxDescriptionLength?: number;
  flipAnimation?: string;
  flipDuration?: number;
  enableAutoFlip?: boolean;
  autoFlipDelay?: number;
  flipTrigger?: string;
  headingStyle?: string;
  infoStyle?: string;
  separatorStyle?: string;
}
```

### BacksideSystemProps

```typescript
interface BacksideSystemProps {
  options: {
    backside?: BacksideOptions;
  };
  onChange: (options: { backside?: BacksideOptions }) => void;
  disabled?: boolean;
}
```

## Integración

Para integrar el sistema de backside en otro componente:

```tsx
import { BacksidePanel } from '@/components/features/entity-cards/modules/backside';

function MyComponent() {
  const [options, setOptions] = useState({
    backside: {
      enabled: true,
      layoutType: 'standard',
      // ...otras opciones
    }
  });

  const handleChange = (newOptions) => {
    setOptions(newOptions);
  };

  return (
    <BacksidePanel
      options={options}
      onChange={handleChange}
      disabled={false}
    />
  );
}
```

## Cómo funciona

1. El sistema de backside se inicializa con las opciones proporcionadas o valores predeterminados
2. Cuando el usuario modifica cualquier configuración, el cambio se propaga a través del hook `useBacksideSystem`
3. Las nuevas opciones se aplican al componente `BacksideLayer` para renderizar visualmente los cambios
4. El sistema mantiene el estado sincronizado con el componente padre a través de la función `onChange`

## Adaptadores

El módulo incluye adaptadores para mantener compatibilidad con el sistema antiguo de configuración.