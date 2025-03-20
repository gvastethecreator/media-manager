# 🎴 Entity Cards

Sistema modular y visual para mostrar tarjetas de entidades con efectos visuales avanzados, diseñado para Next.js 15 y React 19.

## 🚀 Características

- **Sistema modular** con soporte para múltiples tipos de entidades (carpetas, álbumes, etiquetas, personajes, etc.)
- **Efectos visuales avanzados** como holográfico, resplandor, texturas, bordes animados y más
- **Sistema de capas** para separar diferentes aspectos visuales
- **Adaptadores** para distintos tipos de entidades
- **Presets visuales** configurables por tipo de entidad
- **Modo de rendimiento** para optimizar según las capacidades del dispositivo
- **Soporte para temas claro/oscuro** y sistema de colores personalizable
- **Configuración detallada** para cada aspecto visual
- **Completamente tipado** con TypeScript
- **Sistema de presets** con configuraciones predefinidas y personalizables

## 📋 Tipos de Entidades Soportados

- **Carpeta (Folder)**: Para representar directorios y colecciones de archivos
- **Álbum (Album)**: Para colecciones de imágenes y fotos
- **Etiqueta (Tag)**: Para categorizar y etiquetar contenido
- **Personaje (Character)**: Para personajes en un contexto narrativo
- **Lugar (Place)**: Para ubicaciones y mapas
- **Objeto del Mundo (WorldItem)**: Para objetos e ítems en un contexto narrativo o de juego
- **Concepto (Concept)**: Para ideas abstractas y conceptos
- **Prompt**: Para prompts de IA y generación de contenido
- **Nota (Note)**: Para notas y documentos simples
- **Colección (Collection)**: Para agrupaciones de contenido diverso

## 🛠️ Tecnologías Utilizadas

- **Next.js 15**: Framework de React para aplicaciones web
- **React 19**: Biblioteca JavaScript para interfaces de usuario
- **TypeScript**: Para tipado estático y seguridad de tipos
- **TailwindCSS 4**: Framework CSS utilitario
- **shadcn/ui**: Componentes reutilizables y accesibles
- **motion/react**: Para animaciones fluidas
- **Prisma**: ORM para persistencia de configuraciones

## 📦 Estructura Principal

```
entity-cards/
├─ adapters/              # Adaptadores para diferentes tipos de entidades
├─ base/                  # Componentes base para tarjetas
├─ context/               # Contextos de React para estado compartido
├─ docs/                  # Documentación detallada
├─ hooks/                 # Hooks personalizados
├─ layers/                # Sistema de capas para efectos visuales
├─ layouts/               # Layouts específicos por tipo de entidad
├─ modules/               # Módulos funcionales (animación, diseño, etc.)
├─ types/                 # Definiciones de tipos TypeScript
├─ entity-card.tsx        # Componente principal simple
├─ entity-card-wrapper.tsx # Wrapper con soporte para modos
└─ index.ts               # Punto de entrada y exportaciones
```

## 📝 Uso Básico

```tsx
import { EntityCardWrapper } from '@/components/features/entity-cards';

// Ejemplo con opciones básicas
function MyComponent() {
  return (
    <EntityCardWrapper
      entityType="folder"
      title="Documentos Importantes"
      description="Carpeta con documentos personales"
      image="/images/folder-icon.png"
      onClick={() => handleClick('folder-id')}
    />
  );
}
```

## 🎨 Personalización Visual

```tsx
<EntityCardWrapper
  entityType="worldItem"
  entity={item}
  options={{
    // Colores
    primaryColor: '#f59e0b',
    secondaryColor: '#d97706',

    // Sistema de diseño
    designSystem: {
      preset: 'worldItem',
      cornerStyle: 'rounded',
      aspectRatio: '7/10',
      elevation: 3,
    },

    // Efectos visuales
    enableGlowEffect: true,
    enableHolographicEffect: true,

    // Configuraciones detalladas
    glowOptions: {
      intensity: 0.7,
      color: '#f59e0b',
    },

    // Sistema de rareza
    raritySystem: {
      enabled: true,
      defaultRarity: 'legendary',
    },
  }}
/>
```

## 📊 Modos de Visualización

El sistema soporta diferentes modos de visualización:

```tsx
// Modo simple (alto rendimiento)
<EntityCardWrapper
  entityType="folder"
  entity={folder}
  options={{ displayMode: 'simple' }}
/>

// Modo complejo (todos los efectos)
<EntityCardWrapper
  entityType="character"
  entity={character}
  options={{ displayMode: 'complex' }}
/>

// Modo esqueleto (para pruebas)
<EntityCardWrapper
  entityType="album"
  entity={album}
  options={{ displayMode: 'skeleton' }}
/>

// Modo JSON (datos brutos)
<EntityCardWrapper
  entityType="place"
  entity={place}
  options={{ displayMode: 'json' }}
/>
```

## 🧩 Sistema de Capas

El sistema de capas permite combinar diferentes efectos visuales:

```tsx
<EntityCardWrapper
  entityType="character"
  entity={character}
  options={{
    layers: {
      order: ['background', 'content', 'holographic', 'border', 'grain'],
      explodeView: true, // Para visualización separada
      explodeDistance: 20,
    }
  }}
/>
```

## ⚡ Rendimiento

Para mejorar el rendimiento en listas largas:

```tsx
// Usar modo simple para listas
<div className="grid grid-cols-3 gap-4">
  {items.map(item => (
    <EntityCardWrapper
      key={item.id}
      entityType="folder"
      entity={item}
      options={{
        displayMode: 'simple',
        performanceMode: 'performance',
      }}
    />
  ))}
</div>
```

## 📚 Documentación Adicional

Para más detalles, consulta estos archivos de documentación:

- [Arquitectura del Sistema](./docs/ARCHITECTURE.md)
- [Guía de Uso](./docs/USAGE.md)
- [Sistema de Capas](./docs/LAYERS-SYSTEM.md)
- [Guía de Migración](./docs/migration-guide.md)

## 🧪 Ejemplos

Se incluyen varios ejemplos para mostrar las diferentes capacidades del sistema:

- [Ejemplo Básico](./examples/basic-card-example.tsx)
- [Modos de Visualización](./examples/card-display-modes-example.tsx)
- [Tarjetas con Capas](./examples/optimized-card-with-layers.tsx)

## 🤝 Contribución

Para contribuir a este componente:

1. Sigue las guías de estilo y patrones existentes
2. Documenta cualquier nueva característica o cambio
3. Mantén la compatibilidad con los tipos existentes
4. Considera el rendimiento, especialmente para listas largas

## ⚠️ Consideraciones Importantes

- Este componente está diseñado específicamente para Next.js 15 y React 19
- Utiliza características modernas como Server Components y Server Actions
- Requiere TailwindCSS 4 para los estilos
- Está integrado con Prisma para almacenamiento de configuraciones

## 🔮 Roadmap Futuro

- [ ] Mejoras de accesibilidad
- [ ] Más presets visuales predefinidos
- [ ] Herramienta visual de diseño de tarjetas
- [ ] Soporte para más tipos de entidades
- [ ] Optimizaciones adicionales de rendimiento
- [ ] Sistema de exportación/importación de configuraciones

---

Desarrollado y mantenido como parte del sistema de gestión de imágenes.
