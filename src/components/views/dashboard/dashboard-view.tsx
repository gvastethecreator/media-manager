import { memo } from 'react';
import { useSystemStats } from '@/hooks/useSystemStats';
import DashboardContentView from './dashboard-content-view';

export const DashboardView = memo(function DashboardView() {
	const { data: stats, isLoading, isError, error } = useSystemStats();

	return <DashboardContentView stats={stats} isLoading={isLoading} isError={isError} error={error} />;
});
