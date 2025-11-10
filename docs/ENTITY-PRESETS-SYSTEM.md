# Sistema de Presets para Entidades Abstractas

## 📋 Descripción General

El Sistema de Presets permite crear y gestionar entidades abstractas (characters, places, concepts, etc.) con diferentes niveles de detalle, facilitando la entrada de datos mediante formularios configurables y visualización inteligente de campos.

## 🎯 Características Principales

### 1. **Presets Configurables**
Cada tipo de entidad tiene múltiples presets predefinidos:
- **Mínimo** ⚡: Solo campos esenciales (nombre + emoji)
- **Básico** 📝: Información fundamental
- **Estándar** 📊: Perfil completo con detalles
- **RPG** 🎲: (Para characters) Campos específicos de rol
- **Completo** 📋: Todos los campos disponibles

### 2. **Campos Condicionales**
- Los campos solo se muestran en las tarjetas si tienen valor
- Formularios adaptan sus campos según el preset seleccionado
- Interfaz limpia y sin campos vacíos innecesarios

### 3. **Tipos de Entidades Soportadas**
- ✅ Characters (personajes)
- ✅ Places (lugares)
- ✅ Concepts (conceptos)
- ✅ World Items (objetos del mundo)
- ✅ Tags (etiquetas)
- 🔄 Extensible a más tipos

## 🏗️ Arquitectura

```
src/
├── config/
│   └── entity-field-presets.ts      # Configuración de presets
├── components/
│   ├── settings/common/
│   │   ├── preset-selector.tsx      # Selector visual de presets
│   │   └── preset-form.tsx          # Formulario con presets
│   └── ui/
│       └── entity-card-dynamic.tsx  # Tarjeta con campos condicionales
```

## 🔧 Componentes

### PresetSelector

Permite seleccionar entre diferentes presets visualmente.

```tsx
import { PresetSelector } from '@/components/settings/common/preset-selector';

<PresetSelector
  presets={CHARACTER_PRESETS.presets}
  selectedPresetId={selectedPresetId}
  onSelectPreset={setSelectedPresetId}
/>
```

### PresetForm

Formulario que adapta sus campos según el preset seleccionado.

```tsx
import { PresetForm } from '@/components/settings/common/preset-form';

<PresetForm
  entityType="character"
  onSubmit={async (data) => {
    await createCharacter(data);
  }}
  submitLabel="Crear Personaje"
  onCancel={() => setIsOpen(false)}
/>
```

### EntityCardDynamic

Tarjeta que muestra solo campos con valor.

```tsx
import { EntityCardDynamic } from '@/components/ui/entity-card-dynamic';

<EntityCardDynamic
  id={character.id}
  name={character.name}
  emoji={character.emoji}
  color={character.color}
  description={character.description}
  isFavorite={character.isFavorite}
  fields={[
    { key: 'age', label: 'Edad', value: character.age, type: 'text' },
    { key: 'class', label: 'Clase', value: character.class, type: 'badge' },
    { key: 'skills', label: 'Habilidades', value: character.skills, type: 'long-text' }
  ]}
  stats={{ images: 45, videos: 12 }}
  onClick={() => navigate(`/character/${character.id}`)}
  onToggleFavorite={() => toggleFavorite(character.id)}
  actions={[
    { label: 'Editar', onClick: () => edit(character.id) },
    { label: 'Eliminar', onClick: () => delete(character.id), variant: 'destructive' }
  ]}
/>
```

## 📝 Configuración de Presets

### Estructura de una Configuración

```typescript
export const CHARACTER_PRESETS: EntityPresetConfig = {
  entityType: 'character',
  availableFields: [
    {
      name: 'name',
      label: 'Nombre',
      type: 'text',
      required: true,
      placeholder: 'Nombre del personaje'
    },
    {
      name: 'class',
      label: 'Clase',
      type: 'select',
      options: [
        { value: 'warrior', label: 'Guerrero' },
        { value: 'mage', label: 'Mago' }
      ]
    },
    // ... más campos
  ],
  presets: [
    {
      id: 'minimal',
      name: 'Mínimo',
      description: 'Solo nombre y emoji',
      icon: '⚡',
      fields: ['name', 'emoji'],
      isDefault: true
    },
    // ... más presets
  ]
};
```

### Tipos de Campos Soportados

| Tipo | Descripción | Uso |
|------|-------------|-----|
| `text` | Input de texto simple | Nombres, títulos |
| `textarea` | Área de texto multilínea | Descripciones, historias |
| `number` | Input numérico | Niveles, edades |
| `select` | Menú desplegable | Categorías, clases |
| `color` | Selector de color | Colores de entidad |
| `emoji` | Selector de emoji | Íconos representativos |
| `checkbox` | Casilla de verificación | Flags booleanos |
| `date` | Selector de fecha | Fechas importantes |

## 🎨 Personalización

### Agregar Nuevo Tipo de Entidad

1. Crear configuración de presets en `entity-field-presets.ts`:

