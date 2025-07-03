import { memo } from 'react';
import { ClientGeneralStats, ClientRecentActivity, ClientTopTags } from '../stats-client-components';

// Usamos React.memo para evitar renderizados innecesarios
const StatsWrapper = memo(function StatsWrapper() {
	return (
		<>
			<ClientGeneralStats />
			<ClientTopTags />
			<ClientRecentActivity />
		</>
	);
});

export default StatsWrapper;
