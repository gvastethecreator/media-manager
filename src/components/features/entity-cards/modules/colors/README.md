# Módulo de Colores para Entity Cards

## 📋 Descripción

El módulo de colores proporciona un sistema completo para gestionar y configurar los colores de las Entity Cards. Permite definir paletas de colores predefinidas o personalizadas para mantener una apariencia coherente en todas las tarjetas.

## 🧩 Componentes

- `ColorsModule`: Componente principal que muestra las opciones de configuración de colores.
- `ColorPaletteSelector`: Componente para seleccionar paletas de colores predefinidas.

## 🪝 Hooks

- `useColors`: Hook para gestionar el estado y la lógica de las opciones de colores.

## 🧪 Uso

```tsx
import { ColorsModule } from '@/components/features/entity-cards/modules/colors';

function MyComponent() {
  const handleChange = (options) => {
    console.log('Opciones actualizadas:', options);
  };

  return (
    <ColorsModule
      initialOptions={{
        useColorPalettes: true,
        colorPalette: 'modern-blue'
      }}
      onChange={handleChange}
    />
  );
}
```

## 🔧 Opciones de Configuración

### Modo de Paleta
- `useColorPalettes`: Habilita el uso de paletas de colores predefinidas
- `colorPalette`: ID de la paleta de colores seleccionada

### Colores Personalizados
- `primaryColor`: Color principal (formato RGB: '59, 130, 246')
- `secondaryColor`: Color secundario
- `accentColor`: Color de acento
- `backgroundStartColor`: Color inicial del gradiente de fondo
- `backgroundEndColor`: Color final del gradiente de fondo
- `textColor`: Color del texto
- `borderColor`: Color del borde

## 📊 Paletas Predefinidas

- **Azul Moderno**: Esquema profesional con azul como color principal
- **Elegancia Oscura**: Tema oscuro con acentos rojos
- **Verde Natural**: Paleta inspirada en la naturaleza
- **Púrpura Vibrante**: Colores vibrantes y enérgicos
- **Naranja Atardecer**: Colores cálidos inspirados en atardeceres

## 🔄 Integración

Este módulo está diseñado para integrarse con el sistema de Entity Cards, proporcionando una manera sencilla de configurar colores para las tarjetas de entidad.