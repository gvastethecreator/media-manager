# 🏷️ Tags Section

## 📝 Descripción

El componente `TagsSection` es una sección de configuración que permite gestionar las etiquetas del sistema. Proporciona una interfaz para crear, editar y eliminar etiquetas, con personalización de colores y emojis.

## 🔧 Características Principales

### Gestión

- Creación de etiquetas
- Edición de propiedades
- Eliminación de etiquetas
- Personalización visual

### Personalización

- Selector de colores
- Selector de emojis
- Descripción opcional
- Atajos de teclado

## 🏗️ Estructura

### Interfaces

```typescript
interface Tag {
	id: string;
	name: string;
	color: string;
	description?: string;
	shortcut?: string;
}

interface TagForm {
	name: string;
	color: string;
	description: string;
	shortcut: string;
}
```

### Estados Principales

```typescript
const [editingId, setEditingId] = useState<string | null>(null);
const [editForm, setEditForm] = useState<TagForm | null>(null);
const [newTag, setNewTag] = useState({
	name: "",
	color: "#3b82f6",
	description: "",
	shortcut: "",
});
```

## 🔄 Ciclo de Vida

1. **Inicialización**

   - Carga de etiquetas existentes
   - Configuración de estado inicial
   - Preparación de formularios

2. **Edición**

   - Activación de modo edición
   - Validación de cambios
   - Actualización en tiempo real
   - Guardado de cambios

3. **Finalización**
   - Limpieza de estado
   - Actualización de lista
   - Notificaciones
   - Recarga de datos

## 📊 Funcionalidades

### Gestión de Etiquetas

```typescript
const handleStartEdit = (tag: Tag) => {
	setEditingId(tag.id);
	setEditForm({
		name: tag.name,
		color: tag.color,
		description: tag.description || "",
		shortcut: tag.shortcut || "",
	});
};

const handleSaveEdit = async (id: string) => {
	if (!editForm) return;
	await updateTag(id, editForm);
	handleCancelEdit();
};
```

### Creación de Etiquetas

```typescript
const handleAddTag = async () => {
	if (!newTag.name) return;
	await updateTag(null, newTag);
	setNewTag({
		name: "",
		color: "#3b82f6",
		description: "",
		shortcut: "",
	});
};
```

## 🎨 Componentes UI

- `TagForm`: Formulario de etiquetas
- `ColorPicker`: Selector de colores
- `TagList`: Lista de etiquetas
- `EditableTag`: Etiqueta editable
- `TagPreview`: Vista previa

## 🔍 Consideraciones

### Rendimiento

- Optimización de renders
- Gestión de estado eficiente
- Validación en tiempo real
- Actualizaciones optimistas

### UX/UI

- Feedback inmediato
- Transiciones suaves
- Estados de hover
- Acciones contextuales

### Validación

- Nombres únicos
- Colores válidos
- Atajos no duplicados
- Longitud máxima

## 📚 Ejemplos de Uso

```tsx
// Uso básico
<TagsSection />

// Con configuración personalizada
<TagsSection
  maxTags={50}
  allowDuplicates={false}
/>
```

## 🔗 Dependencias

- `@/context/settings-context`: Contexto de configuración
- `@/components/ui`: Componentes de UI
- `react-color`: Selector de colores
- `lucide-react`: Iconos

## 📝 Notas Técnicas

### Optimizaciones

- Memorización de componentes
- Debounce en búsquedas
- Caché de colores
- Validación eficiente

### Integración

- Sistema de etiquetas
- Gestión de estado
- Eventos del sistema
- Persistencia de datos

### Mantenibilidad

- Código modular
- Tipos definidos
- Documentación clara
- Tests unitarios

```

```
