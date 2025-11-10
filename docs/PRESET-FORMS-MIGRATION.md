# Guía de Migración a Formularios con Presets

## 📋 Visión General

Esta guía explica cómo migrar los formularios existentes al nuevo sistema de presets configurables.

## 🔄 Formularios Migrados

### ✅ Completados

| Entidad | Formulario Antiguo | Formulario Nuevo | Estado |
|---------|-------------------|------------------|--------|
| Characters | `create-character-form.tsx` | `character-preset-form.tsx` | ✅ Completado |
| Places | `create-place-form.tsx` | `place-preset-form.tsx` | ✅ Completado |
| Concepts | `create-concept-form.tsx` | `concept-preset-form.tsx` | ✅ Completado |

### 🔲 Pendientes

| Entidad | Formulario Actual | Acción Requerida |
|---------|------------------|------------------|
| World Items | `create-world-item-form.tsx` | Crear `world-item-preset-form.tsx` |
| Collections | `create-collection-form.tsx` | Crear `collection-preset-form.tsx` |
| Tags | `create-tag-form.tsx` | Crear `tag-preset-form.tsx` |
| Prompts | `create-prompt-form.tsx` | Evaluar necesidad |
| Notes | `create-note-form.tsx` | Evaluar necesidad |
| Properties | `create-property-form.tsx` | Evaluar necesidad |
| Wildcards | `create-wildcard-form.tsx` | Evaluar necesidad |

## 📝 Patrón de Migración

### Paso 1: Crear Formulario Preset

**Ubicación:** `src/components/settings/{entity}/{entity}-preset-form.tsx`

**Template:**

```tsx
import { useState } from 'react';
import { PresetForm } from '@/components/settings/common/preset-form';
import { useCreate{Entity}, useUpdate{Entity} } from '@/lib/api/{entities}';
import { toastService } from '@/lib/ui/toast';
import type { {Entity}WithStats } from '@/types/entities/{entity}/types';

interface {Entity}PresetFormProps {
	{entity}?: {Entity}WithStats | null;
	isEditing?: boolean;
	onCreated?: (item: {Entity}WithStats) => void;
	onUpdated?: (item: {Entity}WithStats) => void;
	onCancel?: () => void;
}

export function {Entity}PresetForm({
	{entity},
	isEditing = false,
	onCreated,
	onUpdated,
	onCancel,
}: {Entity}PresetFormProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);

	const createMutation = useCreate{Entity}();
	const updateMutation = useUpdate{Entity}();

	// Preparar datos iniciales si estamos editando
	const initialData = isEditing && {entity} ? {
		name: {entity}.name,
		emoji: {entity}.emoji,
		color: {entity}.color,
		// ... otros campos
	} : undefined;

	const handleSubmit = async (data: any) => {
		try {
			setIsSubmitting(true);

			const entityData = {
				name: data.name,
				emoji: data.emoji || '🔷', // emoji por defecto
				color: data.color || '#3b82f6', // color por defecto
				// ... mapear otros campos
				isFavorite: data.isFavorite || false,
			};

			if (isEditing && {entity}) {
				const updated = await updateMutation.mutateAsync({
					id: {entity}.id,
					data: entityData,
				});
				toastService.success('{Entity} actualizado correctamente');
				onUpdated?.(updated);
			} else {
				const created = await createMutation.mutateAsync(entityData);
				toastService.success('{Entity} creado correctamente');
				onCreated?.(created);
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			toastService.error(`Error al ${isEditing ? 'actualizar' : 'crear'} el {entity}`, {
				description: errorMessage,
			});
			throw error;
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<PresetForm
			entityType="{entity}"
			onSubmit={handleSubmit}
			submitLabel={isEditing ? 'Guardar cambios' : 'Crear {entity}'}
			onCancel={onCancel}
			initialData={initialData}
			isEditing={isEditing}
		/>
	);
}
```

### Paso 2: Verificar Preset Config

Asegurarse de que existe configuración en `src/config/entity-field-presets.ts`:

