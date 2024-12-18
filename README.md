# Image Manager

A modern image management application built with Next.js 15, React 19, and Tailwind CSS.

## Features

- 🖼️ Advanced image viewing with zoom, pan, and gestures
- 📂 Hierarchical folder organization
- 🏷️ Tag-based organization
- 📱 Responsive design
- 🎨 Dark/Light theme
- ⚡ Fast and efficient file browsing
- 🔍 Advanced search capabilities

## Project Structure

```
src/
├── app/                    # Next.js app router
├── components/
│   ├── core/              # Base components
│   │   ├── data-display/  # Cards, empty states
│   │   ├── feedback/      # Loading states
│   │   ├── layout/       # Layouts
│   │   ├── navigation/   # Navigation components
│   │   ├── providers/    # Context providers
│   │   └── theme/        # Theme utilities
│   ├── features/         # Feature components
│   │   ├── collections/  # Collection management
│   │   ├── file-management/
│   │   │   ├── file-browser/
│   │   │   ├── file-details/
│   │   │   └── folders/
│   │   └── image-viewer/ # Image viewing
│   └── ui/              # UI components (shadcn/ui)
├── lib/                 # Utilities and configurations
├── store/              # Global state management
└── styles/             # Global styles
```

## Development Status

### Completed Features ✅
- Core component structure
- File browsing and viewing
- Image viewer with advanced features
- Theme switching
- Responsive layouts
- Basic file management

### In Progress 🚧
- Collection management
- Tag system
- Search functionality
- Settings panel
- File metadata handling

### Planned Features 🎯
- Drag & drop functionality
- Keyboard shortcuts
- Offline mode
- Advanced search filters
- AI-powered features
- Image processing capabilities

## Getting Started

1. Clone the repository
```bash
git clone https://github.com/yourusername/image-manager.git
cd image-manager
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Run the development server
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons by [Lucide](https://lucide.dev/)
