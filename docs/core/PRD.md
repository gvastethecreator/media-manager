# PRD · Media Manager

**Document version:** 2026-03-31  
**Product status:** active development  
**Product type:** local web and desktop application for advanced media management

## 1. Product summary

Media Manager is a local application. It catalogs, enriches, organizes, and navigates large multimedia file libraries. It does not require you to move files from their original physical location. The product combines a content explorer, an enriched metadata system, and a wide set of semantic entities for creative organization and worldbuilding.

The system does more than display folders. Its value unifies these layers:

- physical filesystem organization
- logical organization in the database
- rich viewing by file type
- metadata and relations among entities
- maintenance tools such as reindex, thumbnails, caches, and search

## 2. Problem it solves

Users who work with thousands of files often face three problems at once:

1. **Folder structure is not enough** to find or classify content.
2. **Native metadata is not enough** for complex creative flows.
3. **Large libraries degrade the experience** without virtualization, previews, and fast search.

Media Manager answers this with a hybrid model:

- It respects the real file location.
- It stores extra knowledge in SQLite.
- It exposes rich views and relations by entity.
- It automates part of the heavy work through indexing and metadata extraction.

## 3. Target users

### Primary

The primary users are:

- Digital artists with reference libraries or AI-generated outputs.
- Audiovisual creators with mixed files: images, video, audio, and documents.
- Users who need to classify material by campaign, collection, or theme.

### Secondary

The secondary users are:

- Worldbuilding teams or individuals: characters, places, concepts, and objects.
- Creative developers who need to relate media to narrative entities.
- Users who prefer a local, self-contained tool with no cloud dependency.

## 4. Product goals

### Functional goals

The product aims to:

- Import and index local folders with structured persistence.
- Manage multiple file types from one interface.
- Allow cross classification through tags, albums, collections, and groups.
- Support visual exploration through thumbnails, views, panels, and specialized viewers.
- Support advanced creative models such as worldbuilding and prompts.

### Technical goals

The product also aims to:

- Keep the application usable on medium or large libraries.
- Reduce repetitive work with incremental reindex and cache utilities.
- Keep an extensible base with TypeScript, domain services, and a segmented Drizzle schema.
- Allow local-browser execution and desktop execution through Electron.

## 5. Functional scope

### 5.1 Supported content types

The product supports these content types:

- Images
- Videos
- Audio
- Documents
- JSON
- 3D files
- Uploaded images

### 5.2 Organizers

The product supports these organizers:

- Folders
- Tags
- Albums
- Collections
- Groups
- Favorites
- Profiles
- Settings

### 5.3 Creative and knowledge entities

The product supports these creative and knowledge entities:

- Characters
- Places
- Concepts
- World Items
- Prompts
- Notes
- Properties
- Tasks
- Wildcards

### 5.4 Cross-cutting capabilities

The product includes these cross-cutting capabilities:

- Full reindex and per-folder reindex
- Incremental reindex by hashes and changes
- Global search and FTS with fallback
- Metadata extraction
- Thumbnail generation and lookup
- File operations and downloads
- Activity, queue, and event tracking

## 6. Key use cases

### Case 1 · Explore a folder with previews

1. The user opens an indexed folder.
2. The app loads files and subfolders with aggregated data.
3. The app shows previews, counts, and access to details.
4. The user navigates without loading the full collection into the DOM because of virtualization.

### Case 2 · Organize content with relations

1. The user selects images or videos.
2. The user assigns tags, favorites, albums, or narrative relations.
3. The database keeps that organization without changing the original physical path.

### Case 3 · Reindex a live library

1. Files change on disk.
2. The user starts a reindex.
3. The system detects new, changed, or missing content.
4. The system updates hashes, metadata, and thumbnails.

### Case 4 · Use the product as a local desktop app

1. The user starts the Electron desktop shell.
2. The React UI runs in a BrowserWindow.
3. The Express backend operates as the local service layer under the Bun runtime.
4. Electron supplies a narrow supervisor surface. The renderer uses `/api` only.

## 7. Functional requirements

### Ingestion and indexing

The following requirements cover ingestion and indexing:

