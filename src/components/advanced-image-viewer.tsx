"use client"

import { useEffect, useRef, useState } from "react"
import { animate, spring, stagger } from "motion"
import { Clipboard, Copy, Crop, Download, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export type ImageItem = {
  id: string
  name: string
  thumbnail: string
  url: string
}

interface AdvancedImageViewerProps {
  images: ImageItem[]
  currentIndex: number
  onClose: () => void
}

export function AdvancedImageViewer({
  images,
  currentIndex,
  onClose,
}: AdvancedImageViewerProps) {
  const [index, setIndex] = useState(currentIndex)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const controlsRef = useRef<HTMLDivElement>(null)
  const thumbnailsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft")
        setIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
      if (e.key === "ArrowRight")
        setIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose, images.length])

  useEffect(() => {
    setPosition({ x: 0, y: 0 })
    setScale(1)
  }, [index])

  useEffect(() => {
    // Animate the viewer overlay
    animate(
      containerRef.current!,
      { opacity: [0, 1] },
      { duration: 0.2, easing: spring() }
    )

    // Animate the image
    animate(
      imageRef.current!,
      { scale: [0.9, 1], opacity: [0, 1] },
      { duration: 0.3, easing: spring() }
    )
  }, [])

  useEffect(() => {
    if (!isDragging) {
      // Animate controls
      if (controlsRef.current) {
        animate(
          controlsRef.current,
          { opacity: [0, 1], y: [-20, 0] },
          { duration: 0.2, easing: spring() }
        )
      }

      // Animate thumbnails
      if (thumbnailsRef.current) {
        animate(
          thumbnailsRef.current,
          { opacity: [0, 1], y: [20, 0] },
          { duration: 0.2, easing: spring() }
        )
      }
    }
  }, [isDragging])

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const zoomFactor = 0.1
    const newScale = Math.min(
      Math.max(0.1, scale * (1 - Math.sign(e.deltaY) * zoomFactor)),
      5
    )

    if (imageRef.current) {
      const imageRect = imageRef.current.getBoundingClientRect()
      const mouseX = (e.clientX - imageRect.left) / scale
      const mouseY = (e.clientY - imageRect.top) / scale

      const newPositionX = position.x - mouseX * (newScale - scale)
      const newPositionY = position.y - mouseY * (newScale - scale)

      setScale(newScale)
      setPosition({ x: newPositionX, y: newPositionY })

      // Animate scale change
      animate(
        imageRef.current,
        { scale: newScale },
        { duration: 0.2, easing: spring() }
      )
    }
  }

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  const handleDrag = (e: React.MouseEvent) => {
    if (isDragging && imageRef.current) {
      const newX = position.x + (e.movementX / scale) * 1.5
      const newY = position.y + (e.movementY / scale) * 1.5

      setPosition({ x: newX, y: newY })

      // Animate position change
      animate(
        imageRef.current,
        { x: newX, y: newY },
        { duration: 0.1, easing: spring() }
      )
    }
  }

  const resetView = () => {
    if (imageRef.current) {
      animate(
        imageRef.current,
        { scale: 1, x: 0, y: 0 },
        { duration: 0.3, easing: spring() }
      )
      setScale(1)
      setPosition({ x: 0, y: 0 })
    }
  }

  const renderThumbnails = () => {
    const start = Math.max(0, index - 5)
    const end = Math.min(images.length, index + 6)
    return images.slice(start, end).map((image, i) => (
      <button
        key={image.id}
        onClick={() => setIndex(i + start)}
        className={`relative w-16 h-16 rounded-md overflow-hidden transition-all ${
          i + start === index
            ? "ring-2 ring-primary ring-offset-2"
            : "opacity-70 hover:opacity-100"
        }`}
        aria-label={`View ${image.name}`}
      >
        <img
          src={image.thumbnail}
          alt=""
          className="w-full h-full object-cover"
        />
      </button>
    ))
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleDragStart}
        onMouseUp={handleDragEnd}
        onMouseMove={handleDrag}
        onWheel={handleWheel}
        onDoubleClick={resetView}
      >
        <div className="absolute inset-0 flex items-center justify-center p-8 pb-24">
          <img
            ref={imageRef}
            src={images[index].url}
            alt={images[index].name}
            className="object-contain max-w-full max-h-full shadow-2xl rounded-lg"
            style={{
              cursor: isDragging ? "grabbing" : "grab",
              zIndex: 10,
            }}
          />
        </div>

        {!isDragging && (
          <div
            ref={controlsRef}
            className="absolute top-4 left-4 flex space-x-2 z-20"
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => {}}>
                    <Crop className="h-4 w-4" />
                    <span className="sr-only">Crop image</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Crop image</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => {}}>
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copy image</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy image</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => {}}>
                    <Clipboard className="h-4 w-4" />
                    <span className="sr-only">Copy to clipboard</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy to clipboard</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => {}}>
                    <Download className="h-4 w-4" />
                    <span className="sr-only">Download image</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Download image</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        <Button
          variant="outline"
          size="icon"
          className="absolute top-4 right-4 z-20"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close viewer</span>
        </Button>

        {!isDragging && (
          <div
            ref={thumbnailsRef}
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20 p-2 bg-background/50 backdrop-blur-sm rounded-lg"
          >
            {renderThumbnails()}
          </div>
        )}
      </div>
    </div>
  )
}