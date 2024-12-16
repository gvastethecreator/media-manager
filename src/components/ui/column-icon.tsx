'use client'

import { FileText, Image, Scale, Wand2, BrainCircuit, Layers, Share2, Clock } from 'lucide-react'
import type { ColumnIconType } from '@/config/columns'

interface ColumnIconProps {
  type?: ColumnIconType
  className?: string
}

export function ColumnIcon({ type, className = "h-4 w-4" }: ColumnIconProps) {
  if (!type) return null

  switch (type) {
    case 'file-text':
      return <FileText className={className} />
    case 'image':
      return <Image className={className} />
    case 'scale':
      return <Scale className={className} />
    case 'wand-2':
      return <Wand2 className={className} />
    case 'brain-circuit':
      return <BrainCircuit className={className} />
    case 'layers':
      return <Layers className={className} />
    case 'share-2':
      return <Share2 className={className} />
    case 'clock':
      return <Clock className={className} />
    default:
      return null
  }
}
