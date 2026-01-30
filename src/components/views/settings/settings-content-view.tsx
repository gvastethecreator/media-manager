import { memo } from 'react';
import { SettingsView } from '@/components/settings/settings-view';
import { SettingsProvider } from '@/lib/contexts/settings-context';

export const SettingsContentView = memo(function SettingsContentView() {
	return (
		<SettingsProvider>
			<SettingsView />
		</SettingsProvider>
	);
});

export default SettingsContentView;
