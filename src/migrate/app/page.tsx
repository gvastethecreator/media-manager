import dynamic from 'next/dynamic'
import { SidebarProvider } from "@/components/ui/sidebar"

const DynamicMainContent = dynamic(() => import('@/migrate/components/main-content'), { ssr: false })

export default function Page() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <DynamicMainContent />
      </div>
    </SidebarProvider>
  )
}

