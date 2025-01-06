export type ViewType =
	| "all-images"
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
	| "loading";

export interface ViewProps {
	isResizing?: boolean;
}
export interface ViewContainerProps {
	isResizing?: boolean;
}

