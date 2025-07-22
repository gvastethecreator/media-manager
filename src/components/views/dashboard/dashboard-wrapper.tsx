import { memo } from 'react';
import { useSystemStats } from '@/hooks/useSystemStats';
import DashboardContentView from './dashboard-content-view';

export const DashboardViewWrapper = memo(function DashboardViewWrapper() {
  const { data: stats, isLoading, isError, error } = useSystemStats();

  return <DashboardContentView stats={stats} isLoading={isLoading} isError={isError} error={error} />;
});

export default DashboardViewWrapper;
