import React from 'react'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"

const thumbnailSizes = ["64x64", "128x128", "256x256", "512x512"]

export function ThumbnailsTab() {
  const [thumbnailSize, setThumbnailSize] = React.useState("256x256")
  const [thumbnailQuality, setThumbnailQuality] = React.useState(75)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Tamaño de miniaturas</Label>
        <Select value={thumbnailSize} onValueChange={setThumbnailSize}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar tamaño" />
          </SelectTrigger>
          <SelectContent>
            {thumbnailSizes.map((size) => (
              <SelectItem key={size} value={size}>{size}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Calidad de miniaturas: {thumbnailQuality}%</Label>
        <Slider
          min={1}
          max={100}
          step={1}
          value={[thumbnailQuality]}
          onValueChange={(value) => setThumbnailQuality(value[0])}
        />
      </div>
      <Button className="w-full">Regenerar miniaturas</Button>
    </div>
  )
}

