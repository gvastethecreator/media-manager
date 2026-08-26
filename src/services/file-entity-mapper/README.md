# File Entity Mapper service

This modular service maps physical files to database entities in 3 optimized stages.

## Structure

```
src/services/file-entity-mapper/
├── file-entity-mapper.service.ts        # Public API (legacy wrapper)
├── core.service.ts                      # Main orchestrator
├── index.ts                             # Barrel exports
│
├── processors/                          # Specialized processors
│   ├── image.processor.ts              # Images (EXIF/IPTC/XMP/AI)
│   ├── video.processor.ts              # Videos (ffprobe + animated WebP)
│   ├── audio.processor.ts              # Audio (ID3 tags + waveform)
│   ├── document.processor.ts           # Documents (PDF/MD/TXT)
│   ├── file3d.processor.ts             # 3D models (GLTF/GLB/OBJ)
│   └── json.processor.ts               # JSON files (validation)
│
└── utils/                               # Shared utilities
    ├── hash.utils.ts                   # SHA-256 + LRU cache
    ├── metrics.utils.ts                # Performance tracking
    └── file-info.utils.ts              # Type/MIME mapping
```

## Basic use

### Legacy API (keeps compatibility)

```typescript
import { FileEntityMapperService } from '@/services/file-entity-mapper';

const mapper = FileEntityMapperService.getInstance();

// Process one file
const result = await mapper.createEntityFromFile('/path/to/image.jpg', 'folder-id');
console.log(result); // { success: true, entityType: 'image', entityId: 'uuid' }

// Process multiple files
const stats = await mapper.processFiles(
	['/path/to/image1.jpg', '/path/to/video.mp4', '/path/to/document.pdf'],
	'folder-id'
);
console.log(stats); // { totalFiles: 3, successful: 3, failed: 0, ... }
```

### New API (recommended for new code)

```typescript
import { FileEntityMapperCore } from '@/services/file-entity-mapper';

const core = FileEntityMapperCore.getInstance();

// Same API, modern architecture
await core.createEntityFromFile(filePath, folderId);
await core.processFiles(filePaths, folderId);
```

### Advanced use (individual processors)

```typescript
import { ImageProcessor } from '@/services/file-entity-mapper';

const processor = new ImageProcessor();

// Check whether it exists
const exists = await processor.checkExists(hash);

// Create a basic entity
const entityId = await processor.createBasicEntity(fileInfo);

// Extract metadata
await processor.extractMetadata(filePath, entityId);

// Generate a thumbnail
await processor.generateThumbnail(filePath, entityId);
```

## Processing flow

### 3 optimized stages

```
┌─────────────────────────────────────────────────────────┐
│  STAGE 1: Basic creation                                │
│  - Fast pre-check (stat + extension)                    │
│  - Size validation (skip before hash)                   │
│  - SHA-256 hash calculation (with LRU cache)            │
│  - Duplicate check                                      │
│  - Basic creation in the DB (no metadata)               │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│  STAGE 2: Metadata extraction                           │
│  - Dispatch to the specialized processor                │
│  - Image: EXIF/IPTC/XMP/AI metadata                     │
│  - Video: ffprobe (duration, resolution, codec)         │
│  - Audio: ID3 tags (title, artist, album)               │
│  - Document: pages, words, frontmatter                  │
│  - 3D: parse of vertices, faces, materials              │
│  - JSON: validation, depth, type                        │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│  STAGE 3: Thumbnail generation                          │
│  - Image: JPEG 320px (base64 in metadata)               │
│  - Video: Animated WebP 12 frames (dedicated column)    │
│  - Audio: SVG waveform                                  │
│  - Document: SVG preview                                │
│  - 3D: SVG placeholder                                  │
│  - JSON: SVG content preview                            │
└─────────────────────────────────────────────────────────┘
```

## Main features

### Optimized performance

The mapper uses the following performance techniques:

- **Early skip**: Size validation BEFORE an expensive hash
- **LRU cache**: Hash reused if mtime/size do not change
- **Concurrency queue**: Parallel processing (4 workers by default)
- **Basic serialization**: Deterministic order in tests

### Modularity

The mapper uses the following modular design:

- **Specialized processors**: One processor per media type
- **Single responsibility**: Each module has a clear responsibility
- **Easy extension**: Add a new type as a new processor

