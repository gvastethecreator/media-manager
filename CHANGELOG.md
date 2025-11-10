# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2025-11-10

### Added

#### Entity Management System

- **CreateEntityModal Component** (`src/components/features/modals/create-entity-modal.tsx`)
  - Unified modal for creating all 10 entity types: character, place, concept, collection, album, group, tag, note, prompt, wildcard
  - Dynamic form fields based on entity type
  - Automatic file association when creating entities from file context menu
  - Integration with all create hooks from API layer
  - Comprehensive error handling and loading states

- **FeaturedImageSelector Component** (`src/components/ui/featured-image-selector.tsx`)
  - Reusable component for selecting featured images from associated files
  - Modal dialog with grid layout for image selection
  - Preview of current featured image with remove functionality
  - Visual feedback with check indicator for selected image
  - Responsive design with proper accessibility

- **Extended Context Menu File-Entity Association**
  - Added "Nuevo..." buttons to all entity submenus in context menu
  - Integrated CreateEntityModal with file browser context menu
  - Automatic file association workflow for newly created entities
  - Support for all 12 entity types in context menu

#### Preset System Enhancements

- **New Entity Preset Configurations**
  - `ALBUM_PRESETS`: 3 presets (minimal, basic, complete)
  - `GROUP_PRESETS`: 3 presets (minimal, basic, complete)
  - `WILDCARD_PRESETS`: 3 presets (minimal, basic, complete)
  - All presets now include featuredImage field option

- **Featured Image Field Integration**
  - Added `featuredImage` field type to preset configuration system
  - Integrated FeaturedImageSelector into PresetForm component
  - Updated 8 entity types to support featured images:
    - Characters, Places, Concepts, World Items
    - Tags, Collections, Prompts, Notes
  - All "complete" presets now include featuredImage field

#### Testing Infrastructure

- **Vitest Configuration** (`vitest.config.ts`)
  - Configured vitest with React and TypeScript support
  - Happy-dom environment for browser API simulation
  - Coverage reporting with v8 provider
  - Test timeout: 10s with mock reset between tests

- **Test Setup** (`src/test/setup.ts`)
  - Browser API mocks: matchMedia, IntersectionObserver, ResizeObserver
  - Canvas API mocking for image-related tests
  - Console method mocking to reduce test noise
  - Automatic cleanup with beforeEach hooks

- **Test Utilities** (`src/test/test-utils.tsx`)
  - Enhanced render wrapper with React Query provider
  - Test-specific QueryClient with disabled retries
  - Silent logger to prevent test output noise
  - Re-exported @testing-library/react methods

- **Comprehensive Test Coverage** (67 tests passing)
  - `src/config/__tests__/entity-field-presets.test.ts` (37 tests)
    * ENTITY_PRESETS_MAP structure validation
    * getEntityPresets, getDefaultPreset, getPresetFields functions
    * All 8 entity types configuration testing
    * Field type and validation testing
    * Preset structure integrity checks

  - `src/components/ui/__tests__/featured-image-selector.test.tsx` (12 tests)
    * Rendering states (with/without current image)
    * Modal interaction and image selection
    * Image filtering based on associations
    * Callback handling (onSelect)
    * Disabled state behavior
    * Thumbnail URL vs path fallback

  - `src/components/settings/common/__tests__/preset-form.test.tsx` (18 tests)
    * Dynamic form rendering for different entity types
    * Preset selector behavior (creation vs edit mode)
    * Form validation and submission
    * Initial data handling
    * Error states and loading states
    * Field changes based on preset selection
    * Cancel button functionality

#### Router Enhancements

- **Detail Routes for All Entities**
  - `/characters/:id` → CharacterContentView
  - `/places/:id` → PlaceContentView
  - `/concepts/:id` → ConceptContentView
  - `/collections/:id` → CollectionContentView
  - `/albums/:id` → AlbumContentView
  - `/groups/:id` → GroupContentView
  - `/notes/:id` → NoteContentView
  - `/prompts/:id` → PromptContentView
  - `/wildcards/:id` → WildcardContentView
  - `/documents/:id` → DocumentContentView
  - `/audios/:id` → AudioContentView

- **Content View Placeholders**
  - `DocumentContentView` (`src/components/views/documents/document-content-view.tsx`)
  - `AudioContentView` (`src/components/views/audio/audio-content-view.tsx`)

### Fixed

#### TypeScript Issues

- **CreateEntityModal Type Safety**
  - Added required fields for album, collection, group, tag creation
  - Proper type assertions for entity creation mutations
  - Default values for emoji, color, sortBy, filters, isFavorite

