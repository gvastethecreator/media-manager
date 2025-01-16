"use client";

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsIcon, BlocksIcon } from "lucide-react";

import { FoldersSection } from "./settings-sections/folders-section";
import { ThumbnailsSection } from "./settings-sections/thumbnails-section";
import { ShortcutsSection } from "./settings-sections/shortcuts-section";
import { ProfilesSection } from "./settings-sections/profiles-section";
import { SystemSection } from "./settings-sections/system-section";
import { OrganizeView } from "./organize-view";
export function SettingsView() {
	const [activeTab, setActiveTab] = React.useState("system");
	return (
		<div className="p-0 m-0 h-full w-full rounded-none">
			<ScrollArea className="h-full">
				<Tabs
					value={activeTab}
					onValueChange={setActiveTab}
					className="w-full rounded-none"
					defaultValue="folders"
				>
					<TabsList className="grid w-full grid-cols-4 h-9 py-0 px-2 m-0 rounded-none">
						<TabsTrigger value="system">
							<SettingsIcon className="h-4 w-4 mr-2" /> Sistema
						</TabsTrigger>

						<TabsTrigger value="organize">
							<BlocksIcon className="h-4 w-4 mr-2" /> Organización
						</TabsTrigger>
					</TabsList>
					<TabsContent value="system" className="gap-2 px-2">
						<div className="grid grid-cols-2 gap-2 w-full">
							<FoldersSection />
							<ThumbnailsSection />
							<ProfilesSection />
							<SystemSection />
						</div>
					</TabsContent>

					<TabsContent value="organize" className="px-2">
						<OrganizeView />
					</TabsContent>

					<TabsContent value="shortcuts" className="px-2">
						<ShortcutsSection />
					</TabsContent>
				</Tabs>
			</ScrollArea>
		</div>
	);
}
