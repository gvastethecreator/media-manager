# 📊 Phase 6: Remaining Services Migration - Plan Detallado

**Fecha:** 11 de octubre de 2025  
**Duración estimada:** 4-6 días  
**Prerequisitos:** Phase 5 completada (CollectionService + 6 issues resueltos)  
**Objetivo:** Migrar servicios restantes aplicando lessons learned

---

## 🎯 Estado Actual

### ✅ Servicios Migrados (4/40+)
1. **TagService** (Phase 1) - 599 lines, 20 tests ✅
2. **AlbumService** (Phase 3) - 722 lines, 20 tests ✅
3. **FolderService** (Phase 4) - 670 lines, 36 tests ✅
4. **CollectionService** (Phase 5) - 678 lines, 45 tests ✅

**Total migrado:** ~2,669 service lines + ~2,300 test lines = **4,969 lines**

### 🔧 Servicios Pendientes Identificados

#### Categoría A: Entidades Core (Alta Prioridad)
```
1. image/          → CRUD + thumbnails + metadata + relations (CRÍTICO)
2. video/          → CRUD + thumbnails + metadata + relations
3. audio/          → CRUD + metadata + waveform
4. document/       → CRUD + metadata + preview
5. file3d/         → CRUD + metadata + preview
6. json-file/      → CRUD + metadata + validation
```

#### Categoría B: Organizacionales (Media Prioridad)
```
7. group/          → CRUD + relations + stats
8. profile/        → CRUD + preferences + stats
9. property/       → CRUD + entity relations
10. favorite/      → Cross-entity favorites (shared logic)
```

#### Categoría C: Worldbuilding (Media-Baja Prioridad)
```
11. character/     → CRUD + relations + media
12. place/         → CRUD + relations + media
13. concept/       → CRUD + relations + media
14. note/          → CRUD + relations + media
15. prompt/        → CRUD + relations + images
16. wildcard/      → CRUD + generation logic
17. world-item/    → CRUD + relations
```

#### Categoría D: Sistema (Baja Prioridad)
```
18. activity/      → Logging + analytics
19. settings/      → Configuration management
20. metadata/      → Metadata aggregation
21. queue-job/     → Background jobs
22. task/          → Task management
23. stats/         → Statistics aggregation
```

#### Categoría E: Infraestructura (Último)
```
24. cache/         → Caching layer
25. clipboard/     → Clipboard operations
26. download/      → Download manager
27. drag-selection/→ UI state management
28. file/          → File system operations
29. folder-files/  → Aggregated folder queries
30. progress/      → Progress tracking
31. thumbnail/     → Thumbnail generation
32. thumbnail-config/ → Thumbnail configuration
33. thumbnails/    → Thumbnail management
34. toast/         → Toast notifications
35. undo-redo/     → Undo/redo stack
36. uploaded-images/ → Image upload handling
37. file-entity-mapper/ → File to entity mapping
38. folders/       → Folder utilities (possibly duplicate)
39. metadata-integration.service.ts → Metadata integration
```

---

## 🎯 Phase 6 Strategy

### Approach: Incremental, High-Value First

**Rationale:**
- Focus on **high-impact services** that unlock other features
- Apply **Phase 5 lessons learned** immediately
- Build momentum with **quick wins** first
- Save complex/low-priority services for later phases

### Phase 6 Scope (Realistic)

**Target:** Migrate **6 services** from Category A + B

```
Phase 6A (Core Media - 3 services):
1. ImageService      → Foundation for media operations
2. VideoService      → Similar patterns to Image
3. AudioService      → Similar patterns to Image

Phase 6B (Organizational - 3 services):
4. GroupService      → Organizational hierarchy
5. ProfileService    → User preferences
6. PropertyService   → Metadata properties
```

**Estimated Duration:** 4-6 days (1 day per service average)

**Deferred to Phase 7+:**
- Worldbuilding entities (11 services)
- System services (6 services)
- Infrastructure services (15 services)

---

## 📋 Phase 6 Lessons Learned (from Phase 5)

### Critical Patterns to Apply

