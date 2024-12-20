export type ViewType = 
  | 'dashboard'
  | 'all-images'
  | 'collections'
  | 'folders'
  | 'tags'
  | 'search'
  | 'files';

export interface ViewProps {
  isResizing?: boolean;
}
