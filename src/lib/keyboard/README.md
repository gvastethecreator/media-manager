# Keyboard Shortcut Manager

Sistema de gestión de atajos de teclado para el navegador de archivos.

## Características

- ✅ **Gestión centralizada** de atajos de teclado
- ✅ **Contextos específicos** (file-browser, context-menu, global)
- ✅ **Navegación por teclado** en menús contextuales
- ✅ **Shortcuts por defecto** para operaciones comunes
- ✅ **Integración con React** mediante hooks
- ✅ **TypeScript** completamente tipado

## Uso Básico

### En el FileBrowser

```typescript
import { useFileBrowserShortcuts } from '@/lib/keyboard';

function FileBrowser() {
	const { register, setContext } = useFileBrowserShortcuts();

	useEffect(() => {
		// Los shortcuts por defecto ya están registrados
		setContext('file-browser');
	}, []);

	// Los shortcuts funcionan automáticamente:
	// Ctrl+A - Seleccionar todo
	// Delete - Eliminar seleccionados
	// F2 - Renombrar
	// Escape - Cancelar selección
	// Ctrl+C - Copiar
	// Ctrl+X - Cortar
	// Ctrl+V - Pegar
	// Enter - Abrir seleccionado
	// Space - Previsualizar
}
```

### En Menús Contextuales

```typescript
import { useContextMenuNavigation } from '@/lib/keyboard';

function ContextMenu({ items }) {
  const { selectedIndex, getItemProps } = useContextMenuNavigation(items.length, {
    onExecute: (index) => handleAction(items[index]),
    onClose: () => closeMenu(),
  });

  return (
    <div>
      {items.map((item, index) => (
        <button key={index} {...getItemProps(index)}>
          {item.label}
        </button>
      ))}
    </div>
  );

  // Navegación automática:
  // ↑↓ - Navegar por items
  // Enter - Ejecutar acción
  // Escape - Cerrar menú
}
```

## Shortcuts por Defecto

### File Browser

- `Ctrl+A` - Seleccionar todo
- `Delete` - Eliminar elementos seleccionados
- `F2` - Renombrar elemento seleccionado
- `Ctrl+C` - Copiar elementos seleccionados
- `Ctrl+X` - Cortar elementos seleccionados
- `Ctrl+V` - Pegar elementos
- `Enter` - Abrir elemento seleccionado
- `Space` - Vista previa del elemento seleccionado

### Context Menu

- `↑` - Navegar hacia arriba
- `↓` - Navegar hacia abajo
- `→` - Abrir submenú
- `←` - Cerrar submenú
- `Enter` - Ejecutar acción seleccionada
- `Escape` - Cerrar menú

### Global

- `Escape` - Cancelar selección o cerrar menús

## API

### KeyboardShortcutManager

```typescript
class KeyboardShortcutManager {
	register(shortcut: KeyboardShortcutConfig, handler: ShortcutHandler): void;
	unregister(shortcut: KeyboardShortcutConfig): void;
	unregisterByAction(action: string): void;
	setContext(context: string): void;
	setEnabled(enabled: boolean): void;
	getShortcutsForContext(context: string): KeyboardShortcutConfig[];
}
```

### Hooks

```typescript
// Hook general
useKeyboardShortcuts(options?: UseKeyboardShortcutsOptions)

// Hook específico para file browser
useFileBrowserShortcuts()

// Hook específico para context menus
useContextMenuShortcuts()

// Hook para navegación en menús
useContextMenuNavigation(itemCount: number, options?: ContextMenuNavigationOptions)
```

## Configuración de Shortcuts

```typescript
interface KeyboardShortcutConfig {
	key: string; // Tecla principal
	modifiers: string[]; // ['ctrl', 'shift', 'alt', 'meta']
	action: string; // Identificador único
	context?: string; // Contexto donde aplica
	description: string; // Descripción para ayuda
	preventDefault?: boolean; // Prevenir comportamiento por defecto
	stopPropagation?: boolean; // Detener propagación
}
```

## Contextos

- `global` - Aplica en toda la aplicación
- `file-browser` - Solo en el navegador de archivos
- `context-menu` - Solo en menús contextuales
- `file-viewer` - Solo en el visor de archivos

## Implementación

### 1. KeyboardShortcutManager

Clase principal que gestiona el registro y ejecución de shortcuts.

### 2. React Hooks

Hooks para integración fácil con componentes React.

### 3. Context Menu Navigation

Sistema especializado para navegación por teclado en menús.

### 4. Default Shortcuts

Shortcuts predefinidos para operaciones comunes.

## Testing

```bash
bun test src/lib/keyboard/__tests__/
```

Los tests verifican:

- Registro y ejecución de shortcuts
- Filtrado por contexto
- Habilitación/deshabilitación
- Navegación en menús contextuales

## Integración con FileBrowser

El sistema está completamente integrado con el FileBrowser existente:

1. **Shortcuts automáticos** - Funcionan sin configuración adicional
2. **Feedback visual** - Notificaciones toast para acciones
3. **Context awareness** - Diferentes shortcuts según el contexto
4. **Navegación fluida** - Integración con file viewer y selection store

## Próximas Mejoras

- [ ] Shortcuts personalizables por usuario
- [ ] Ayuda contextual de shortcuts
- [ ] Shortcuts para diferentes tipos de archivos
- [ ] Integración con drag & drop
- [ ] Soporte para secuencias de teclas
