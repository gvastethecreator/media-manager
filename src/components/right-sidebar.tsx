"use client"

import { useEffect, useState } from "react"
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
import { FileItem } from "./file-view"

interface RightSidebarProps {
  selectedItem: FileItem | null
}

export function RightSidebar({ selectedItem }: RightSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false)

  useEffect(() => {
    animate(
      ".metadata-item",
      { opacity: [0, 1], y: [10, 0] },
      { delay: stagger(0.05), duration: 0.3, easing: spring() }
    )
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
        onCollapse={() => setIsCollapsed(true)}
        onExpand={() => setIsCollapsed(false)}
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
                    <MetadataItem label="Size" value={selectedItem.size} />
                    <MetadataItem
                      label="Created"
                      value={new Date(selectedItem.dateCreated).toLocaleString()}
                    />
                    <MetadataItem
                      label="Modified"
                      value={new Date(selectedItem.dateModified).toLocaleString()}
                    />
                    {selectedItem.type === "image" && (
                      <MetadataItem
                        label="Dimensions"
                        value={selectedItem.dimensions || "N/A"}
                      />
                    )}
                    {selectedItem.type === "folder" && (
                      <>
                        <MetadataItem
                          label="Items"
                          value={selectedItem.children?.length.toString() || "0"}
                        />
                        <MetadataItem
                          label="Total Size"
                          value={calculateFolderSize(selectedItem)}
                        />
                      </>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="metadata" className="space-y-4 py-4">
                  <div className="space-y-2">
                    {selectedItem.type === "image" && (
                      <>
                        <MetadataItem label="Camera" value="Canon EOS R5" />
                        <MetadataItem
                          label="Lens"
                          value="RF 24-70mm f/2.8L IS USM"
                        />
                        <MetadataItem label="Focal Length" value="50mm" />
                        <MetadataItem label="Aperture" value="f/4.0" />
                        <MetadataItem label="Shutter Speed" value="1/250s" />
                        <MetadataItem label="ISO" value="100" />
                      </>
                    )}
                    {selectedItem.type === "folder" && (
                      <>
                        <MetadataItem label="Owner" value="John Doe" />
                        <MetadataItem label="Permissions" value="Read/Write" />
                        <MetadataItem
                          label="Tags"
                          value="Vacation, Family, 2023"
                        />
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

function calculateFolderSize(folder: FileItem): string {
  if (!folder.children) return "0 B"
  const totalBytes = folder.children.reduce((acc, item) => {
    if (item.type === "folder") {
      return acc + parseInt(calculateFolderSize(item))
    }
    return acc + parseInt(item.size)
  }, 0)
  return formatBytes(totalBytes)
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}