| ID    | Requirement                                                              |
| ----- | ------------------------------------------------------------------------ |
| RF-01 | Register root folders and subfolders in the local index                  |
| RF-02 | Detect supported file types and map them to entities                     |
| RF-03 | Allow full reindex and per-folder reindex                                |
| RF-04 | Allow incremental reindex when the flow supports it                      |
| RF-05 | Keep previews and metadata aligned with the physical file state          |

### Exploration and viewing

The following requirements cover exploration and viewing:

| ID    | Requirement                                                |
| ----- | ---------------------------------------------------------- |
| RF-06 | Provide multiple views to navigate entities and files      |
| RF-07 | Show side panels and contextual details                    |
| RF-08 | Include specialized viewers by content type                |
| RF-09 | Allow thumbnail or original retrieval when it applies      |

### Semantic organization

The following requirements cover semantic organization:

| ID    | Requirement                                                  |
| ----- | ------------------------------------------------------------ |
| RF-10 | Create, edit, and delete tags, albums, collections, and groups |
| RF-11 | Relate media to worldbuilding entities                       |
| RF-12 | Mark favorites and manage profiles and settings              |
| RF-13 | Store notes, prompts, wildcards, tasks, and properties       |

### Search and query

The following requirements cover search and query:

| ID    | Requirement                                                   |
| ----- | ------------------------------------------------------------- |
| RF-14 | Run global text search                                        |
| RF-15 | Offer FTS search when it is available                         |
| RF-16 | Fall back to LIKE search when FTS is not available            |
| RF-17 | Expose filters by folder, favorites, and relevant attributes  |

### System operation

The following requirements cover system operation:

| ID    | Requirement                                                         |
| ----- | ------------------------------------------------------------------- |
| RF-18 | Expose health, statistics, activity, queue, and event endpoints     |
| RF-19 | Provide structured logging and debugging tools                      |
| RF-20 | Allow local web operation and desktop mode                          |

## 8. Non-functional requirements

### Performance

The product must meet these performance needs:

- Virtualize large lists or grids.
- Load heavy views through lazy loading.
- Keep thumbnails, caches, and queries reasonably efficient.
- Avoid long UI blocks during reindex or processing.

### Quality and maintainability

The product must meet these quality needs:

- Strict TypeScript on frontend and backend.
- Services and routes segmented by domain.
- Enough technical documentation for maintenance.
- Reproducible build, test, lint, and check scripts.

### Reliability

The product must meet these reliability needs:

- Typed error handling in the Effect layer where it applies.
- Useful logs to reproduce operational failures.
- Compatibility with unit, integration, and E2E testing.

### Portability

The product must meet these portability needs:

- Local multi-platform support.
- Local web mode.
- Desktop packaging with Electron.

## 9. Constraints and product decisions

The product follows these constraints:

- The application is **local-first**. It is not a multi-user SaaS.
- Logical organization must not force changes in physical organization.
- The system must tolerate coexistence of new and inherited layers while it evolves.
- The database is SQLite/libsql. That choice simplifies local deployment and backup.

## 10. Product risks

Watch these product risks:

- Growing domain complexity from the number of entities.
- Historical documentation that drifts if there is no clear source of truth.
- Coexistence of providers, services, and utilities from different project eras.
- Operational cost of thumbnails, reindexes, and heavy viewers as the library grows.

## 11. What it does not try to solve today

The product does not try to solve these problems today:

- Real-time collaborative cloud sync.
- Remote multi-user access with complex permissions.
- A centralized SaaS platform.
- Distributed orchestration or microservices.

## 12. Reasonable success indicators

Success looks like these outcomes:

- The user can index content and find it again without depending only on the physical tree.
- The product supports heterogeneous libraries with fluid navigation.
- Technical maintenance rests on understandable routes, services, and documentation.
- Critical system operations can be audited through logs, tests, and scripts.

## 13. Related documents

The following documents complete this PRD:

- [`./ARCHITECTURE.md`](./ARCHITECTURE.md)
- [`./REPOSITORY-MAP.md`](./REPOSITORY-MAP.md)
- [`./DATABASE-SCHEMA.md`](./DATABASE-SCHEMA.md)
- [`./FRONTEND-GUIDE.md`](./FRONTEND-GUIDE.md)
- [`./SERVICES-GUIDE.md`](./SERVICES-GUIDE.md)
- [`./IMPLEMENTATION-DETAILS.md`](./IMPLEMENTATION-DETAILS.md)
