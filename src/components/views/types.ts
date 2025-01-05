export type ViewType =
  | 'dashboard'
  | 'all-images'
  | 'collections'
  | 'collection-content'
  | 'folders'
  | 'folder-content'
  | 'tags'
  | 'tag-content'
  | 'search'
  | 'files'
  | 'settings'
  | 'debug';

export interface ViewProps {
  isResizing?: boolean;
}
export interface ViewContainerProps {
  isResizing?: boolean;
}