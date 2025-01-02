export type ThumbnailSize = 'small' | 'medium' | 'large';

export interface GridConfig {
  thumbnailSize: ThumbnailSize;
  viewMode: 'grid' | 'list';
  gapSize: number;
  showLabels: boolean;
  showMetadata: boolean;
  sortBy: 'name' | 'date' | 'size' | 'type';
  sortDirection: 'asc' | 'desc';
}

export interface ViewConfig extends GridConfig {
  showSidebar: boolean;
  sidebarWidth: number;
  showToolbar: boolean;
  toolbarHeight: number;
}