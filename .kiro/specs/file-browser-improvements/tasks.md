# Implementation Plan - File Browser Improvements

## Task Overview

Este plan de implementación convierte el diseño técnico en tareas específicas de codificación que pueden ser ejecutadas por un agente de desarrollo. Cada tarea está diseñada para ser incremental, testeable y construir sobre las tareas anteriores.

## Implementation Tasks

### Phase 1: Foundation and Context Menu System

- [ ] 1. Create Keyboard Shortcut Manager
  - Create `src/lib/keyboard/keyboard-shortcut-manager.ts` with shortcut registration and handling
  - Add keyboard event listeners to existing FileBrowser component
  - Implement default shortcuts (Ctrl+A, Delete, F2, Escape, etc.)
  - Add keyboard navigation for context menus (arrow keys, Enter, Escape)
  - _Requirements: 1.16, 1.17_

- [ ] 2. Enhance existing FileContextMenu with missing operations
  - Update `src/components/features/file-browser/context-menu/context-menu.tsx` to add missing actions
  - Extend `src/components/features/file-browser/context-menu/types.ts` with new ContextMenuAction types
  - Update `src/components/features/file-browser/context-menu/context-action-handler.ts` with new handlers
  - Add "Pegar", "Renombrar", "Mover" options to existing menu structure
  - Implement "Ver en explorador" using existing file service integration
  - _Requirements: 1.5, 1.6, 1.7, 1.12, 1.14_

- [ ] 3. Create EmptySpaceContextMenu component
  - Create `src/components/features/file-browser/context-menu/empty-space-context-menu.tsx`
  - Add "Seleccionar todo", "Pegar", "Actualizar", "Nueva carpeta" options
  - Update FileBrowser component to handle right-click on empty space
  - Handle context-specific actions based on current folder/view
  - _Requirements: 1.3, 1.15_

- [ ] 4. Create MultiSelectionContextMenu component
  - Create `src/components/features/file-browser/context-menu/multi-selection-context-menu.tsx`
  - Add bulk operations: "Eliminar múltiples", "Mover múltiples", "Agregar a colección"
  - Show selection count and estimated operation time
  - Implement confirmation dialogs for destructive operations
  - _Requirements: 1.4_

- [ ] 5. Enhance existing FileOperationsService
  - Extend existing `src/services/file/file.service.ts` with clipboard operations
  - Add copyToClipboard, pasteFromClipboard methods using existing file operations
  - Implement renameItem with inline editing support using existing renameFile function
  - Add moveItems batch operation using existing moveFile function
  - Integrate with existing toastService for operation feedback
  - _Requirements: 1.5, 1.6, 1.7, 1.8, 1.10_

- [ ] 6. Create ClipboardManager for system integration
  - Create `src/services/clipboard/clipboard-manager.ts`
  - Implement copy/cut/paste operations with system clipboard
  - Add clipboard state management and validation
  - Support for multiple file formats and metadata
  - Integrate with existing file service operations
  - _Requirements: 1.5, 1.6_

- [ ] 7. Enhance toast notifications for file operations
  - Update existing context-action-handler.ts to use toastService more comprehensively
  - Add progress toasts for long-running operations
  - Implement error toasts with recovery options
  - Add success confirmations with undo options
  - _Requirements: All context menu operations_

- [ ] 7.1. Fix CSS user-select behavior on file items
  - Remove or disable CSS `user-select` property on file browser items
  - Ensure text selection doesn't interfere with item selection/interaction
  - Test drag selection doesn't conflict with text selection
  - Apply `user-select: none` to interactive elements while preserving accessibility
  - _Requirements: User experience improvement_

- [ ] 7.2. Implement click-to-deselect functionality
  - Add click handler to empty space in FileBrowser component
  - Clear selection when clicking on empty areas using existing `clearSelection` from useSelectionStore
  - Ensure click-to-deselect works in all view modes (list, grid, cards, masonry)
  - Prevent event bubbling conflicts with item selection
  - _Requirements: User experience improvement_

### Phase 2: Enhanced View System

- [ ] 8. Enhance existing ListView with metadata columns
  - Update `src/components/features/file-browser/views/list-view.tsx` to add configurable columns
  - Add columns: name, size, modified date, type, tags using existing entity data
  - Implement column sorting using existing sortOptions from useViewOptionsStore
  - Add metadata display for different entity types using existing AnyEntityWithStats
  - Show thumbnails, prompts, tags, and related entities in compact format
  - _Requirements: 2.5_

