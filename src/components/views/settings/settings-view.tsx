"use client";

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatabaseIcon, BookmarkIcon, CatIcon } from "lucide-react";

// Importar las secciones
import { FoldersSection } from "./settings-sections/folders-section";
import { ThumbnailsSection } from "./settings-sections/thumbnails-section";
import { CollectionsSection } from "./settings-sections/collections-section";
import { TagsSection } from "./settings-sections/tags-section";
import { ShortcutsSection } from "./settings-sections/shortcuts-section";
import { ProfilesSection } from "./settings-sections/profiles-section";
import { SystemSection } from "./settings-sections/system-section";

export function SettingsView() {
	const [activeTab, setActiveTab] = React.useState("folders");
	return (
		<div className="p-0 m-0 h-full w-full rounded-none">
			<ScrollArea className="h-full">
				<Tabs
					value={activeTab}
					onValueChange={setActiveTab}
					className="w-full rounded-none"
					defaultValue="folders"
				>
					<TabsList className="grid w-full grid-cols-3 h-9 py-0 px-2 m-0 rounded-none">
						<TabsTrigger value="folders">
							<DatabaseIcon className="h-4 w-4 mr-2" /> Sistema
						</TabsTrigger>

						<TabsTrigger value="collections">
							<BookmarkIcon className="h-4 w-4 mr-2" /> Organización
						</TabsTrigger>

						<TabsTrigger value="shortcuts">
							<CatIcon className="h-4 w-4 mr-2" /> Ayuda
						</TabsTrigger>
					</TabsList>

					<TabsContent value="folders" className="gap-2 px-2">
						<div className="grid grid-cols-2 gap-2 w-full">
							<ProfilesSection />
							<div className="grid grid-cols-1 gap-2">
								<FoldersSection />
								<ThumbnailsSection />
							</div>
							<SystemSection />
						</div>
					</TabsContent>

					<TabsContent value="collections" className="px-2">
						<div className="grid grid-cols-2 gap-2 w-full">
							<CollectionsSection />
							<TagsSection />
						</div>
					</TabsContent>

					<TabsContent value="shortcuts" className="px-2">
						<ShortcutsSection />
					</TabsContent>
				</Tabs>
			</ScrollArea>
		</div>
	);
}