#### 1. Schema Design
```typescript
// ✅ USE Schema.String for UUID fields (not Schema.ID)
export class Entity extends Schema.Class<Entity>('Entity')({
  id: Schema.String, // Accepts crypto.randomUUID()
  parentId: Schema.NullOr(Schema.String),
}) {}

// ❌ AVOID Schema.ID (too strict pattern validation)
export const ID = Schema.String.pipe(
  Schema.pattern(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
);
```

#### 2. Database Constraints Documentation
```typescript
/**
 * Creates test image with all required constraints:
 * 
 * CONSTRAINTS:
 * - folderId: NOT NULL (requires folder creation first)
 * - hash: CHECK length(hash) = 64 (SHA-256 format)
 * - entityType: CHECK IN ('image', 'video', ...)
 * - UNIQUE (hash)
 * 
 * FOREIGN KEYS:
 * - folderId → folders(id) ON DELETE CASCADE
 * - presetId → presets(id) ON DELETE SET NULL
 */
async function createTestImage(): Promise<Image> {
  // 1. Satisfy NOT NULL constraints (create dependencies first)
  const folder = await createTestFolder();
  
  // 2. Generate valid constraint data (64-char hash)
  const validHash = Date.now().toString().padStart(64, '0');
  
  // 3. Create entity with all constraints satisfied
  return await db.insert(images).values({
    folderId: folder.id,
    hash: validHash,
    // ...
  });
}
```

#### 3. Effect Error Handling
```typescript
// ✅ CORRECT: Typed error + catchTag recovery
const result = yield* Effect.tryPromise({
  try: async () => {
    await db.insert(imageCollections).values({
      A: imageId,
      B: collectionId,
    });
    return true;
  },
  catch: (error) => new CollectionDatabaseError({
    operation: 'addImages',
    originalError: error,
  }),
}).pipe(
  Effect.catchTag('CollectionDatabaseError', () => Effect.succeed(false))
);

// ❌ WRONG: Returning falsy value
const result = yield* Effect.tryPromise({
  try: async () => { /* ... */ },
  catch: () => false // Causes FiberFailure!
});
```

#### 4. Explicit Error Types
```typescript
// ✅ CORRECT: Explicit error type in catch handler
yield* Effect.tryPromise({
  try: async () => await db.query.images.findMany(),
  catch: (error) => new ImageDatabaseError({
    operation: 'getAll',
    originalError: error,
  })
});
// Type: Effect<Image[], ImageDatabaseError, never>

// ❌ WRONG: Implicit unknown type
yield* Effect.tryPromise({
  try: async () => await db.query.images.findMany(),
  catch: (error) => /* no explicit type */
});
// Type: Effect<Image[], unknown, unknown>
// TypeScript error: "El tipo 'unknown' no se puede asignar al tipo 'ImageError'"
```

#### 5. Test Data Realism
```typescript
// ✅ CORRECT: Realistic test data matching constraints
const validHash = crypto.createHash('sha256')
  .update(`test-${Date.now()}`)
  .digest('hex'); // Real SHA-256: "a3f4b2c1d5e6..."

const [image] = await db.insert(images).values({
  hash: validHash, // 64 chars
  width: 1920,
  height: 1080,
  size: 1024 * 1024, // 1MB
  format: 'jpg',
  // ...
});

// ❌ WRONG: Dummy data violating constraints
const [image] = await db.insert(images).values({
  hash: `hash-${Date.now()}`, // Only 20 chars → CHECK fails
  width: 100,
  height: 100,
  size: 100,
  format: 'image', // Invalid format
  // ...
});
```

#### 6. Systematic Error Analysis
```typescript
// When tests fail, analyze ERROR PATTERNS not individual failures

// Example from Phase 5:
// Run 1: 8/45 pass (17.8%)
//   → 28 failures: "Expected ID, actual ..." → Schema.ID issue
//   → 8 failures: "NOT NULL constraint failed: images.folderId" → Missing folder
//   → 1 failure: "Expected ID, actual ..." (parentId) → Schema.ID issue

// Fix strategy:
// 1. Group by error signature
// 2. Fix highest impact first (Schema.ID: 28 failures)
// 3. Re-run to discover hidden issues
// 4. Repeat until 100% pass
```