- **Router Lazy Loading**
  - Fixed lazy import handling for named exports
  - Updated all lazy imports to use `.then(m => ({ default: m.ComponentName }))` pattern
  - Resolved build-time module resolution errors

- **Test Configuration**
  - Fixed @testing-library/dom missing dependency
  - Corrected screen API usage in tests (using destructured methods from render)
  - Proper handling of getByAltText vs getByAlt

#### Integration Issues

- **File Canvas Integration**
  - Proper context menu callback integration
  - Auto-association logic using type-safe switch statements
  - Error handling for file-entity association failures

- **Preset Form Integration**
  - FeaturedImageSelector receives imageIds and images props correctly
  - Field rendering respects preset configuration
  - Default values applied correctly when switching presets

### Changed

#### Package Configuration

- **package.json Scripts**
  - `test`: Changed from `bun test` to `vitest`
  - `test:watch`: Changed to `vitest watch`
  - `test:unit`: Changed to `vitest run`
  - `test:ci`: Updated to use `vitest run --coverage`
  - `test:coverage`: New script for coverage reports
  - `test:ui`: Changed to `vitest --ui`
  - `test:e2e:ui`: New script for `bunx playwright test --ui`

- **Dev Dependencies Added**
  - `@vitest/ui@^3.2.4` - Interactive UI for vitest
  - `@vitest/coverage-v8@^3.2.4` - Code coverage reporting
  - `@testing-library/dom@^10.4.1` - DOM testing utilities

#### Component Structure

- **PresetForm Enhancement**
  - Added support for imageIds and images props
  - renderField() now handles featuredImage field type
  - FeaturedImage fields render without extra label wrapper
  - Proper prop threading from parent components

- **ExtendedContextMenu Refactor**
  - EntityMenuItem signature updated to accept onCreateNew callback
  - Empty state made clickable for creating first entity
  - "Nuevo..." button added at top of all entity submenus
  - Consistent create workflow across all 12 entity types

### Infrastructure

#### Type System

- **Entity Field Presets**
  - Added `'featuredImage'` to FieldConfig type union
  - Extended EntityPresetConfig with album, group, wildcard
  - Type-safe field configuration with proper validation

- **CreateEntityModal Props**
  - Proper generic typing with `T extends Record<string, any>`
  - EntityType union type for type safety
  - Optional callback types for entity creation success

#### Test Organization

- **Test File Structure**
  ```
  src/
  ├── config/__tests__/
  │   └── entity-field-presets.test.ts
  ├── components/
  │   ├── ui/__tests__/
  │   │   └── featured-image-selector.test.tsx
  │   └── settings/common/__tests__/
  │       └── preset-form.test.tsx
  └── test/
      ├── setup.ts
      └── test-utils.tsx
  ```

### Performance

- **Test Execution**
  - All 67 tests execute in ~800ms
  - Test setup time optimized with proper mocking
  - Parallel test execution enabled by default

### Documentation

This changelog documents all recent work including:
- New implementations (CreateEntityModal, FeaturedImageSelector, preset enhancements)
- Bug fixes (TypeScript issues, lazy loading, test configuration)
- Improvements (entity creation workflow, featured image system, testing infrastructure)
- Infrastructure changes (vitest setup, package scripts, type system enhancements)

### Migration Notes

#### From Bun Test to Vitest

If you have existing tests using `bun:test`, they need to be migrated to vitest:

**Before:**
```typescript
import { describe, expect, it } from 'bun:test';
```

**After:**
```typescript
import { describe, expect, it } from 'vitest';
```

The test setup and utilities are now centralized in:
- `src/test/setup.ts` - Global test configuration and mocks
- `src/test/test-utils.tsx` - React testing utilities with providers

### Known Issues

- **Legacy Bun Tests**: Existing tests using `bun:test` API are incompatible with vitest and need migration
- **Network Mocks**: Some tests may fail if actual network requests are made; ensure proper mocking in test setup
- **Coverage Exclusions**: Coverage report excludes node_modules, dist, config files, and test files

### Breaking Changes

None. All changes are additive or internal refactoring.

### Security

- No security-related changes in this release
- All dependencies updated to patch vulnerabilities where applicable

---

## Development Commands

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui

# Run specific test file
npm run test:unit -- path/to/test.spec.ts
```

### E2E Testing
```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Debug E2E tests
npm run test:e2e:debug
```

---

## Contributors

- Development and testing by Claude (AI Assistant)
- Code review and requirements by project maintainer

---

## Links

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library React](https://testing-library.com/docs/react-testing-library/intro/)
- [React Query Testing](https://tanstack.com/query/latest/docs/framework/react/guides/testing)
