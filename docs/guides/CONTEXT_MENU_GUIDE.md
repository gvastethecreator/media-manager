# Context menu guide

## Implemented functionality

The menu activates on right-click of any item in the file browser.

**Main menu options:**

- **Open** - Opens the selected item or items
- **Preview** - Previews the item
- **Copy** - Copies the selected items
- **Rename** - Renames a single item (disabled for multiple selection)
- **Download** - Downloads the items
- **Delete** - Deletes the items (with destructive red styling)

**"Add to..." submenu with all requested entities:**

- Album
- Collection
- Group
- Tag
- World Item
- Characters
- Concept
- Notes
- Places
- Prompts
- Properties
- Wildcards
- Favorites

## Menu behavior

### Automatic selection

Selection behavior is:

- If you right-click an unselected item, it is selected automatically.
- If the item is already selected, the existing multiple selection is kept.
- The **Open** option shows the number of selected items.

### Interaction

Interaction behavior is:

- The menu is positioned at the cursor coordinates.
- It closes automatically on outside click or Escape.
- Options have hover effects and visual feedback.

### Submenus

Submenu behavior is:

- The **Add to...** submenu opens on hover.
- It includes visual separators to organize the options.
- All entities have distinctive icons.

## Technical implementation

### Modified or created files

These files were modified or created:

1. **`extended-context-menu.tsx`** - New context menu component
2. **`file-canvas.tsx`** - Context menu integrated with event handlers

### Managed state

Managed state includes:

- **Menu position** - Cursor x,y coordinates
- **Selected items** - Array of MediaItems for the context
- **Visibility** - Open or closed state of the menu

### Events

Events include:

- **onContextMenu** - Captures right-click and calculates position
- **onAction** - Handler for menu actions (to implement)
- **onClose** - Menu close with state cleanup

## Next steps (TODO)

The action handlers are prepared. They still need implementation:

- Connect with the APIs of each entity.
- Implement selection dialogs to choose a specific album or collection.
- Handle copy and move file operations.
- Integrate with the existing favorites system.

## Use in the application

Follow this sequence:

1. Navigate to any file browser view (grid, list, table, or similar).
2. Right-click any image or file.
3. Select a menu option, or explore **Add to...**.
4. Observe the console logs to see which action ran.

The context menu is functional and ready to connect with business logic.
