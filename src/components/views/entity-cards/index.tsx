export { default as EntityCardsContentView } from './entity-cards-content-view';
export { EntityCardsView } from './entity-cards-view';

// Container component for conditional rendering
export const EntityCardsViewContainer = () => {
	return <EntityCardsView />;
};

export default EntityCardsView;
