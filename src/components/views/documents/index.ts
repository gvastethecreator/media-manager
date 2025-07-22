export { DocumentsView } from './documents-view';
export { default as DocumentsContentView } from './documents-content-view';

// Container component for conditional rendering
export const DocumentsViewContainer = () => {
	return <DocumentsView />;
};

export default DocumentsView;