---

## 📊 Phase 6A: Core Media Services

### Service 1: ImageService

**Priority:** 🔴 CRITICAL (blocks media features)

**Current State Analysis:**
```typescript
// src/services/image/image.service.ts
// - Singleton class pattern
// - 2,000+ lines (large refactor needed)
// - CRUD operations
// - Thumbnail generation
// - Metadata extraction (EXIF, IPTC, XMP)
// - Relations (albums, collections, tags, folders)
// - Stats aggregation
// - Favorite toggling
```

**Complexity:** HIGH
- Large codebase (~2,000 lines)
- Multiple dependencies (sharp, exifr, metadata services)
- Thumbnail generation logic
- EXIF/IPTC/XMP metadata extraction
- Relations with 5+ entities (albums, collections, tags, folders, properties)

**Estimated Duration:** 1.5-2 days

**Approach:**
1. **Phase 6A.1:** Error types (6-8 classes)
2. **Phase 6A.2:** Service implementation (split into modules)
   - Core CRUD (create, get, update, delete)
   - Relations (albums, collections, tags)
   - Stats (counts, aggregations)
   - Metadata (EXIF extraction, thumbnail generation)
3. **Phase 6A.3:** Test suite (40-50 tests)
4. **Phase 6A.4:** Documentation

**Key Challenges:**
- Thumbnail generation (sharp integration with Effect)
- EXIF metadata extraction (async operations)
- Large service split (modularity vs monolith)
- Multiple relation types

**Mitigation:**
- Split service into separate modules (image-crud.effect.ts, image-metadata.effect.ts, etc.)
- Use Effect.tryPromise for sharp operations
- Follow Phase 5 patterns for relations
- Document all image constraints (hash, folderId, etc.)

**Success Criteria:**
- ✅ 40+ tests passing (100%)
- ✅ 95%+ coverage
- ✅ All CRUD operations working
- ✅ Thumbnail generation functional
- ✅ Metadata extraction functional
- ✅ Relations functional

---

### Service 2: VideoService

**Priority:** 🟡 HIGH (similar patterns to Image)

**Current State Analysis:**
```typescript
// src/services/video/video.service.ts
// - Similar to ImageService
// - Video probe (ffprobe/mediabunny)
// - Thumbnail generation (ffmpeg)
// - Metadata extraction
// - Relations (albums, collections, tags)
// - Stats aggregation
```

**Complexity:** MEDIUM-HIGH
- Similar patterns to ImageService
- Video-specific operations (probe, thumbnail extraction)
- Dependencies on ffmpeg/mediabunny
- Relations similar to Image

**Estimated Duration:** 1 day

**Approach:**
1. Copy ImageService structure
2. Replace image-specific logic with video logic
3. Integrate video probe service
4. Test suite (30-40 tests)

**Key Challenges:**
- Video probe integration (mediabunny)
- Thumbnail extraction (ffmpeg)
- Large file handling

**Mitigation:**
- Reuse ImageService patterns
- Use Effect.tryPromise for ffmpeg operations
- Follow Phase 5 duplicate handling pattern

**Success Criteria:**
- ✅ 30+ tests passing (100%)
- ✅ 95%+ coverage
- ✅ Video probe functional
- ✅ Thumbnail generation functional

---

### Service 3: AudioService

**Priority:** 🟡 MEDIUM-HIGH (similar patterns)

**Current State Analysis:**
```typescript
// src/services/audio/audio.service.ts
// - Similar to Image/Video
// - Audio metadata (ID3 tags)
// - Waveform generation
// - Relations (collections, tags)
// - Stats aggregation
```

**Complexity:** MEDIUM
- Simpler than Image/Video (fewer relations)
- Audio-specific operations (waveform, ID3)
- Smaller codebase

**Estimated Duration:** 1 day

**Approach:**
1. Copy VideoService structure
2. Replace video logic with audio logic
3. Integrate audio metadata extraction
4. Test suite (25-30 tests)

