export type ViewType =
  | "all-images"
  | "favorites"
  | "collections"
  | "collection-content"
  | "folders"
  | "folder-content"
  | "tags"
  | "tag-content"
  | "search"
  | "files"
  | "settings"
  | "development"
  | "loading"
  | "albums"
  | "album-content"
  | "characters"
  | "character-content"
  | "places"
  | "place-content"
  | "objects"
  | "object-content";

export interface BaseItem {
  id: string;
  name: string;
  count: number;
  emoji?: string;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface FileItem {
  id: string;
  name: string;
  path: string;
  type: string;
  size: number;
  width: number | null;
  height: number | null;
  metadata: string | null;
  thumbnail: string | null;
  thumbnailSize: number | null;
  thumbnailWidth: number | null;
  thumbnailHeight: number | null;
  isPublic: boolean;
  isFavorite: boolean;
  folderId: string;
  createdAt: Date;
  updatedAt: Date;
  collections: RelatedCollection[];
  tags: RelatedTag[];
  albums: RelatedAlbum[];
  characters: RelatedCharacter[];
  places: RelatedPlace[];
  objects: RelatedObject[];
}

export interface RelatedCollection {
  id: string;
  name: string;
}

export interface RelatedTag {
  id: string;
  name: string;
}

export interface RelatedAlbum {
  id: string;
  name: string;
}

export interface RelatedCharacter {
  id: string;
  name: string;
}

export interface RelatedPlace {
  id: string;
  name: string;
}

export interface RelatedObject {
  id: string;
  name: string;
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
