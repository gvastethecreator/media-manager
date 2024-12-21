'use client';

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Folder, FolderOpen, Plus } from "lucide-react"
import { getFolders } from "@/services/folder.service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { useFilesStore } from "@/store/files"

interface FolderItem {
  id: string
  name: string
  path: string
  totalSize: number
  _count: {
    images: number
  }
}

export function FoldersView() {
  const router = useRouter()
  const { toast } = useToast()
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [loading, setLoading] = useState(true)
  const { handleSelectFolder, setCurrentView } = useFilesStore()

  useEffect(() => {
    const loadFolders = async () => {
      try {
        const data = await getFolders()
        console.log('Carpetas cargadas:', data)
        setFolders(data)
      } catch (error) {
        console.error('Error cargando carpetas:', error)
        toast({
          title: "Error",
          description: "No se pudieron cargar las carpetas",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    loadFolders()
  }, [toast])

  const handleFolderClick = async (folderId: string) => {
    console.log('Click en carpeta:', folderId)
    setCurrentView('folder')
    await handleSelectFolder(folderId)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="w-full">
            <CardHeader>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-3 w-1/4" />
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  if (folders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] p-4">
        <Folder className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">No hay carpetas indexadas</h2>
        <p className="text-muted-foreground mb-4">
          Agrega una carpeta para comenzar a gestionar tus imágenes
        </p>
        <Button onClick={() => router.push('/settings')}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Carpeta
        </Button>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[calc(100vh-4rem)]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {folders.map((folder) => (
          <Card key={folder.id} className="w-full hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                {folder.name}
              </CardTitle>
              <CardDescription className="truncate" title={folder.path}>
                {folder.path}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Imágenes:</span>
                  <span>{folder._count.images}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tamaño total:</span>
                  <span>{(folder.totalSize / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => handleFolderClick(folder.id)}
              >
                Ver contenido
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </ScrollArea>
  )
}