**Success Criteria:**
- ✅ 25+ tests passing (100%)
- ✅ 95%+ coverage
- ✅ Audio metadata extraction functional

---

## 📊 Phase 6B: Organizational Services

### Service 4: GroupService

**Priority:** 🟢 MEDIUM (organizational hierarchy)

**Current State Analysis:**
```typescript
// src/services/group/group.service.ts
// - CRUD operations
// - Relations (images, videos, etc.)
// - Stats aggregation
// - Hierarchical structure (parent/child)
```

**Complexity:** MEDIUM
- Similar to CollectionService
- Hierarchical structure (like FolderService)
- Relations with multiple entity types

**Estimated Duration:** 0.75-1 day

**Approach:**
1. Copy CollectionService structure
2. Add hierarchical operations from FolderService
3. Test suite (25-30 tests)

**Success Criteria:**
- ✅ 25+ tests passing (100%)
- ✅ 95%+ coverage
- ✅ Hierarchical operations functional

---

### Service 5: ProfileService

**Priority:** 🟢 MEDIUM (user preferences)

**Current State Analysis:**
```typescript
// src/services/profile/profile.service.ts
// - CRUD operations
// - User preferences
// - Settings management
// - Stats tracking
```

**Complexity:** LOW-MEDIUM
- Simple CRUD operations
- No complex relations
- Preferences management

**Estimated Duration:** 0.5-0.75 day

**Approach:**
1. Copy TagService structure (simpler pattern)
2. Add preferences logic
3. Test suite (20-25 tests)

**Success Criteria:**
- ✅ 20+ tests passing (100%)
- ✅ 95%+ coverage
- ✅ Preferences management functional

---

### Service 6: PropertyService

**Priority:** 🟢 MEDIUM (metadata properties)

**Current State Analysis:**
```typescript
// src/services/property/property.service.ts
// - CRUD operations
// - Entity relations (polymorphic)
// - Property types management
// - Validation
```

**Complexity:** MEDIUM
- Polymorphic relations (images, videos, etc.)
- Property type validation
- Complex queries

**Estimated Duration:** 1 day

**Approach:**
1. Copy CollectionService structure
2. Add polymorphic relation handling
3. Property type validation
4. Test suite (25-30 tests)

**Success Criteria:**
- ✅ 25+ tests passing (100%)
- ✅ 95%+ coverage
- ✅ Polymorphic relations functional

---

## 📈 Phase 6 Timeline

### Week 1 (Days 1-3): Phase 6A - Core Media
```
Day 1-2: ImageService
├─ Day 1 AM: Error types + Core CRUD
├─ Day 1 PM: Relations + Stats
├─ Day 2 AM: Metadata + Thumbnails
└─ Day 2 PM: Tests + Documentation

Day 3: VideoService
├─ AM: Error types + CRUD + Video probe
└─ PM: Tests + Documentation

Day 4: AudioService
├─ AM: Error types + CRUD + Audio metadata
└─ PM: Tests + Documentation
```

### Week 2 (Days 4-6): Phase 6B - Organizational
```
Day 5: GroupService
├─ AM: Error types + CRUD + Hierarchy
└─ PM: Tests + Documentation

Day 6 AM: ProfileService
├─ Error types + CRUD + Preferences
└─ Tests + Documentation

Day 6 PM: PropertyService
├─ Error types + CRUD + Polymorphic relations
└─ Tests + Documentation
```

**Total Duration:** 6 days (realistic with Phase 5 lessons applied)

---

## 🎯 Success Metrics

### Code Quality
```
✅ All services: 100% test pass rate
✅ Coverage: 95%+ across all services
✅ TypeScript errors: 0 (blocking)
✅ Systematic issues: Documented and resolved
```

### Test Metrics
```
Target: 180-200 tests total (Phase 6A + 6B)
- ImageService: 40-50 tests
- VideoService: 30-40 tests
- AudioService: 25-30 tests
- GroupService: 25-30 tests
- ProfileService: 20-25 tests
- PropertyService: 25-30 tests
```

