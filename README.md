# Image Manager

A modern image management application built with Next.js 15, React 19, and Motion One.

## Migration Progress

### Completed Components

#### Main Toolbar
- ✅ SearchBar - Basic search input with responsive width
- ✅ ViewToggle - Grid/List view switcher
- ✅ ThumbnailSizeToggle - Image size controls (small/medium/large)
- ✅ CompactMenu - Mobile-friendly dropdown menu
- ✅ ActionButtons - Quick action buttons for desktop
- ✅ MainToolbar - Container component integrating all toolbar elements

#### Viewers & Views
- ✅ AdvancedImageViewer - Full-featured image viewer with zoom, pan, and gestures
- ✅ CardView - Grid layout for collections and folders with animations
- ✅ FileView - Virtualized grid/list view for files with context menu

#### Navigation
- ✅ LeftSidebar - Main navigation with collections, folders, and tags
- ✅ RightSidebar - Resizable details panel with metadata and preview

#### Management
- ✅ Collections - Collection management with card layout and creation dialog
- ✅ Folders - Hierarchical folder structure with nested navigation

### Context Providers
- ✅ ProfileContext - User profile and preferences
- ⏳ FileContext - File management state
- ⏳ SettingsContext - Application settings

## Project Structure

```
src/
├── app/                 # Next.js app router
├── components/
│   ├── ui/             # shadcn/ui components
│   ├── main-toolbar/   # Toolbar components
│   └── ...            # Other components
├── lib/
│   ├── contexts/       # React contexts
│   ├── hooks/         # Custom hooks
│   ├── types/         # TypeScript types
│   └── utils/         # Utility functions
└── styles/            # Global styles
```

## Dependencies

### Core
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS

### UI Components
- shadcn/ui - Component library
- Lucide Icons - Icon set
- Framer Motion - Animations
- TanStack Virtual - Virtualization

### Styling
- Tailwind CSS
- CSS Variables
- Geist Font Family

### Development
- ESLint
- Prettier
- PostCSS

## Theme Customization

The application uses shadcn/ui's theming system with:
- Light/Dark mode support
- System theme detection
- Custom color schemes
- Responsive design patterns

## Development Progress

### Phase 1: Basic Structure ✅
- Project setup
- Component architecture
- Basic routing

### Phase 2: Core Components ✅
- Main toolbar migration
- Image viewer implementation
- Context setup
- View components (Card, File)
- Navigation components (Left/Right sidebars)
- Management components (Collections, Folders)

### Phase 3: Pending
- File management state
- Settings management
- Performance optimizations

## Getting Started

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Run development server: `pnpm dev`
4. Open http://localhost:3000
