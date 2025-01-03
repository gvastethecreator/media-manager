"use client";

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	FolderIcon,
	BookmarkIcon,
	KeyboardIcon,
	DatabaseIcon,
} from "lucide-react";

// Importar las secciones
import { FoldersSection } from "./settings-sections/folders-section";
import { CollectionsSection } from "./settings-sections/collections-section";
import { TagsSection } from "./settings-sections/tags-section";
import { ShortcutsSection } from "./settings-sections/shortcuts-section";
import { ThumbnailsSection } from "./settings-sections/thumbnails-section";
import { ProfilesSection } from "./settings-sections/profiles-section";
import { SystemSection } from "./settings-sections/system-section";
import { Separator } from "@/components/ui/separator";

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
					<TabsList className="grid w-full grid-cols-4 px-2 m-0 rounded-none">
						<TabsTrigger value="folders">
							<FolderIcon className="h-4 w-4 mr-2" /> Carpetas
						</TabsTrigger>

						<TabsTrigger value="collections">
							<BookmarkIcon className="h-4 w-4 mr-2" /> Colecciones
						</TabsTrigger>

						<TabsTrigger value="system">
							<DatabaseIcon className="h-4 w-4 mr-2" /> Sistema
						</TabsTrigger>

						<TabsTrigger value="shortcuts">
							<KeyboardIcon className="h-4 w-4 mr-2" /> Ayuda
						</TabsTrigger>
					</TabsList>

					<TabsContent value="folders">
						<FoldersSection />
						<Separator />
						<ThumbnailsSection />
					</TabsContent>

					<TabsContent value="collections">
						<CollectionsSection />
						<Separator />
						<TagsSection />
					</TabsContent>

					<TabsContent value="system">
						<ProfilesSection />
						<Separator />
						<SystemSection />
					</TabsContent>

					<TabsContent value="shortcuts">
						<ShortcutsSection />
					</TabsContent>
				</Tabs>
			</ScrollArea>
		</div>
	);
}
