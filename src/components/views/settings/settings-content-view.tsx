import { memo } from 'react';
import { SettingsView } from '@/components/settings/settings-view';

export const SettingsContentView = memo(function SettingsContentView() {
	return <SettingsView />;
});

export default SettingsContentView;
