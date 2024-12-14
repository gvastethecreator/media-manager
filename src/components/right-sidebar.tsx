import React from 'react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { animate, stagger, spring } from "motion"
import { FileItem } from './file-view'

type RightSidebarProps = {
  selectedItem: FileItem | null
  isCollapsed?: boolean
}

export function RightSidebar({ selectedItem, isCollapsed = false }: RightSidebarProps) {
  const [isImageViewerOpen, setIsImageViewerOpen] = React.useState(false)

  React.useEffect(() => {
    animate(
      ".metadata-item",
      { opacity: [0, 1], y: [10, 0] },
      { delay: stagger(0.05), duration: 0.3, easing: spring() }
    )
  }, [selectedItem])

  if (isCollapsed) {
    return (
      <div className="flex flex-col h-full border-l items-center justify-center text-muted-foreground p-2">
        <span className="rotate-90 whitespace-nowrap">Información del item</span>
      </div>
    )
  }

  if (!selectedItem) {
    return (
      <div className="flex flex-col h-full border-l items-center justify-center text-muted-foreground">
        No item selected
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full border-l">
      {selectedItem.type === 'image' && (
        <div className="p-4">
          <Dialog open={isImageViewerOpen} onOpenChange={setIsImageViewerOpen}>
            <DialogTrigger asChild>
              <div className="aspect-square w-full rounded-lg bg-muted/50 overflow-hidden cursor-pointer">
                <img 
                  src={selectedItem.thumbnail} 
                  alt={selectedItem.name} 
                  className="w-full h-full object-cover transition-transform hover:scale-105"
                />
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <img 
                src={selectedItem.thumbnail} 
                alt={selectedItem.name} 
                className="w-full h-auto"
              />
            </DialogContent>
          </Dialog>
        </div>
      )}
      {selectedItem.type === 'folder' && (
        <div className="p-4">
          <div className="grid grid-cols-3 gap-2">
            {selectedItem.children?.slice(0, 9).map((item, index) => (
              <div key={index} className="aspect-square rounded-lg bg-muted/50 overflow-hidden">
                <img 
                  src={item.thumbnail} 
                  alt={item.name} 
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
      <Separator />
      <ScrollArea className="flex-1 px-4">
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Information</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
          </TabsList>
          <TabsContent value="info" className="space-y-4 py-4">
            <div className="space-y-2">
              <MetadataItem label="Name" value={selectedItem.name} />
              <MetadataItem label="Type" value={selectedItem.type} />
              <MetadataItem label="Size" value={selectedItem.size} />
              <MetadataItem label="Created" value={new Date(selectedItem.dateCreated).toLocaleString()} />
              <MetadataItem label="Modified" value={new Date(selectedItem.dateModified).toLocaleString()} />
              {selectedItem.type === 'image' && (
                <MetadataItem label="Dimensions" value={selectedItem.dimensions || 'N/A'} />
              )}
              {selectedItem.type === 'folder' && (
                <>
                  <MetadataItem label="Items" value={selectedItem.children?.length.toString() || '0'} />
                  <MetadataItem label="Total Size" value={calculateFolderSize(selectedItem)} />
                </>
              )}
            </div>
          </TabsContent>
          <TabsContent value="metadata" className="space-y-4 py-4">
            <div className="space-y-2">
              {selectedItem.type === 'image' && (
                <>
                  <MetadataItem label="Camera" value="Canon EOS R5" />
                  <MetadataItem label="Lens" value="RF 24-70mm f/2.8L IS USM" />
                  <MetadataItem label="Focal Length" value="50mm" />
                  <MetadataItem label="Aperture" value="f/4.0" />
                  <MetadataItem label="Shutter Speed" value="1/250s" />
                  <MetadataItem label="ISO" value="100" />
                </>
              )}
              {selectedItem.type === 'folder' && (
                <>
                  <MetadataItem label="Owner" value="John Doe" />
                  <MetadataItem label="Permissions" value="Read/Write" />
                  <MetadataItem label="Tags" value="Vacation, Family, 2023" />
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </ScrollArea>
    </div>
  )
}

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="metadata-item bg-muted/30 p-2 rounded-md">
      <label className="text-[10px] font-medium text-muted-foreground">{label}</label>
      <p className="text-xs break-words">{value}</p>
    </div>
  )
}

function calculateFolderSize(folder: FileItem): string {
  if (!folder.children) return '0 B'
  const totalBytes = folder.children.reduce((acc, item) => {
    if (item.type === 'folder') {
      return acc + parseInt(calculateFolderSize(item))
    }
    return acc + parseInt(item.size)
  }, 0)
  return formatBytes(totalBytes)
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

