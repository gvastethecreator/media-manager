"use client"

import * as React from "react"
import { animate, spring, stagger } from "motion"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { cn } from "@/lib/utils"
import type { FileItem } from "@/lib/contexts/file-context"

interface RightSidebarProps {
  selectedItem: FileItem | null
  isCollapsed?: boolean
}

export function RightSidebar({ selectedItem, isCollapsed = false }: RightSidebarProps) {
  const [isImageViewerOpen, setIsImageViewerOpen] = React.useState(false)

  React.useEffect(() => {
    // Esperar a que los elementos estén en el DOM
    const elements = document.querySelectorAll(".metadata-item")
    if (elements.length > 0) {
      animate(
        elements,
        { opacity: [0, 1], y: [10, 0] },
        { delay: stagger(0.05), duration: 0.3, easing: spring() }
      )
    }
  }, [selectedItem])

  if (!selectedItem) {
    return (
      <div className="flex h-full flex-col items-center justify-center border-l text-muted-foreground">
        No item selected
      </div>
    )
  }

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel
        defaultSize={20}
        minSize={15}
        maxSize={40}
        className={cn(
          "flex flex-col border-l",
          isCollapsed &&
            "min-w-[50px] transition-all duration-300 ease-in-out"
        )}
      >
        {isCollapsed ? (
          <div className="flex h-full flex-col items-center justify-center p-2 text-muted-foreground">
            <span className="rotate-90 whitespace-nowrap">
              Información del item
            </span>
          </div>
        ) : (
          <>
            {selectedItem.type === "image" && (
              <div className="p-4">
                <Dialog
                  open={isImageViewerOpen}
                  onOpenChange={setIsImageViewerOpen}
                >
                  <DialogTrigger asChild>
                    <div className="aspect-square w-full cursor-pointer overflow-hidden rounded-lg bg-muted/50">
                      <img
                        src={selectedItem.thumbnail}
                        alt={selectedItem.name}
                        className="h-full w-full object-cover transition-transform hover:scale-105"
                      />
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <img
                      src={selectedItem.thumbnail}
                      alt={selectedItem.name}
                      className="h-auto w-full"
                    />
                  </DialogContent>
                </Dialog>
              </div>
            )}
            {selectedItem.type === "folder" && (
              <div className="p-4">
                <div className="grid grid-cols-3 gap-2">
                  {selectedItem.children?.slice(0, 9).map((item, index) => (
                    <div
                      key={index}
                      className="aspect-square overflow-hidden rounded-lg bg-muted/50"
                    >
                      <img
                        src={item.thumbnail}
                        alt={item.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
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
                    <MetadataItem
                      label="Type"
                      value={selectedItem.type.charAt(0).toUpperCase() + selectedItem.type.slice(1)}
                    />
                    <MetadataItem label="Size" value={formatBytes(selectedItem.size)} />
                    <MetadataItem
                      label="Created"
                      value={new Date(selectedItem.modified).toLocaleString()}
                    />
                    <MetadataItem
                      label="Modified"
                      value={new Date(selectedItem.modified).toLocaleString()}
                    />
                    {selectedItem.type === "image" && selectedItem.metadata && (
                      <MetadataItem
                        label="Dimensions"
                        value={`${selectedItem.metadata.width}x${selectedItem.metadata.height}`}
                      />
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="metadata" className="space-y-4 py-4">
                  <div className="space-y-2">
                    {selectedItem.type === "image" && selectedItem.metadata?.exif && (
                      <>
                        <MetadataItem label="Camera" value={selectedItem.metadata.exif.make || "N/A"} />
                        <MetadataItem label="Model" value={selectedItem.metadata.exif.model || "N/A"} />
                        <MetadataItem label="Date Taken" value={selectedItem.metadata.exif.dateTime || "N/A"} />
                        <MetadataItem label="Exposure" value={selectedItem.metadata.exif.exposureTime || "N/A"} />
                        <MetadataItem label="F-Number" value={selectedItem.metadata.exif.fNumber?.toString() || "N/A"} />
                        <MetadataItem label="ISO" value={selectedItem.metadata.exif.iso?.toString() || "N/A"} />
                        <MetadataItem label="Focal Length" value={selectedItem.metadata.exif.focalLength?.toString() || "N/A"} />
                      </>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </ScrollArea>
          </>
        )}
      </ResizablePanel>
      <ResizableHandle withHandle />
    </ResizablePanelGroup>
  )
}

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="metadata-item rounded-md bg-muted/30 p-2">
      <label className="text-[10px] font-medium text-muted-foreground">
        {label}
      </label>
      <p className="break-words text-xs">{value}</p>
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

