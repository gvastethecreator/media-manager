"use client"

import dynamic from 'next/dynamic'
import { SidebarProvider } from "@/components/ui/sidebar"
import { ThemeProvider } from "@/components/theme-provider"

const DynamicMainContent = dynamic(() => import('@/components/main-content/main-content'), { ssr: false })

export default function Page() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <DynamicMainContent />
        </div>
      </SidebarProvider>
    </ThemeProvider>
  )
}
