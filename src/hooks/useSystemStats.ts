import { useQuery } from '@tanstack/react-query';
import { statsService } from '@/services/stats/stats.service';

export const useSystemStats = () => {
	return useQuery({
		queryKey: ['system-stats'],
		queryFn: () => statsService.getGeneralStats(),
	});
};