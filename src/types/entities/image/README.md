# Image: canonical types and schemas

This module defines the **canonical types** and the Zod schema for the `Image` entity. The types align with the domain model and project rules.

## Structure

```mermaid
graph TD
    ImageBase --> ImageCreateInput
    ImageBase --> ImageUpdateInput
    ImageBase --> ImageComplete
    ImageBase --> ImageExtended
    ImageBase --> ImageFilters
    ImageBase --> ImageSearchOptions
    ImageBase --> ImageSearchResult
    ImageBase --> ImageTransformerOptions
    ImageBase --> ImageMetadata
    ImageBase --> ImageStatsBase
    ImageBase --> ImageVisualConfigBase
    ImageBase --> ImageAIMetadata
    ImageBase --> CreateImageData
    ImageBase --> UpdateImageData
    ImageBase --> ImageSchema
```

The module uses these types:

- `ImageBase`: Canonical type aligned with the database.
- `ImageComplete`, `ImageExtended`: Types enriched for relations and UI.
- `ImageCreateInput`, `ImageUpdateInput`: Inputs for mutations.
- `ImageSchema`: Zod schema for validation.

## Migration notes

- **Legacy removed:** Only canonical types are exported.
- **Validate with ImageSchema before you persist.**

## Usage example

```ts
import type { ImageBase, ImageCreateInput } from '@/types/entities/image';
import { ImageSchema } from '@/types/entities/image/types';

const created: ImageCreateInput = {
	name: 'Photo',
	path: '/photos/1.jpg',
	hash: 'abc',
	size: 123,
	width: 800,
	height: 600,
	folder: { id: 'f1' },
	sortBy: 'name',
	filters: '',
};
const validated = ImageSchema.parse(created);
```

---

> Last update: 2025-06-18
> Owner: migration and cleanup of canonical types
