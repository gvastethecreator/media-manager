export type ViewType =
  | "folders"
  | "collections"
  | "tags"
  | "albums"
  | "characters"
  | "places"
  | "objects";

export interface BaseItem {
  id: string;
  name: string;
  count: number;
  emoji?: string;
}

export interface FileItem {
  id: string;
  name: string;
  path: string;
  type: string;
  mimeType?: string;
  size: number;
  width?: number;
  height?: number;
  metadata?: {
    mimeType?: string;
    size?: number;
    dimensions?: {
      width: number;
      height: number;
    };
    extension?: string;
    fileSystem?: {
      size: number;
      created: string;
      modified: string;
      accessed: string;
    };
    exif?: Record<string, any>;
    generation?: Record<string, any>;
  };
  thumbnail?: string;
  thumbnailSize?: number;
  thumbnailWidth?: number;
  thumbnailHeight?: number;
  isFavorite?: boolean;
  isPublic?: boolean;
  createdAt: string;
  updatedAt: string;
  collections?: Array<{
    id: string;
    name: string;
    emoji: string;
    color: string;
  }>;
  tags?: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  characters?: Array<{
    id: string;
    name: string;
    emoji: string;
    color: string;
  }>;
  places?: Array<{
    id: string;
    name: string;
    emoji: string;
    color: string;
  }>;
  objects?: Array<{
    id: string;
    name: string;
    emoji: string;
    color: string;
  }>;
  activities?: Array<{
    id: string;
    type: string;
    description: string;
    createdAt: string;
  }>;
  stats?: {
    views: number;
    downloads: number;
    lastViewed: string;
  };
}

export interface ViewProps {
  isResizing?: boolean;
}

export interface ViewContainerProps {
  isResizing?: boolean;
}