- [ ] 9. Create ListColumnConfig system
  - Create `src/types/file-browser/list-column-config.ts`
  - Implement column configuration with width, visibility, sorting
  - Add custom renderers for different data types
  - Integrate with existing settings store for persistence
  - _Requirements: 2.5, 2.9_

- [ ] 10. Enhance existing GridView with customization options
  - Update `src/components/features/file-browser/views/grid-view.tsx` with new props
  - Add aspect ratio controls (auto, square, 4:3, 16:9, custom)
  - Implement hover information overlay (none, basic, detailed)
  - Add label display options and positioning
  - Use existing base-virtualized-view.tsx for consistent behavior
  - _Requirements: 2.7_

- [ ] 11. Enhance existing CardsView with interactive features
  - Update `src/components/features/file-browser/views/cards-view.tsx` with new features
  - Add card style options (compact, detailed, minimal) using existing EntityCard props
  - Implement interactive mode with hover actions
  - Add metadata display toggle and action buttons
  - _Requirements: 2.8_

- [ ] 12. Optimize existing MasonryView for Pinterest-style layout
  - Update `src/components/features/file-browser/views/masonry-view.tsx` algorithm
  - Implement proper aspect ratio respect for items using existing item data
  - Add dynamic spacing and sizing based on content
  - Optimize layout algorithm for visual balance
  - Consider using existing true-masonry-view.tsx as reference
  - _Requirements: 2.6_

- [ ] 13. Create ViewConfiguration system
  - Create `src/types/file-browser/view-configuration.ts`
  - Extend existing settings service to include view settings persistence
  - Add view customization UI components
  - Integrate with all existing view components for consistent behavior
  - _Requirements: 2.9_

### Phase 3: Multi-Entity Type Support

- [ ] 14. Create EntityTypeConfig system
  - Create `src/config/entity-type-configs.ts` using existing EntityStatsType enum
  - Define configurations for all EntityStatsType variants already defined in migration.ts
  - Add icons, colors, supported operations for each type
  - Implement thumbnail generators for different file types using existing services
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [ ] 15. Create VideoViewer component
  - Create `src/components/features/file-viewer/viewers/video-viewer.tsx`
  - Implement video playback with controls
  - Add video-specific metadata display using existing VideoWithStats type
  - Support for common video formats (mp4, webm, avi)
  - Integrate with existing video service
  - _Requirements: 3.1, 4.2_

- [ ] 16. Create AudioViewer component
  - Create `src/components/features/file-viewer/viewers/audio-viewer.tsx`
  - Implement audio playback with waveform visualization
  - Add audio metadata display (duration, bitrate, etc.) using existing audio service
  - Support for common audio formats (mp3, wav, flac)
  - _Requirements: 3.2, 4.2_

- [ ] 17. Create DocumentViewer component
  - Create `src/components/features/file-viewer/viewers/document-viewer.tsx`
  - Implement PDF and document preview
  - Add text search and navigation
  - Support for common document formats (pdf, docx, txt) using existing document service
  - _Requirements: 3.3, 4.2_

- [ ] 18. Create GenericFileViewer component
  - Create `src/components/features/file-viewer/viewers/generic-file-viewer.tsx`
  - Implement fallback viewer for unsupported formats
  - Show file metadata and properties using existing file service
  - Add download and external app options
  - _Requirements: 3.7, 4.2_

- [ ] 19. Enhance existing FileViewer with multi-format support
  - Update `src/components/features/file-viewer/file-viewer.tsx` to support multiple formats
  - Add format detection using existing EntityStatsType and file service
  - Implement viewer switching and format-specific controls
  - Add keyboard shortcuts for different file types
  - Integrate with existing useFileViewerStore
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

### Phase 4: File Operations and Progress Tracking

- [ ] 20. Create ProgressTrackingSystem
  - Create `src/services/progress/progress-tracking.service.ts`
  - Add progress tracking for copy, move, delete, download operations using existing file service
  - Implement progress UI components with cancel functionality
  - Add estimated time remaining and throughput calculations
  - Integrate with existing toast service for progress notifications
  - _Requirements: All file operations_

- [ ] 21. Create UndoRedoManager
  - Create `src/services/undo-redo/undo-redo-manager.ts`
  - Implement action history with undo/redo capabilities
  - Add undoable actions for file operations using existing file service methods
  - Create undo/redo UI controls and keyboard shortcuts
  - _Requirements: 1.8, 1.10_

