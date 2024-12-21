import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Folder, FolderOpen, Image, Tag } from "lucide-react"
import { useFiles } from "@/store/files"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

export function LeftPanel() {
  const router = useRouter()
  const { folders, loading, error, loadFolders } = useFiles()

  useEffect(() => {
    loadFolders()
  }, [loadFolders])

  return (
    <div className="pb-12 w-64">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Navegación
          </h2>
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => router.push('/')}
            >
              <Image className="mr-2 h-4 w-4" />
              Imágenes
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => router.push('/collections')}
            >
              <Tag className="mr-2 h-4 w-4" />
              Colecciones
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => router.push('/folders')}
            >
              <Folder className="mr-2 h-4 w-4" />
              Carpetas
            </Button>
          </div>
        </div>
        <Separator className="my-2" />
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Carpetas Indexadas
          </h2>
          <ScrollArea className="h-[300px] px-1">
            <div className="space-y-1">
              {loading ? (
                <p className="text-sm text-muted-foreground px-4">Cargando...</p>
              ) : folders.length === 0 ? (
                <p className="text-sm text-muted-foreground px-4">No hay carpetas indexadas</p>
              ) : (
                folders.map((folder) => (
                  <Button
                    key={folder.id}
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => router.push(`/folders/${folder.id}/view`)}
                  >
                    <FolderOpen className="mr-2 h-4 w-4" />
                    <div className="flex flex-col items-start">
                      <span className="text-sm">{folder.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {folder._count.images} imágenes
                      </span>
                    </div>
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}