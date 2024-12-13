"use client"

import { LeftSidebar } from "@/migrate/components/left-sidebar";
import { MainContent } from "@/migrate/components/main-content";
import { RightSidebar } from "@/migrate/components/right-sidebar";
import { SettingsSidebar } from "@/migrate/components/settings-sidebar";
import { useState } from "react";
import { useFiles } from "@/lib/contexts/file-context";

export default function Home() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState("profiles");
  const { selectedFiles, files } = useFiles();

  // Obtener el elemento seleccionado para el panel derecho
  const selectedItem = selectedFiles.length === 1
    ? files.find(f => f.id === selectedFiles[0])
    : null;

  return (
    <main className="flex min-h-screen flex-col">
      <div className="flex h-screen">
        <LeftSidebar />
        <div className="flex-1 overflow-hidden">
          <MainContent onOpenSettings={() => setIsSettingsOpen(true)} />
        </div>
        <RightSidebar
          selectedItem={selectedItem}
          isCollapsed={false}
        />
      </div>

      <SettingsSidebar
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        activeTab={activeSettingsTab}
        onTabChange={setActiveSettingsTab}
      />
    </main>
  );
}
