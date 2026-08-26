# File viewer system

This system displays files and supports multiple entity types.

## Implemented components

### 1. MultiEntityViewer

**File:** `multi-entity-viewer.tsx`

This main viewer chooses the specific viewer from the entity type.

**Features:**

The viewer provides the following features:

- Support for multiple entity types
- Keyboard navigation (arrows, ESC)
- Smooth transitions between viewers
- Integration with the EntityStatsType type system

**Use:**

```tsx
import { MultiEntityViewer } from '@/components/features/file-viewer/multi-entity-viewer';

<MultiEntityViewer
	entities={entities}
	currentIndex={currentIndex}
	isOpen={isOpen}
	onClose={onClose}
	onIndexChange={onIndexChange}
/>;
```

### 2. VideoViewer

**File:** `viewers/video-viewer.tsx`

This specialized viewer displays video files.

**Features:**

The viewer provides the following features:

- Playback controls (play/pause, seek, volume)
- Full screen
- Metadata information (duration, resolution, codec)
- Navigation between videos
- File download

### 3. AudioViewer

**File:** `viewers/audio-viewer.tsx`

This specialized viewer displays audio files.

**Features:**

The viewer provides the following features:

- Audio playback controls
- Waveform display (placeholder)
- Metadata information (artist, album, duration, bitrate)
- Playlist
- Volume controls

### 4. DocumentViewer

**File:** `viewers/document-viewer.tsx`

This viewer displays PDF documents and text files.

**Features:**

The viewer provides the following features:

- PDF preview with iframe
- Page navigation
- Zoom and rotation controls
- Document search
- Support for text files
- Metadata information (pages, words, author)

### 5. GenericFileViewer

**File:** `viewers/generic-file-viewer.tsx`

This generic viewer displays unspecified file types.

**Features:**

The viewer provides the following features:

- Automatic file categorization
- Content preview for small text files
- Specific icons by file type
- Detailed metadata information
- Download and external-open options

## Supported file types

### Images

The image path uses the existing `FileViewer`.

Formats: JPG, PNG, GIF, WebP, SVG.

### Videos

Formats: MP4, WebM, AVI, MOV.

The viewer uses native browser controls.

### Audio

Formats: MP3, WAV, FLAC, AAC, OGG.

The viewer uses custom audio controls.

### Documents

- PDFs: Preview with iframe
- Text: TXT, MD, JSON, XML, CSV
- Office: DOC, DOCX, XLS, XLSX, PPT, PPTX (download or external open)

### Generic files

- Code: JS, TS, Python, Java
- Archives: ZIP, RAR, 7Z
- Data: JSON, XML, CSV, SQL
- Executables: EXE, MSI, DMG

## Integration with EntityStatsType

The system is fully integrated with the `EntityStatsType` enum:

```typescript
switch (entity.type) {
  case EntityStatsType.IMAGE:
    return <FileViewer />;
  case EntityStatsType.VIDEO:
    return <VideoViewer />;
  case EntityStatsType.AUDIO:
    return <AudioViewer />;
  case EntityStatsType.DOCUMENT:
    return <DocumentViewer />;
  default:
    return <GenericFileViewer />;
}
```

## Navigation and controls

### Keyboard

The viewer uses the following keys:

- `←` / `→`: Navigate between files
- `ESC`: Close the viewer
- `Space`: Play/Pause (video/audio)
- `+` / `-`: Zoom (documents/images)
- `R`: Reset view (images)

### Mouse

The viewer uses the following mouse actions:

- Click outside the content: Close
- Mouse wheel: Zoom (where it applies)
- Double click: Reset view (images)

## File structure

```
file-viewer/
├── file-viewer.tsx              # Original viewer for images
├── multi-entity-viewer.tsx      # Main multi-type viewer
├── README.md                     # This documentation
└── viewers/
    ├── video-viewer.tsx          # Video viewer
    ├── audio-viewer.tsx          # Audio viewer
    ├── document-viewer.tsx       # Document viewer
    └── generic-file-viewer.tsx   # Generic viewer
```

## Planned improvements

The following improvements are planned:

1. **3D viewer**: For `.obj`, `.fbx`, `.gltf` files
2. **Code viewer**: Syntax highlighting for code files
3. **Archive viewer**: Explorer for compressed files
4. **Accessibility improvements**: Better support for screen readers
5. **Thumbnails**: Automatic thumbnail generation
6. **Streaming**: Support for large files

## Dependencies

The system depends on the following packages:

- `motion`: Animations and transitions
- `lucide-react`: Icons
- UI components: `Button`, `Badge`, `Input`, `Textarea`
- System entity types

## Implementation notes

All viewers follow the same props pattern.

Error handling and loading states stay consistent.

Responsive design is the default.

The viewers support light and dark themes.

Performance optimization uses lazy loading.