```typescript
export const {ENTITY}_PRESETS: EntityPresetConfig = {
	entityType: '{entity}',
	availableFields: [
		{ name: 'name', label: 'Nombre', type: 'text', required: true },
		{ name: 'emoji', label: 'Emoji', type: 'emoji', defaultValue: '🔷' },
		// ... más campos
	],
	presets: [
		{
			id: 'minimal',
			name: 'Mínimo',
			description: 'Solo lo esencial',
			icon: '⚡',
			fields: ['name', 'emoji'],
			isDefault: true,
		},
		// ... más presets
	],
};

// Registrar en el mapa
export const ENTITY_PRESETS_MAP: Record<string, EntityPresetConfig> = {
	// ...
	'{entity}': {ENTITY}_PRESETS,
};
```

### Paso 3: Actualizar Página de Settings

**Antes:**

```tsx
import { CreateCharacterForm } from './create-character-form';

function CharactersPage() {
	return (
		<div>
			<CreateCharacterForm onCreated={handleCreate} />
		</div>
	);
}
```

**Después:**

```tsx
import { CharacterPresetForm } from './character-preset-form';
import { EntityCardDynamic } from '@/components/ui/entity-card-dynamic';

function CharactersPage() {
	const [showForm, setShowForm] = useState(false);
	const { data: characters } = useCharacters();

	return (
		<div>
			{/* Formulario con presets */}
			{showForm && (
				<CharacterPresetForm
					onCreated={(char) => {
						toast.success(`${char.name} creado`);
						setShowForm(false);
					}}
					onCancel={() => setShowForm(false)}
				/>
			)}

			{/* Grid con tarjetas dinámicas */}
			<div className="grid grid-cols-3 gap-4">
				{characters?.map(char => (
					<EntityCardDynamic
						key={char.id}
						name={char.name}
						emoji={char.emoji}
						color={char.color}
						description={char.description}
						fields={[
							// Solo campos con valor
							{ key: 'age', label: 'Edad', value: char.age, type: 'text' },
						]}
						onToggleFavorite={() => toggleFavorite(char.id)}
					/>
				))}
			</div>
		</div>
	);
}
```

## 🎯 Ejemplo Completo: Characters

Ver implementación de referencia:
- **Formulario:** `src/components/settings/characters/character-preset-form.tsx`
- **Vista:** `src/components/settings/characters/characters-settings-view.tsx`
- **Configuración:** Sección `CHARACTER_PRESETS` en `entity-field-presets.ts`

## ✅ Checklist de Migración

Para cada entidad:

- [ ] Crear configuración de presets en `entity-field-presets.ts`
- [ ] Registrar en `ENTITY_PRESETS_MAP`
- [ ] Crear `{entity}-preset-form.tsx`
- [ ] Actualizar página de settings para usar nuevo formulario
- [ ] Reemplazar tarjetas antiguas con `EntityCardDynamic`
- [ ] Probar creación con diferentes presets
- [ ] Probar edición
- [ ] Verificar que campos condicionales funcionan
- [ ] Eliminar formulario antiguo (opcional, mantener por compatibilidad)

## 🔧 Troubleshooting

### Error: "No hay configuración de presets disponible"

**Causa:** El tipo de entidad no está registrado en `ENTITY_PRESETS_MAP`

**Solución:** Agregar configuración de presets y registrar en el mapa

### Los campos no se muestran en la tarjeta

**Causa:** Los campos tienen valores `null`, `undefined` o `""`

**Solución:** Solo pasar campos con valores reales al prop `fields` de `EntityCardDynamic`

### El formulario no muestra ciertos campos

**Causa:** El preset seleccionado no incluye esos campos

**Solución:** Verificar que el preset incluye los campos deseados en su array `fields`

## 🚀 Mejores Prácticas

1. **Mantener compatibilidad:** No eliminar formularios antiguos hasta migrar todas las referencias
2. **Probar todos los presets:** Verificar que cada preset carga y guarda correctamente
3. **Validación:** Agregar validaciones apropiadas en la configuración de campos
4. **Valores por defecto:** Definir defaults sensatos para emoji y color
5. **Documentar campos personalizados:** Si una entidad tiene campos únicos, documentarlos

## 📊 Progreso de Migración

```
Characters  ████████████████████████ 100% ✅
Places      ████████████████████████ 100% ✅
Concepts    ████████████████████████ 100% ✅
World Items ░░░░░░░░░░░░░░░░░░░░░░░░   0% 🔲
Tags        ░░░░░░░░░░░░░░░░░░░░░░░░   0% 🔲
Collections ░░░░░░░░░░░░░░░░░░░░░░░░   0% 🔲
```

---

**Última actualización:** 2025-11-10
**Versión:** 1.0.0
