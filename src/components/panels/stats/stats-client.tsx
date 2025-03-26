'use client';

import { Card } from '@/components/ui/card';
import { Suspense } from 'react';
import { StatsContainer } from './base/stats-view';
import { StatsLoading } from './components/stats-loading';

export default function StatsClientWrapper({ children }: { children: React.ReactNode }) {
	return (
		<StatsContainer>
			<Suspense fallback={<StatsLoading />}>
				<Card className="border-none rounded-none">
					{children}
				</Card>
			</Suspense>
		</StatsContainer>
	);
}