```typescript
export const MY_ENTITY_PRESETS: EntityPresetConfig = {
  entityType: 'my-entity',
  availableFields: [
    { name: 'name', label: 'Nombre', type: 'text', required: true },
    // ... más campos
  ],
  presets: [
    {
      id: 'minimal',
      name: 'Mínimo',
      description: 'Solo lo esencial',
      icon: '⚡',
      fields: ['name'],
      isDefault: true
    }
  ]
};
```

2. Registrar en el mapa de presets:

```typescript
export const ENTITY_PRESETS_MAP: Record<string, EntityPresetConfig> = {
  character: CHARACTER_PRESETS,
  place: PLACE_PRESETS,
  'my-entity': MY_ENTITY_PRESETS,  // ← Agregar aquí
};
```

3. Usar en tu página de settings:

```tsx
<PresetForm
  entityType="my-entity"
  onSubmit={handleSubmit}
/>
```

### Agregar Nuevo Preset a Entidad Existente

Simplemente agregar un nuevo preset en el array:

```typescript
export const CHARACTER_PRESETS: EntityPresetConfig = {
  // ...
  presets: [
    // ... presets existentes
    {
      id: 'villain',
      name: 'Villano',
      description: 'Antagonista con motivaciones complejas',
      icon: '😈',
      fields: ['name', 'emoji', 'color', 'background', 'personality', 'goals']
    }
  ]
};
```

## 🔄 Flujo de Uso

### Caso 1: Creación Rápida
1. Usuario accede a Settings → Characters
2. Click en "Crear Personaje"
3. Preset "Mínimo" seleccionado por defecto
4. Solo ingresa nombre + emoji
5. Crea entidad → Listo ✅

### Caso 2: Personaje Completo
1. Usuario accede a Settings → Characters
2. Click en "Crear Personaje"
3. Selecciona preset "RPG"
4. Formulario muestra campos relevantes
5. Completa stats, clase, habilidades
6. Crea entidad → Personaje RPG completo ✅

### Caso 3: Visualización Inteligente
1. Tarjeta muestra solo campos con valor
2. Personaje básico: solo nombre, emoji, descripción
3. Personaje completo: todos los campos relevantes
4. UI siempre limpia y contextual

## 📊 Ejemplo Completo de Integración

```tsx
// src/components/settings/characters/characters-settings.tsx
import { useState } from 'react';
import { PresetForm } from '@/components/settings/common/preset-form';
import { EntityCardDynamic } from '@/components/ui/entity-card-dynamic';
import { useCharacters, useCreateCharacter } from '@/lib/api/characters';

export function CharactersSettings() {
  const { data: characters } = useCharacters();
  const createMutation = useCreateCharacter();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Personajes</h2>
        <Button onClick={() => setShowForm(true)}>
          Crear Personaje
        </Button>
      </div>

      {/* Formulario con presets */}
      {showForm && (
        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Nuevo Personaje</h3>
          <PresetForm
            entityType="character"
            onSubmit={async (data) => {
              await createMutation.mutateAsync(data);
              setShowForm(false);
            }}
            submitLabel="Crear Personaje"
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Grid de tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {characters?.map((character) => (
          <EntityCardDynamic
            key={character.id}
            id={character.id}
            name={character.name}
            emoji={character.emoji}
            color={character.color}
            description={character.description}
            isFavorite={character.isFavorite}
            featuredImage={character.featuredImage}
            fields={[
              // Solo se mostrarán si tienen valor
              { key: 'age', label: 'Edad', value: character.age, type: 'text' },
              { key: 'class', label: 'Clase', value: character.class, type: 'badge' },
              { key: 'level', label: 'Nivel', value: character.level, type: 'text' },
              { key: 'background', label: 'Historia', value: character.background, type: 'long-text' }
            ]}
            stats={{
              images: character.stats.imageCount,
              videos: character.stats.videoCount
            }}
            onClick={() => navigate(`/characters/${character.id}`)}
            onToggleFavorite={() => toggleFavoriteMutation.mutate(character.id)}
            actions={[
              { label: 'Editar', onClick: () => editCharacter(character.id) },
              { label: 'Eliminar', onClick: () => deleteCharacter(character.id), variant: 'destructive' }
            ]}
          />
        ))}
      </div>
    </div>
  );
}
```

## 🎯 Mejores Prácticas

1. **Preset por Defecto**: Siempre definir un preset mínimo como default
2. **Campos Requeridos**: Solo `name` debe ser requerido, todo lo demás opcional
3. **Validación**: Agregar validación en los tipos de campo (min, max, maxLength)
4. **Descripciones**: Incluir placeholders y descriptions útiles
5. **Progresividad**: Permitir empezar con lo mínimo y agregar detalles después

## 🚀 Roadmap

- [ ] Sistema de presets personalizables por usuario
- [ ] Importar/Exportar configuraciones de presets
- [ ] Presets basados en plantillas de la comunidad
- [ ] Campos personalizados definidos por el usuario
- [ ] Validación avanzada con Zod
- [ ] Previsualización en tiempo real

## 📚 Referencias

- Componentes: `src/components/settings/common/`
- Configuración: `src/config/entity-field-presets.ts`
- Tipos: Heredan de `EntityBase` en `@/types/entities/entity.types`

---

**Creado**: 2025-11-10
**Versión**: 1.0.0
**Autor**: Image Manager Team
