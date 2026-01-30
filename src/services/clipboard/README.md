# ClipboardManager Service

## Overview

The ClipboardManager service provides comprehensive clipboard functionality with system integration for the file browser improvements. It supports multiple file formats, metadata handling, and seamless integration with the system clipboard.

## Features

### Core Functionality
- ✅ **Copy/Cut Operations**: Support for copying and cutting multiple file entities
- ✅ **System Clipboard Integration**: Automatic integration with browser clipboard API
- ✅ **Multiple Format Support**: Text, HTML, JSON, URI list, and image formats
- ✅ **Metadata Handling**: Rich metadata for clipboard operations
- ✅ **Validation**: Comprehensive validation for clipboard operations
- ✅ **Error Handling**: Robust error handling with graceful degradation

### Supported Formats
- `text/plain` - File paths and names as plain text
- `text/html` - Rich HTML representation with metadata
- `application/json` - Complete clipboard data as JSON
- `text/uri-list` - File URIs for system integration
- `image/png` - Image data for single image items (within size limits)

### Integration Points
- **Toast Service**: User feedback for all operations
- **File Service**: Integration with existing file operations
- **Entity System**: Works with `AnyEntityWithStats` types
- **Logger**: Comprehensive logging for debugging

## Usage

### Basic Operations

```typescript
import { clipboardManager } from '@/services/clipboard';

// Copy items to clipboard
await clipboardManager.copy(selectedItems, 'file-browser');

// Cut items to clipboard
await clipboardManager.cut(selectedItems, 'file-browser');

// Check if paste is available
const canPaste = clipboardManager.canPaste();

// Get clipboard data
const clipboardData = clipboardManager.getClipboardData();

// Clear clipboard
clipboardManager.clear();
```

### Advanced Usage

```typescript
// Get clipboard data in specific format
const textData = await clipboardManager.getClipboardDataInFormat(ClipboardFormat.TEXT);
const htmlData = await clipboardManager.getClipboardDataInFormat(ClipboardFormat.HTML);

// Validate clipboard state
const validation = clipboardManager.validateClipboard();
if (validation.isValid) {
  // Proceed with operation
}

// Configure system clipboard options
clipboardManager.updateSystemClipboardOptions({
  includeImages: false,
  maxImageSize: 5 * 1024 * 1024, // 5MB
});
```

## Configuration

### System Clipboard Options

```typescript
interface SystemClipboardOptions {
  includeText: boolean;      // Include file paths as text
  includeHtml: boolean;      // Include HTML representation
  includeImages: boolean;    // Include images as data URLs
  includeUris: boolean;      // Include file URIs
  maxImageSize: number;      // Maximum image size for clipboard (bytes)
}
```

### Default Configuration
- `includeText`: `true`
- `includeHtml`: `true`
- `includeImages`: `true`
- `includeUris`: `true`
- `maxImageSize`: `10MB`

## Data Structures

### ClipboardData
```typescript
interface ClipboardData {
  items: AnyEntityWithStats[];     // Items being copied/cut
  operation: 'copy' | 'cut';       // Operation type
  timestamp: number;               // When operation was performed
  source: string;                  // Source context
  formats: ClipboardFormat[];      // Supported formats
  metadata: {
    totalSize: number;             // Total size of all items
    fileTypes: FileType[];         // File types present
    canPasteToFileSystem: boolean; // Can paste to file system
    canPasteToSystem: boolean;     // Can paste to other applications
  };
}
```

### ClipboardValidation
```typescript
interface ClipboardValidation {
  isValid: boolean;                        // Whether clipboard data is valid
  errors: string[];                        // Validation errors
  warnings: string[];                      // Warnings
  supportedOperations: ('copy' | 'cut' | 'paste')[]; // Supported operations
}
```

## Error Handling

The ClipboardManager includes comprehensive error handling:

- **Validation Errors**: Items without required properties (id, path, name)
- **Operation Errors**: Readonly items in cut operations
- **Size Warnings**: Items exceeding recommended clipboard limits
- **System Integration**: Graceful degradation when system clipboard is unavailable

## Browser Compatibility

### System Clipboard Integration
- **Modern Browsers**: Full support with Clipboard API
- **Legacy Browsers**: Graceful degradation to internal clipboard only
- **Security**: Respects browser security policies for clipboard access

### Supported Operations by Browser
- **Chrome/Edge 76+**: Full clipboard API support
- **Firefox 87+**: Full clipboard API support
- **Safari 13.1+**: Full clipboard API support
- **Older Browsers**: Internal clipboard only

## Performance Considerations

### Memory Management
- Automatic cleanup of clipboard data
- Size limits for image data (configurable)
- Efficient format generation (on-demand)

### System Integration
- Asynchronous clipboard operations
- Non-blocking system clipboard writes
- Fallback to internal clipboard on errors

## Testing

The ClipboardManager includes comprehensive tests covering:

- ✅ Basic copy/cut operations
- ✅ System clipboard integration
- ✅ Format generation (text, HTML, JSON, URI)
- ✅ Validation logic
- ✅ Error handling scenarios
- ✅ Configuration management
- ✅ Metadata generation

Run tests with:
```bash
npx vitest run src/services/clipboard/clipboard-manager.test.ts
```

## Integration with File Browser

The ClipboardManager is designed to integrate seamlessly with the file browser improvements:

1. **Context Menu Integration**: Used by enhanced context menus for copy/cut/paste operations
2. **Keyboard Shortcuts**: Supports Ctrl+C, Ctrl+X, Ctrl+V shortcuts
3. **Drag and Drop**: Can be extended to support drag and drop operations
4. **Multi-Selection**: Handles multiple selected items efficiently

## Future Enhancements

Potential future improvements:
- **Drag and Drop Integration**: Support for drag and drop clipboard operations
- **Cloud Clipboard**: Integration with cloud clipboard services
- **Advanced Formats**: Support for additional clipboard formats
- **Undo/Redo**: Integration with undo/redo system
- **Progress Tracking**: Progress indicators for large clipboard operations

## Dependencies

- `@/lib/logger/server-logger` - Logging functionality
- `@/services/toast` - User notifications
- `@/services/file/file.service` - File operations
- `@/types/migration` - Entity type definitions
- `@/types/entities/file` - File type definitions

## License

This service is part of the image-manager project and follows the same license terms.