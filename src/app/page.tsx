"use client"

import { MainContent } from "@/components/main-content/main-content"
import { FilesProvider } from "@/context/FilesContext"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Providers } from "@/components/providers/providers"

export default function Home() {
  return (
    <Providers>
      <FilesProvider>
        <SidebarProvider>
          <main className="h-[100vh] w-full overflow-hidden">
            <MainContent />
          </main>
        </SidebarProvider>
      </FilesProvider>
    </Providers>
  )
}
