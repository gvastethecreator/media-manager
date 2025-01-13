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
  size: number;
  width?: number;
  height?: number;
  metadata?: Record<string, any>;
  thumbnail?: string;
  thumbnailSize?: number;
  thumbnailWidth?: number;
  thumbnailHeight?: number;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  isFavorite: boolean;
  folderId: string;
}

export interface ImageItem extends FileItem {
  url?: string;
  src: string;
  alt: string;
  mimeType?: string;
}

export interface ThumbnailResponse {
  thumbnail: string;
  width?: number;
  height?: number;
  size?: number;
  mimeType?: string;
}

export interface ViewProps {
  isResizing?: boolean;
}

export interface ViewContainerProps {
  isResizing?: boolean;
}
