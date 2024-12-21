'use client'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SettingsPanel } from './settings-panel'
import { FileInfo } from './file-info'
import { cn } from '@/lib/utils'
import { Settings2 } from 'lucide-react'
import type { RightPanelProps } from '@/types/ui'

export function RightPanel({
  selectedItem,
  showSettings,
  onToggleSettings
}: RightPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">
          {showSettings ? 'Configuración' : 'Detalles'}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSettings}
          className={cn(showSettings && "bg-accent")}
        >
          <Settings2 className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {showSettings ? (
          <SettingsPanel onClose={onToggleSettings} />
        ) : (
          <FileInfo selectedItem={selectedItem} />
        )}
      </ScrollArea>
    </div>
  )
}
