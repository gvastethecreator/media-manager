"use client"

import { MainContent } from "@/components/main-content/main-content"
import { FilesProvider } from "@/context/FilesContext"
import { SidebarProvider } from "@/components/ui/sidebar"

export default function Home() {
  return (
    <FilesProvider>
      <SidebarProvider>
        <main className="h-[100vh] w-full overflow-hidden" data-testid="home-container">
          <MainContent data-testid="main-content-component" />
        </main>
      </SidebarProvider>
    </FilesProvider>
  )
}