- [ ] 22. Enhance existing file operations with batch support
  - Extend existing `src/services/file/file.service.ts` with batch processing methods
  - Add progress tracking for bulk operations using new ProgressTrackingSystem
  - Implement operation queuing and prioritization
  - Add batch operation UI with progress indicators
  - _Requirements: 1.4_

- [ ] 23. Enhance existing download functionality
  - Update existing download methods in context-action-handler.ts
  - Add progress tracking for download operations
  - Support for different download formats and compression
  - Integrate with browser download manager and existing file service
  - _Requirements: 1.9_

- [ ] 24. Enhance system file explorer integration
  - Update existing "Ver en explorador" implementation in context-action-handler.ts
  - Add system integration for file associations using existing file service
  - Support for opening files in default applications
  - Handle cross-platform differences (Windows, macOS, Linux)
  - _Requirements: 1.12_

### Phase 5: Drag Selection and Advanced Features

- [ ] 25. Implement DragSelectionManager
  - Create `src/services/drag-selection/drag-selection-manager.ts`
  - Add mouse event handling for drag selection
  - Implement selection rectangle calculation and rendering
  - Support for multi-select with Ctrl/Shift modifiers
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 26. Create SelectionOverlay component
  - Create `src/components/features/file-browser/selection/selection-overlay.tsx`
  - Implement visual selection rectangle with animation
  - Add selection feedback and item highlighting
  - Handle selection cancellation and cleanup
  - _Requirements: 7.6, 7.7_

- [ ] 27. Integrate drag selection with FileBrowser
  - Modify FileBrowser component to support drag selection
  - Add drag selection event handlers and state management
  - Integrate with existing selection system (useSelectionStore)
  - Add configuration options for drag selection behavior
  - _Requirements: 7.8_

- [ ] 28. Implement caching strategy
  - Create `src/services/cache/file-browser-cache.service.ts`
  - Add thumbnail caching with LRU eviction
  - Implement metadata caching for performance
  - Add cache configuration and management UI
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 29. Add accessibility improvements
  - Implement ARIA labels and roles throughout components
  - Add keyboard navigation for all interactive elements
  - Implement screen reader announcements for actions
  - Add high contrast and reduced motion support
  - _Requirements: 6.5, 6.6, 6.7, 6.8_

### Phase 6: Settings Integration and Polish

- [ ] 30. Extend existing settings system for FileBrowser
  - Add file browser settings to existing settings schema in `src/transformers/settings/schema.ts`
  - Define comprehensive settings structure using existing settings patterns
  - Add default values and validation using existing validators
  - Integrate with existing settings store and service
  - _Requirements: 2.9_

- [ ] 31. Enhance existing settings persistence
  - Extend existing `src/services/settings/settings.service.ts` with file browser preferences
  - Add settings migration for version updates using existing migration patterns
  - Implement settings import/export functionality using existing serializers
  - Add settings reset to defaults option using existing reset methods
  - _Requirements: 2.9_

- [ ] 32. Create settings UI components
  - Create file browser settings panel components
  - Add real-time preview of setting changes
  - Implement settings validation using existing validators
  - Add settings search and categorization
  - _Requirements: 2.9_

- [ ] 33. Optimize existing view performance for large datasets
  - Enhance existing virtual scrolling in base-virtualized-view.tsx
  - Improve existing thumbnail loading in use-thumbnail-loader.ts
  - Optimize re-render cycles and memoization in existing view components
  - Add performance monitoring and metrics
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

- [ ] 34. Add comprehensive error handling
  - Implement error boundaries for all components
  - Add error recovery strategies and user guidance
  - Create error reporting and logging system using existing logger
  - Add graceful degradation for failed operations
  - _Requirements: All requirements_

### Phase 6.5: UX Improvements and Bug Fixes

- [ ] 34.1. Fix user selection CSS conflicts
  - Audit all file browser components for CSS `user-select` properties
  - Apply `user-select: none` to prevent text selection on interactive elements
  - Ensure accessibility is maintained (screen readers can still access text)
  - Test across different browsers and devices
  - _Requirements: User experience improvement_

- [ ] 34.2. Implement comprehensive click-to-deselect
  - Add empty space click detection to all view components
  - Implement deselection logic using existing useSelectionStore
  - Add visual feedback for deselection action
  - Ensure compatibility with existing drag selection when implemented
  - Test edge cases (clicking on scrollbars, borders, etc.)
  - _Requirements: User experience improvement_

