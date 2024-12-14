import { FileItem } from "@/components/file-view/file-view"

// Helper function to generate random dates within a range
const getRandomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString()
}

// Helper function to generate random file size
const getRandomSize = (min: number, max: number) => {
  return `${Math.floor(Math.random() * (max - min + 1) + min)} MB`
}

// Helper function to generate placeholder image URL
const getPlaceholderImage = (width: number, height: number, index: number) => {
  // Use a variety of placeholder services to distribute load and have more variety
  const services = [
    `https://placehold.co/${width}x${height}`,
    `https://picsum.photos/${width}/${height}?random=${index}`,
    `https://source.unsplash.com/random/${width}x${height}?sig=${index}`,
  ]
  return services[index % services.length]
}

// Generate sample files with folders first
export const mockFiles: FileItem[] = [
  // Folders
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `folder-${i + 1}`,
    name: `Folder ${i + 1}`,
    extension: '',
    size: `${Math.floor(Math.random() * 10) + 1} items`,
    type: 'folder' as const,
    dateModified: getRandomDate(new Date(Date.now() - 10000000000), new Date()),
    dateCreated: getRandomDate(new Date(Date.now() - 20000000000), new Date()),
    children: Array.from({ length: Math.floor(Math.random() * 20) + 5 }, (_, j) => ({
      id: `folder-${i + 1}-image-${j + 1}`,
      name: `Image ${j + 1}`,
      extension: j % 2 === 0 ? '.jpg' : '.png',
      size: getRandomSize(1, 10),
      type: 'image' as const,
      thumbnail: getPlaceholderImage(400, 400, i * 20 + j),
      dateModified: getRandomDate(new Date(Date.now() - 10000000000), new Date()),
      dateCreated: getRandomDate(new Date(Date.now() - 20000000000), new Date()),
      dimensions: `${1920 + j}x${1080 + j}`,
    }))
  })),
  // Images
  ...Array.from({ length: 90 }, (_, i) => ({
    id: `image-${i + 1}`,
    name: `Image ${i + 1}`,
    extension: i % 2 === 0 ? '.jpg' : '.png',
    size: getRandomSize(1, 10),
    type: 'image' as const,
    thumbnail: getPlaceholderImage(400, 400, i + 200),
    dateModified: getRandomDate(new Date(Date.now() - 10000000000), new Date()),
    dateCreated: getRandomDate(new Date(Date.now() - 20000000000), new Date()),
    dimensions: `${1920 + i}x${1080 + i}`,
  })),
].sort((a, b) => {
  // Folders first, then sort by name
  if (a.type === 'folder' && b.type !== 'folder') return -1
  if (a.type !== 'folder' && b.type === 'folder') return 1
  return a.name.localeCompare(b.name)
})

// Export mock categories with more realistic data
export const mockCategories = [
  { id: 'favorites', name: 'Favorites', count: 12, icon: 'star' },
  { id: 'recent', name: 'Recent', count: 45, icon: 'clock' },
  { id: 'photos', name: 'Photos', count: 234, icon: 'image' },
  { id: 'documents', name: 'Documents', count: 56, icon: 'file' },
  { id: 'downloads', name: 'Downloads', count: 78, icon: 'download' },
  { id: 'trash', name: 'Trash', count: 15, icon: 'trash' },
].map(category => ({
  ...category,
  path: `/${category.id}`
}))

// Export mock tags with colors
export const mockTags = [
  { id: 'work', name: 'Work', count: 45, color: 'blue' },
  { id: 'personal', name: 'Personal', count: 32, color: 'green' },
  { id: 'important', name: 'Important', count: 18, color: 'red' },
  { id: 'project-a', name: 'Project A', count: 24, color: 'purple' },
  { id: 'project-b', name: 'Project B', count: 16, color: 'orange' },
  { id: 'archive', name: 'Archive', count: 67, color: 'gray' },
  { id: 'shared', name: 'Shared', count: 29, color: 'yellow' },
]

// Export mock settings with more options
export const mockSettings = {
  theme: 'system' as const,
  language: 'en',
  notifications: true,
  compactMode: false,
  showHiddenFiles: false,
  sortBy: 'name' as const,
  sortOrder: 'asc' as const,
  viewMode: 'grid' as const,
  thumbnailSize: 'medium' as const,
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  defaultView: 'grid' as const,
  confirmDelete: true,
  showExtensions: true,
  showSidebar: true,
  sidebarWidth: 240,
  zoomLevel: 1,
  gridSize: 'medium' as const,
  thumbnailQuality: 'high' as const,
  previewOnHover: true,
  shortcuts: {
    newFolder: 'Ctrl+Shift+N',
    delete: 'Delete',
    copy: 'Ctrl+C',
    paste: 'Ctrl+V',
    cut: 'Ctrl+X',
    selectAll: 'Ctrl+A',
    search: 'Ctrl+F',
    properties: 'Alt+Enter',
  }
}