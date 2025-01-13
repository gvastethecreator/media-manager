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
  mimeType?: string;
  metadata?: {
    dimensions?: {
      width: number;
      height: number;
    };
    mimeType?: string;
  };
  url?: string;
}

export interface ViewProps {
  isResizing?: boolean;
}

export interface ViewContainerProps {
  isResizing?: boolean;
}
