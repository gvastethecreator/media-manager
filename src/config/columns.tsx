import type { FileItem } from '@/store/files'

export type ColumnIconType = 
  | 'file-text'
  | 'image'
  | 'scale'
  | 'wand-2'
  | 'brain-circuit'
  | 'layers'
  | 'share-2'
  | 'clock'

export interface Column {
  id: string
  label: string
  icon?: ColumnIconType
  width: number
  minWidth?: number
  isResizable?: boolean
  isHideable?: boolean
  isVisible: boolean
  accessor: (item: FileItem) => string | number
}

export const defaultColumns: Column[] = [
  {
    id: 'thumbnail',
    label: '',
    icon: 'image',
    width: 48,
    minWidth: 48,
    isResizable: false,
    isHideable: false,
    isVisible: true,
    accessor: (item: FileItem) => item.thumbnailUrl || ''
  },
  {
    id: 'name',
    label: 'Nombre',
    icon: 'file-text',
    width: 250,
    minWidth: 120,
    isResizable: true,
    isHideable: false,
    isVisible: true,
    accessor: (item: FileItem) => item.name
  },
  {
    id: 'type',
    label: 'Tipo',
    icon: 'scale',
    width: 100,
    minWidth: 80,
    isResizable: true,
    isHideable: true,
    isVisible: true,
    accessor: (item: FileItem) => item.type
  },
  {
    id: 'prompt',
    label: 'Prompt',
    icon: 'wand-2',
    width: 200,
    minWidth: 100,
    isResizable: true,
    isHideable: true,
    isVisible: true,
    accessor: (item: FileItem) => item.prompt || '-'
  },
  {
    id: 'model',
    label: 'Modelo',
    icon: 'brain-circuit',
    width: 150,
    minWidth: 100,
    isResizable: true,
    isHideable: true,
    isVisible: true,
    accessor: (item: FileItem) => item.model || '-'
  },
  {
    id: 'loras',
    label: 'LoRAs',
    icon: 'layers',
    width: 150,
    minWidth: 100,
    isResizable: true,
    isHideable: true,
    isVisible: true,
    accessor: (item: FileItem) => item.loras?.join(', ') || '-'
  },
  {
    id: 'source',
    label: 'Fuente',
    icon: 'share-2',
    width: 120,
    minWidth: 80,
    isResizable: true,
    isHideable: true,
    isVisible: true,
    accessor: (item: FileItem) => item.source || '-'
  },
  {
    id: 'date',
    label: 'Fecha',
    icon: 'clock',
    width: 150,
    minWidth: 100,
    isResizable: true,
    isHideable: true,
    isVisible: true,
    accessor: (item: FileItem) => {
      if (!item.modified) return '-'
      return new Intl.DateTimeFormat('es', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(item.modified))
    }
  }
]
