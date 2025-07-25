export { default as EntityCardsContentView } from './entity-cards-content-view';

import { EntityCardsView } from './entity-cards-view';
export { EntityCardsView };

// Container component for conditional rendering
export const EntityCardsViewContainer = () => {
	return <EntityCardsView />;
};

export default EntityCardsView;
