# 🎨 Modern Settings Design System

## 📋 Tabla de Contenidos

1. [Arquitectura](#arquitectura)
2. [Componentes](#componentes)
3. [Uso](#uso)
4. [Migración](#migración)
5. [Roadmap](#roadmap)

---

## 🏗️ Arquitectura

### Estructura de Archivos

```
src/components/settings/
├── modern/                          # Nuevo diseño moderno
│   ├── modern-settings-layout.tsx   # Layout principal
│   ├── settings-categories.tsx        # Categorías y navegación
│   ├── settings-card.tsx           # Tarjetas reutilizables
│   ├── modern-settings-view.tsx     # Vista wrapper
│   ├── system-settings-modern.tsx   # Configuración del sistema
│   └── appearance-settings-modern.tsx  # Apariencia
├── settings-view.tsx              # Vista principal (ambos layouts)
├── folders/                       # Secciones existentes
├── system/
└── ...
```

### Principios de Diseño

1. **Sidebar Izquierda** - Navegación clara y visible
2. **Breadcrumbs** - Contexto de navegación
3. **Cards Organizadas** - Información estructurada
4. **Design Tokens** - Colores y espaciado consistentes
5. **Responsive** - Adaptable a diferentes pantallas

---

## 🧩 Componentes

### 1. ModernSettingsLayout

Layout principal con sidebar y contenido.

```tsx
<ModernSettingsLayout
	categories={SETTINGS_CATEGORIES}
	activeSection="system"
	activeItemId="general"
	onNavigate={(section, item) => console.log(section, item)}
>
	{/* Contenido aquí */}
</ModernSettingsLayout>
```

**Props:**

- `categories` - Array de categorías de navegación
- `activeSection` - ID de categoría activa
- `activeItemId` - ID de item activo
- `onNavigate` - Callback al cambiar de sección

### 2. SettingsCard

Tarjeta contenedora para secciones de configuración.

```tsx
<SettingsCard
	icon={<Cog />}
	title="Título"
	description="Descripción opcional"
	variant="default" // default | outlined | elevated
	color="var(--primary)"
>
	<SettingsRow label="Opción">
		<Switch />
	</SettingsRow>
</SettingsCard>
```

**Variantes:**

- `default` - Fondo de tarjeta con borde
- `outlined` - Fondo transparente con borde doble
- `elevated` - Con sombra

### 3. SettingsRow

Fila individual para opciones de configuración.

```tsx
<SettingsRow
	label="Título de la opción"
	description="Descripción explicativa"
	border={false} // Separador inferior
>
	<Switch /> {/* Toggle, Input, etc. */}
</SettingsRow>
```

### 4. SettingsGroup

Agrupación lógica de SettingsRow.

```tsx
<SettingsGroup title="Grupo de opciones">
	<SettingsRow label="Opción 1">
		<Switch />
	</SettingsRow>
	<SettingsRow label="Opción 2">
		<Input />
	</SettingsRow>
</SettingsGroup>
```

---

## 📝 Uso

### Agregar Nueva Sección

1. **Definir categoría** en `settings-categories.tsx`:

```tsx
{
  id: 'custom-section',
  label: 'Mi Sección',
  icon: <Star />,
  color: 'var(--primary)',
  items: [
    {
      id: 'custom-item',
      label: 'Item',
      icon: <Settings />,
      color: 'var(--primary)',
      description: 'Descripción',
    },
  ],
}
```

2. **Crear componente**:

```tsx
// src/components/settings/modern/custom-settings-modern.tsx
export function CustomSettingsModern() {
	return (
		<div className="space-y-6">
			<h2 className="text-2xl font-semibold">Mi Sección</h2>
			<SettingsCard icon={<Star />} title="Configuración">
				<SettingsRow label="Opción">
					<Switch />
				</SettingsRow>
			</SettingsCard>
		</div>
	);
}
```

3. **Actualizar switch** en `modern-settings-view.tsx`:

```tsx
switch (itemId) {
	case 'custom-item':
		return <CustomSettingsModern />;
	// ...
}
```

### Toggle entre Layouts

El componente `SettingsView` principal tiene un toggle para alternar entre:

- **Moderno**: Sidebar izquierda, breadcrumbs, cards organizadas
- **Clásico**: Layout de tabs verticales existente

---

## 🔄 Migración

### Desde Settings Clásico

| Clásico         | Moderno                            |
| --------------- | ---------------------------------- |
| Tabs verticales | Sidebar con categorías expandibles |
| URL `?tab=xxx`  | URL `?section=xxx&item=yyy`        |
| Contenido plano | Cards con headers y descripciones  |
| Sin breadcrumbs | Breadcrumbs contextuales           |

### Pasos de Migración

1. **Evaluar sección existente**
2. **Crear versión moderna** usando `SettingsCard` y `SettingsRow`
3. **Añadir a categories** con descripción
4. **Actualizar switch** en `modern-settings-view.tsx`
5. **Probar ambas versiones**

---

## 🛣️ Roadmap

### Fase 1 - Actual (Completado ✅)

- [x] Layout principal
- [x] Sistema de categorías
- [x] Componentes UI reutilizables
- [x] Settings de Sistema
- [x] Settings de Apariencia
- [x] Toggle entre layouts

### Fase 2 - Próximo

- [ ] Settings de Storage
- [ ] Settings de Database
- [ ] Settings de Thumbnails
- [ ] Settings de Folders

### Fase 3 - Futuro

- [ ] Settings de todas las entidades
- [ ] Búsqueda avanzada en sidebar
- [ ] Estado de carga skeleton
- [ ] Animaciones de transición
- [ ] Persistencia de preferencias en localStorage

---

## 🎨 Design Tokens

### Colores por Categoría

```css
--entity-system: hsl(var(--primary)) --entity-folder: var(--entity-folder) --entity-image: var(--entity-image)
	--entity-tag: var(--entity-tag) --entity-album: var(--entity-album) --entity-collection: var(--entity-collection)
	--entity-character: var(--entity-character) --entity-place: var(--entity-place)
	--entity-world-item: var(--entity-world-item) --entity-concept: var(--entity-concept)
	--entity-prompt: var(--entity-prompt) --entity-note: var(--entity-note) --entity-wildcard: var(--entity-wildcard)
	--entity-property: var(--entity-property);
```

### Espaciado

- Card padding: 24px
- Row gap: 16px
- Section gap: 24px
- Border radius: 12px (xl), 8px (lg)

---

## 💡 Tips de Implementación

1. **Usar componentes existentes** - `SettingsCard`, `SettingsRow`, `SettingsGroup`
2. **Seguir estructura** - Icono + Título + Descripción + Contenido
3. **Añadir descripciones** - Ayudan a la comprensión
4. **Usar variantes** - `outlined` para secciones secundarias
5. **Mantener consistencia** - Colores y espaciado
6. **Testear ambos layouts** - Moderno y Clásico

---

## 📚 Referencias

- [Shadcn/ui](https://ui.shadcn.com)
- [Radix UI](https://www.radix-ui.com)
- [Lucide Icons](https://lucide.dev)
- [Tailwind CSS](https://tailwindcss.com)