### Observability

The mapper provides the following observability:

- **Granular metrics**: By phase and by entity type
- **JSONL logs**: `logs/metrics-media.jsonl`
- **Error tracking**: Detailed errors per file

### Compatibility

The mapper keeps the following compatibility:

- **Preserved legacy API**: Zero breaking changes
- **Gradual migration**: Existing code works without changes
- **New API available**: For new code

## Supported entity types

| Type         | Extensions                                 | Processor         |
| ------------ | ------------------------------------------ | ----------------- |
| **Image**    | .jpg, .jpeg, .png, .gif, .webp, .bmp, .svg | ImageProcessor    |
| **Video**    | .mp4, .avi, .mov, .mkv, .webm, .flv        | VideoProcessor    |
| **Audio**    | .mp3, .wav, .ogg, .m4a, .flac, .aac        | AudioProcessor    |
| **Document** | .pdf, .doc, .docx, .txt, .md, .rtf         | DocumentProcessor |
| **3D Model** | .gltf, .glb, .obj, .stl                    | File3DProcessor   |
| **JSON**     | .json                                      | JsonProcessor     |

## Utilities

### Hash utils

```typescript
import { calculateFileHash, clearHashCache } from '@/services/file-entity-mapper';

const hash = await calculateFileHash('/path/to/file');
clearHashCache(); // For tests
```

### File info utils

```typescript
import { getEntityTypeFromExtension, getMimeTypeFromExtension } from '@/services/file-entity-mapper';

const type = getEntityTypeFromExtension('.jpg'); // 'image'
const mime = getMimeTypeFromExtension('.jpg'); // 'image/jpeg'
```

### Metrics collector

```typescript
import { MetricsCollector } from '@/services/file-entity-mapper';

const metrics = new MetricsCollector();
const t0 = Date.now();
// ... operation ...
metrics.recordPhase('operation', t0);
await metrics.flushMetrics(); // Writes to logs/metrics-media.jsonl
```

## Testing

### Processor mock

```typescript
import { vi } from 'vitest';
import type { ImageProcessor } from '@/services/file-entity-mapper';

const mockProcessor = {
	checkExists: vi.fn().mockResolvedValue(false),
	createBasicEntity: vi.fn().mockResolvedValue('entity-id'),
	extractMetadata: vi.fn().mockResolvedValue({ success: true }),
	generateThumbnail: vi.fn().mockResolvedValue({ success: true }),
};
```

### Utility test

```typescript
import { describe, it, expect } from 'vitest';
import { calculateFileHash } from '@/services/file-entity-mapper';

describe('Hash Utils', () => {
	it('should calculate SHA-256 hash', async () => {
		const hash = await calculateFileHash('/path/to/test.jpg');
		expect(hash).toMatch(/^[a-f0-9]{64}$/);
	});
});
```

## Metrics and logging

### Metrics format

```json
{
	"ts": "2025-10-02T02:30:00.000Z",
	"phases": {
		"basic": [120, 95, 110],
		"metadata_image": [450, 480, 430],
		"metadata_video": [1200, 1150, 1180],
		"thumbnail": [350, 320, 340]
	}
}
```

### Performance analysis

```bash
# View metrics
cat logs/metrics-media.jsonl | jq '.phases'

# Calculate average per phase
cat logs/metrics-media.jsonl | jq '.phases.metadata_image | add/length'
```

## References

The mapper references the following documents:

- **Complete documentation**: `docs/REFACTOR-FILE-ENTITY-MAPPER-2025-10-02.md`
- **Refactor plan**: `docs/REFACTOR-ANALYSIS.md`
- **Legacy code**: `file-entity-mapper.service.legacy.ts`

## Roadmap

The following work is planned:

- [ ] Migrate existing tests to individual processors
- [ ] Add unit tests per processor
- [ ] Optimize metadata cache (Redis for prod)
- [ ] Add advanced telemetry
- [ ] Support for more file types (Epub, CBZ)
- [ ] Asynchronous thumbnail generation in worker threads
- [ ] Metadata extraction with configurable priority

---

**Last update**: October 2, 2025
**Version**: 2.0.0 (Modular)
**Total lines**: ~1,500 lines (before: 1,266 in one file)
**Files**: 11 specialized modules
**Breaking changes**: Zero
