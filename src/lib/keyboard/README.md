# Keyboard shortcut manager

This system manages keyboard shortcuts for the file browser.

## Features

The manager provides the following capabilities:

- **Centralized management** of keyboard shortcuts
- **Specific contexts** (`file-browser`, `context-menu`, `global`)
- **Keyboard navigation** in context menus
- **Default shortcuts** for common operations
- **React integration** through hooks
- **Fully typed TypeScript** APIs

## Basic use

### In FileBrowser

```typescript
import { useFileBrowserShortcuts } from '@/lib/keyboard';

function FileBrowser() {
	const { register, setContext } = useFileBrowserShortcuts();

	useEffect(() => {
		// Default shortcuts are already registered
		setContext('file-browser');
	}, []);

	// Shortcuts run automatically:
	// Ctrl+A - Select all
	// Delete - Delete selected items
	// F2 - Rename
	// Escape - Clear selection
	// Ctrl+C - Copy
	// Ctrl+X - Cut
	// Ctrl+V - Paste
	// Enter - Open selected item
	// Space - Preview
}
```

### In context menus

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

  // Automatic navigation:
  // ↑↓ - Move through items
  // Enter - Run the action
  // Escape - Close the menu
}
```

## Default shortcuts

### File browser

The file browser context uses the following shortcuts:

- `Ctrl+A` - Select all
- `Delete` - Delete selected items
- `F2` - Rename the selected item
- `Ctrl+C` - Copy selected items
- `Ctrl+X` - Cut selected items
- `Ctrl+V` - Paste items
- `Enter` - Open the selected item
- `Space` - Preview the selected item

### Context menu

The context menu uses the following shortcuts:

- `↑` - Move up
- `↓` - Move down
- `→` - Open the submenu
- `←` - Close the submenu
- `Enter` - Run the selected action
- `Escape` - Close the menu

### Global

The global context uses the following shortcut:

- `Escape` - Clear the selection or close menus

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
// General hook
useKeyboardShortcuts(options?: UseKeyboardShortcutsOptions)

// File browser hook
useFileBrowserShortcuts()

// Context menu hook
useContextMenuShortcuts()

// Menu navigation hook
useContextMenuNavigation(itemCount: number, options?: ContextMenuNavigationOptions)
```

## Shortcut configuration

```typescript
interface KeyboardShortcutConfig {
	key: string; // Primary key
	modifiers: string[]; // ['ctrl', 'shift', 'alt', 'meta']
	action: string; // Unique identifier
	context?: string; // Context where the shortcut applies
	description: string; // Help description
	preventDefault?: boolean; // Prevent the default behavior
	stopPropagation?: boolean; // Stop event propagation
}
```

## Contexts

The manager uses the following contexts:

- `global` - Applies across the application
- `file-browser` - Applies only in the file browser
- `context-menu` - Applies only in context menus
- `file-viewer` - Applies only in the file viewer

## Implementation

### 1. KeyboardShortcutManager

This class registers and runs shortcuts.

### 2. React hooks

These hooks integrate the manager with React components.

### 3. Context menu navigation

This system provides keyboard navigation in menus.

### 4. Default shortcuts

These shortcuts cover common operations.

## Testing

```bash
bun test src/lib/keyboard/__tests__/
```

The tests verify the following behavior:

- Shortcut registration and execution
- Filtering by context
- Enable and disable
- Navigation in context menus

## Integration with FileBrowser

The system is fully integrated with the existing FileBrowser.

The integration includes the following behavior:

1. **Automatic shortcuts** - Shortcuts work with no extra setup
2. **Visual feedback** - Toast notifications for actions
3. **Context awareness** - Different shortcuts per context
4. **Fluid navigation** - Integration with the file viewer and selection store

## Planned improvements

The following items are planned:

- [ ] User-customizable shortcuts
- [ ] Contextual shortcut help
- [ ] Shortcuts for different file types
- [ ] Drag-and-drop integration
- [ ] Support for key sequences
