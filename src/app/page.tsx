"use client"

import { MainLayout } from "@/components/layout/main-layout/main-layout"
import { FilesProvider } from "@/context/file-context"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Providers } from "@/components/core/providers/providers"

export default function Home() {
  return (
    <Providers>
      <FilesProvider>
        <SidebarProvider>
          <main className="h-[100vh] w-full overflow-hidden">
            <MainLayout />
          </main>
        </SidebarProvider>
      </FilesProvider>
    </Providers>
  )
}