- [ ] 34.3. Fix selection state visual feedback
  - Ensure selected items have clear visual indicators
  - Fix any selection state inconsistencies across views
  - Improve selection feedback for accessibility (focus indicators)
  - Test selection visibility in different themes and contrast modes
  - _Requirements: User experience improvement_

### Phase 7: Testing and Documentation

- [ ] 35. Create unit tests for new and enhanced services
  - Write tests for enhanced FileOperationsService methods
  - Add tests for new ClipboardManager and DragSelectionManager
  - Test new KeyboardShortcutManager functionality
  - Add tests for caching and progress tracking services
  - Use existing testing patterns and infrastructure
  - _Requirements: All service-related requirements_

- [ ] 36. Create integration tests for enhanced components
  - Write tests for enhanced view components (ListView, GridView, CardsView, MasonryView)
  - Add tests for enhanced context menu interactions
  - Test file viewer multi-format support
  - Add tests for drag selection functionality
  - Test integration with existing stores and services
  - _Requirements: All component-related requirements_

- [ ] 37. Add performance tests for enhanced features
  - Create tests for large dataset handling (10,000+ items) using existing virtualization
  - Add memory usage and leak detection tests for new features
  - Test enhanced virtualization performance under stress
  - Add benchmark tests for critical operations
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

- [ ] 38. Create accessibility tests for enhanced features
  - Add automated accessibility testing for new components
  - Test keyboard navigation and screen reader support for enhanced features
  - Validate ARIA labels and semantic markup in new components
  - Test high contrast and reduced motion modes
  - _Requirements: 6.5, 6.6, 6.7, 6.8_

- [ ] 39. Update existing documentation with new features
  - Update existing README.md files in file-browser directory
  - Add developer documentation for new APIs and services
  - Write troubleshooting and FAQ sections for new features
  - Create migration guide for enhanced components
  - _Requirements: All requirements_

- [ ] 40. Final integration and polish
  - Perform end-to-end testing of all enhanced features
  - Fix remaining bugs and edge cases
  - Optimize bundle size and loading performance
  - Add final UI polish and animations using existing motion/react patterns
  - _Requirements: All requirements_

## Task Dependencies

### Critical Path
7.1 → 7.2 (Critical UX fixes - should be done early)
1 → 2 → 5 → 7 (Enhanced context menu and operations)
8 → 9 → 13 (Enhanced list view with existing components)
14 → 15,16,17,18 → 19 (Multi-format support using existing services)
25 → 26 → 27 (Drag selection with existing virtualization)
34.1 → 34.2 → 34.3 (UX improvements and bug fixes)

### Parallel Development Tracks
- **Critical UX Fixes Track**: Tasks 7.1-7.2, 34.1-34.3 (high priority user experience improvements)
- **Context Menu Enhancement Track**: Tasks 1-7 (building on existing context-menu/)
- **View Enhancement Track**: Tasks 8-13 (enhancing existing views/)
- **Multi-Entity Track**: Tasks 14-19 (using existing entity services)
- **Operations Track**: Tasks 20-24 (extending existing file service)
- **Advanced Features Track**: Tasks 25-29 (new features with existing infrastructure)
- **Settings Track**: Tasks 30-33 (extending existing settings system)
- **Quality Track**: Tasks 35-40 (testing and documentation updates)

### Existing Components to Leverage
- **Context Menu System**: Existing `context-menu/` directory with types, handlers, and components
- **View System**: Existing `views/` directory with base-virtualized-view and all view implementations
- **Configuration**: Existing `config/grid-config.ts` for layout configurations
- **Hooks**: Existing `hooks/` directory with filtered data, grid virtualizer, and thumbnail loader
- **Services**: Existing file, settings, and entity services
- **Cards System**: Existing comprehensive card system with entity-card and layout types

## Success Criteria

### Functional Requirements
- ✅ All context menu operations working correctly
- ✅ Enhanced views with metadata display
- ✅ Multi-format file viewer support
- ✅ Drag selection functionality
- ✅ Settings integration and persistence

### Performance Requirements
- ✅ Maintains 60 FPS with 10,000+ items
- ✅ Memory usage stays under 500MB for large datasets
- ✅ Initial load time under 2 seconds
- ✅ Context menu appears within 100ms

### Accessibility Requirements
- ✅ Full keyboard navigation support
- ✅ Screen reader compatibility
- ✅ WCAG 2.1 AA compliance
- ✅ High contrast mode support

### User Experience Requirements
- ✅ Intuitive context menu organization
- ✅ Consistent behavior across all views
- ✅ Clear feedback for all operations
- ✅ Smooth animations and transitions