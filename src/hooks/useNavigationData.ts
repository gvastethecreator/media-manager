import { useQuery } from '@tanstack/react-query';
import { getNavigationData } from '@/server/services/system.service';

export const useNavigationData = () => {
	return useQuery({
		queryKey: ['navigation-data'],
		queryFn: () => getNavigationData(),
	});
};