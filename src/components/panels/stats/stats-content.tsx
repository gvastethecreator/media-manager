/**
 * Componente Server para el panel de estadísticas
 * Maneja la lógica de datos y renderizado de estadísticas
 * Se comunica con la base de datos a través de Server Actions
 */

import { Card } from '@/components/ui/card';
import { Suspense } from 'react';
import { GeneralStats } from './components/general-stats';
import { RecentActivity } from './components/recent-activity';
import { StatsLoading } from './components/stats-loading';
import { TopTags } from './components/top-tags';

export async function StatsContent() {
	return (
		<Card className="border-none rounded-none">
			<Suspense fallback={<StatsLoading />}>
				<GeneralStats />
				<TopTags />
				<RecentActivity />
			</Suspense>
		</Card>
	);
}
