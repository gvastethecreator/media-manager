# Card system - Media Manager

## Current status: 20/20 complete (100%)

This directory contains all implemented entity cards.

The cards follow the **TCG (Trading Card Game)** pattern with advanced visual effects and features specific to each entity type.

---

## System architecture

### Dispatcher component

The dispatcher has the following roles:

- **`entity-card.tsx`**: Main router that selects the correct card from `entityType`
- **Complete mapping**: All 20 entities are mapped correctly

### TCG design pattern

All cards follow a consistent design inspired by game cards.

The design includes the following elements:

- Holographic effects on hover
- Dynamic gradients based on type or format
- Fluid animations with motion/react
- Favorite indicators with a gold glow
- Visual statistics in card format

---

## Completed entities (20/20)

### Main entities (15/15)

#### 1. ImageCard - `image-card/`

- **Features**: Image preview, EXIF metadata, zoom
- **Effects**: Holographic glow, smooth transitions
- **Status**: Excellent - complete implementation

#### 2. VideoCard - `video-card/`

- **Features**: Integrated player, controls, duration
- **Effects**: Playback waves, status indicators
- **Status**: Excellent - functional player

#### 3. AlbumCard - `album-card/`

- **Features**: Recent image grid, statistics
- **Effects**: Dynamic mosaic, animated counters
- **Status**: Excellent - Collection view

#### 4. CollectionCard - `collection-card/`

- **Features**: Content preview, metadata
- **Effects**: Gradients by category, animations
- **Status**: Excellent - visual organization

#### 5. CharacterCard - `character-card/`

- **Features**: Avatar, TCG statistics, rarity
- **Effects**: Rarity effects, special glow
- **Status**: Excellent - advanced TCG design

#### 6. ConceptCard - `concept-card/`

- **Features**: Idea visualization, relations
- **Effects**: Animated connections, mind maps
- **Status**: Excellent - visual creativity

#### 7. NoteCard - `note-card/`

- **Features**: Content preview, markdown
- **Effects**: Vintage paper, elegant typography
- **Status**: Excellent - notebook style

#### 8. PromptCard - `prompt-card/`

- **Features**: Prompt text, tokens, category
- **Effects**: AI effects, futuristic gradients
- **Status**: Excellent - AI/ML theme

#### 9. FolderCard - `folder-card/`

- **Features**: Content, hierarchy, navigation
- **Effects**: Animated opening, visual depth
- **Status**: Excellent - intuitive navigation

#### 10. GroupCard - `group-card/`

- **Features**: Members, group statistics
- **Effects**: Visual clustering, connections
- **Status**: Excellent - social organization

#### 11. WorldItemCard - `world-item-card/`

- **Features**: 3D objects, physical properties
- **Effects**: 3D rotation, materials
- **Status**: Excellent - 3D immersion

#### 12. PlaceCard - `place-card/`

- **Features**: Location, coordinates, map
- **Effects**: Animated pin, geographic zoom
- **Status**: Excellent - geolocation

#### 13. WildcardCard - `wildcard-card/`

- **Features**: Dynamic and adaptive content
- **Effects**: Morphing, visual adaptation
- **Status**: Excellent - full flexibility

#### 14. TagCard - `tag-card/`

- **Features**: Tags, categorization, colors
- **Effects**: Bubble effects, grouping
- **Status**: Excellent - Tag system

#### 15. PropertyCard - `property-card/`

- **Features**: Key-value properties, types
- **Effects**: Visual validation, dynamic types
- **Status**: Excellent - structured metadata

### Media entities (5/5)

#### 16. AudioCard - `audio-card/` (new)

- **Features**: Integrated player, waveform, controls
- **Effects**: Sound waves, audio visualization
- **Formats**: MP3, WAV, FLAC, OGG, M4A
- **Status**: Excellent - complete player

#### 17. DocumentCard - `document-card/` (new)

- **Features**: Preview, metadata, actions
- **Effects**: Colors by format, page indicators
- **Formats**: PDF, DOC, DOCX, TXT, MD
- **Status**: Excellent - document management

#### 18. JsonFileCard - `json-file-card/` (new)

- **Features**: JSON preview, validation, statistics
- **Effects**: Validity indicators, syntax highlighting
- **Functions**: Integrated parser, key count
- **Status**: Excellent - data handling

#### 19. File3DCard - `file3d-card/` (new)

- **Features**: 3D viewer, rotation, complexity
- **Effects**: Automatic rotation, gradients by format
- **Formats**: GLB, GLTF, OBJ, FBX, DAE, PLY, 3DS
- **Status**: Excellent - 3D visualization

#### 20. UploadedImageCard - `uploaded-image-card/` (new)

- **Features**: Preview, processing, metadata
- **Effects**: Processing states, indicators
- **Functions**: Hash, dimensions, categorization
- **Status**: Excellent - upload management

---

## Technical features

### Implemented TCG effects

The cards implement the following TCG effects:

- Dynamic gradients by type or format
- Holographic effects on hover
- Fluid animations with motion/react
- Gold glow for Favorites
- Thematic progress bars
- Visual status indicators
- Smooth transitions between states

### Advanced features

The cards provide the following advanced features:

- Integrated players (Audio, Video)
- Specialized viewers (3D, JSON, images)
- Real-time validation (JSON, documents)
- Dynamic metadata by type
- Contextual actions by entity
- Optimized loading states
- Elegant error management

### Performance optimizations

The cards use the following optimizations:

- Lazy loading of content
- Memoization of expensive calculations
- Optimized callbacks with useCallback
- Scroll states for virtualization
- Conditional resource loading

---

## Next steps

### Pending view components

The following work is pending:

1. Audit view components (`src/components/views/`)
2. Verify integration with the new cards
3. Optimize performance in large views
4. Document usage patterns

### Future improvements

The following improvements are planned:

- User-customizable themes
- More advanced rarity effects
- AI integration for recommendations
- Full-screen presentation mode

---

## Code conventions

### File structure

```
cards/
├── entity-card.tsx          # Main dispatcher
├── [entity]-card/
│   ├── [entity]-card.tsx    # Main component
│   ├── [entity]-card-*.tsx  # Subcomponents (optional)
│   └── README.md            # Specific documentation
└── README.md                # This file
```

### Standard props

```typescript
interface EntityCardProps {
	[entity]: EntityWithStats; // Entity data
	compact?: boolean; // Compact mode
	tcgMode?: boolean; // TCG effects
	disabled?: boolean; // Disable
	className?: string; // Custom CSS
	onClick?: () => void; // Click handler
	isSelected?: boolean; // Selected state
	isActive?: boolean; // Active state
	isScrolling?: boolean; // Scroll optimization
	shouldLoad?: boolean; // Conditional load
}
```

---

## Completed achievements

The following work is complete:

- 20/20 entities implemented
- Consistent TCG pattern
- Functional complete dispatcher
- Advanced effects on all cards
- Performance optimizations
- Complete documentation
- Safe types with TypeScript
- Basic accessibility implemented

**Card system complete at 100%**
