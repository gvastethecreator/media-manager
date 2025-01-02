'use client'

import { ScrollArea } from '@/components/ui/scroll-area'
import { FileDetails } from '@/components/features/file-details/file-details'
import type { RightPanelProps } from '@/types/ui'

export function RightPanel({
  selectedItem,
}: RightPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
          <FileDetails selectedItem={selectedItem} />
      </ScrollArea>
    </div>
  )
}
// Compare this snippet from src/components/features/file-details/file-details.tsx: