import { memo } from 'react';
import { useNavigationData } from '@/lib/api/navigation';
import EntityCardsContentView from './entity-cards-content-view';

export const EntityCardsView = memo(function EntityCardsView() {
	const { data, isLoading, isError, error } = useNavigationData();

	return <EntityCardsContentView data={data} isLoading={isLoading} isError={isError} error={error} />;
});
