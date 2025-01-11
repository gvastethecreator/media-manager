"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { ShortcutsSection } from "@/components/views/settings/settings-sections/shortcuts-section";
import { SystemSection } from "@/components/views/settings/settings-sections/system-section";

export function SettingsInfo() {
	return (
		<div className="space-y-2 p-2">
			<div className="space-y-2">
				<ShortcutsSection />
				<SystemSection />
			</div>
		</div>
	);
}
