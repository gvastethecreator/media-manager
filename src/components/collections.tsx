"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

export interface Collection {
  id: string
  emoji: string
  name: string
  description?: string
  count: number
  color?: string
}

interface CollectionsProps {
  collections: Collection[]
  onCollectionClick?: (collection: Collection) => void
  onCreateCollection?: (collection: Partial<Collection>) => void
}

export function Collections({
  collections,
  onCollectionClick,
  onCreateCollection,
}: CollectionsProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [newCollection, setNewCollection] = useState({
    name: "",
    emoji: "📁",
    description: "",
  })

  const handleCreate = () => {
    if (newCollection.name.trim() && onCreateCollection) {
      onCreateCollection(newCollection)
      setNewCollection({ name: "", emoji: "📁", description: "" })
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Colecciones</h2>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Plus className="h-4 w-4" />
              <span className="sr-only">Crear colección</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear nueva colección</DialogTitle>
              <DialogDescription>
                Crea una nueva colección para organizar tus imágenes
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="emoji">Emoji</Label>
                <Input
                  id="emoji"
                  value={newCollection.emoji}
                  onChange={(e) =>
                    setNewCollection({ ...newCollection, emoji: e.target.value })
                  }
                  maxLength={2}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={newCollection.name}
                  onChange={(e) =>
                    setNewCollection({ ...newCollection, name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  value={newCollection.description}
                  onChange={(e) =>
                    setNewCollection({
                      ...newCollection,
                      description: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreating(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreate}>Crear</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="h-[calc(100vh-10rem)]">
        <div className="grid gap-4 md:grid-cols-2">
          {collections.map((collection) => (
            <Card
              key={collection.id}
              className={cn(
                "group transition-all hover:shadow-md",
                onCollectionClick && "cursor-pointer"
              )}
              onClick={() => onCollectionClick?.(collection)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <span className="mr-2 text-2xl" role="img" aria-label={collection.emoji}>
                    {collection.emoji}
                  </span>
                  {collection.name}
                </CardTitle>
                {collection.description && (
                  <CardDescription className="line-clamp-2">
                    {collection.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {/* Aquí podrían ir las miniaturas de la colección */}
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  {collection.count} {collection.count === 1 ? "imagen" : "imágenes"}
                </p>
              </CardFooter>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}