### Documentation
```
✅ EFFECT-PHASE-6-SUMMARY.md (comprehensive)
✅ Each service: Inline documentation
✅ Lessons learned: Captured and applied
✅ Patterns: Documented for Phase 7+
```

---

## 🚀 Phase 7+ Planning (Future)

### Phase 7: Worldbuilding Services (11 services)
```
character/, place/, concept/, note/, prompt/,
wildcard/, world-item/, task/, etc.
```

**Estimated Duration:** 2-3 weeks

### Phase 8: System Services (6 services)
```
activity/, settings/, metadata/, queue-job/, task/, stats/
```

**Estimated Duration:** 1-2 weeks

### Phase 9: Infrastructure Services (15 services)
```
cache/, clipboard/, download/, drag-selection/, file/,
folder-files/, progress/, thumbnail/, toast/, undo-redo/, etc.
```

**Estimated Duration:** 2-3 weeks

**Total Remaining:** 32 services, 5-8 weeks

---

## 🧠 Key Takeaways

### From Phase 5
1. **Schema.String > Schema.ID** for test environments
2. **Document constraints** in test helpers (NOT NULL, CHECK, UNIQUE, FK)
3. **Effect.catchTag** mandatory for graceful error recovery
4. **Explicit error types** in Effect.tryPromise catch handlers
5. **Realistic test data** matching database constraints
6. **Systematic error analysis** more effective than individual fixes

### For Phase 6
1. **Apply patterns immediately** - Don't rediscover issues
2. **Document constraints upfront** - Before writing tests
3. **Split large services** - ImageService needs modularity
4. **Reuse structures** - Copy from similar services
5. **Test incrementally** - Catch issues early
6. **Celebrate wins** - 6 services is significant progress

---

## ✅ Phase 6 Checklist

### Pre-Phase
- [x] Phase 5 complete (CollectionService 45/45 passing)
- [x] Lessons learned documented (EFFECT-PHASE-5-SUMMARY.md)
- [x] Patterns identified and ready to apply
- [ ] Phase 6 plan reviewed and approved

### Phase 6A (Core Media)
- [ ] ImageService migrated (40+ tests)
- [ ] VideoService migrated (30+ tests)
- [ ] AudioService migrated (25+ tests)

### Phase 6B (Organizational)
- [ ] GroupService migrated (25+ tests)
- [ ] ProfileService migrated (20+ tests)
- [ ] PropertyService migrated (25+ tests)

### Post-Phase
- [ ] All tests passing (100%)
- [ ] Coverage 95%+
- [ ] EFFECT-PHASE-6-SUMMARY.md created
- [ ] Patterns documented for Phase 7

---

## 🎉 Expected Impact

**After Phase 6 Completion:**
```
Migrated Services: 10/40+ (25%)
Test Coverage: 300+ tests (100% pass rate)
Lines Migrated: ~8,000 lines (service + tests)
Patterns Established: 20+ reusable patterns
Issues Resolved: 18+ documented systematic issues
```

**Velocity Improvement:**
- Phase 1 (TagService): 2-3 days (exploratory)
- Phase 3 (AlbumService): 1 day (with patterns)
- Phase 4 (FolderService): 4-6 hours (with patterns)
- Phase 5 (CollectionService): 1 day (6 issues discovered)
- **Phase 6 (avg per service): 1 day** (lessons applied)

**ROI:**
- Faster development velocity (75% time reduction)
- Higher code quality (95%+ coverage, 100% tests passing)
- Better error handling (typed errors, graceful recovery)
- Reduced debugging time (systematic issue resolution)

---

## 📝 Notes

- ImageService is the most critical service (blocks many features)
- Video/Audio services can reuse Image patterns
- Group/Profile/Property services are simpler (quick wins)
- Phase 7+ planning deferred until Phase 6 complete
- Adjust timeline based on Phase 6 learnings

**Last Updated:** 11 de octubre de 2025  
**Status:** READY TO START Phase 6A.1 (ImageService error types)

☄️☄️☄️☄️
