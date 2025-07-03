import { Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { StatsContainer } from './base/stats-view';
import { StatsLoading } from './components/stats-loading';

export default function StatsClientWrapper({ children }: { children: React.ReactNode }) {
	return (
		<StatsContainer>
			<Suspense fallback={<StatsLoading />}>
				<Card className="border-none rounded-none shadow-none">{children}</Card>
			</Suspense>
		</StatsContainer>
	);
}
