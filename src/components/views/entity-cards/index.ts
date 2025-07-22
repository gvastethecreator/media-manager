export { EntityCardsView } from './entity-cards-view';
export { default as EntityCardsContentView } from './entity-cards-content-view';

// Container component for conditional rendering
export const EntityCardsViewContainer = () => {
	return <EntityCardsView />;
};

export default EntityCardsView;