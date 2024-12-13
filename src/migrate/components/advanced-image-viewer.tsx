'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Crop, Copy, Clipboard, Download } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { FileItem } from './file-view'

interface AdvancedImageViewerProps {
  images: FileItem[]
  currentIndex: number
  onClose: () => void
}

export function AdvancedImageViewer({ images, currentIndex, onClose }: AdvancedImageViewerProps) {
  const [index, setIndex] = useState(currentIndex)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
      if (e.key === 'ArrowRight') setIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, images.length])

  useEffect(() => {
    // Reset position and scale when changing images
    setPosition({ x: 0, y: 0 })
    setScale(1)
  }, [index])

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const zoomFactor = 0.1
    const newScale = Math.min(Math.max(0.1, scale * (1 - Math.sign(e.deltaY) * zoomFactor)), 5)
    
    if (imageRef.current) {
      const imageRect = imageRef.current.getBoundingClientRect()
      const mouseX = (e.clientX - imageRect.left) / scale
      const mouseY = (e.clientY - imageRect.top) / scale
      
      const newPositionX = position.x - mouseX * (newScale - scale)
      const newPositionY = position.y - mouseY * (newScale - scale)
      
      setScale(newScale)
      setPosition({ x: newPositionX, y: newPositionY })
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
    if (isDragging) {
      setPosition((prev) => ({
        x: prev.x + e.movementX / scale * 1.5,
        y: prev.y + e.movementY / scale * 1.5,
      }))
    }
  }

  const resetView = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  const renderThumbnails = () => {
    const start = Math.max(0, index - 5)
    const end = Math.min(images.length, index + 6)
    return images.slice(start, end).map((image, i) => (
      <img
        key={image.id}
        src={image.thumbnail}
        alt={image.name}
        className={`w-16 h-16 object-cover cursor-pointer transition-all ${
          i + start === index ? 'border-2 border-primary' : 'opacity-70 hover:opacity-100'
        }`}
        onClick={() => setIndex(i + start)}
      />
    ))
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleDragStart}
        onMouseUp={handleDragEnd}
        onMouseMove={handleDrag}
        onWheel={handleWheel}
        onDoubleClick={onClose}
      >
        <div className="absolute inset-0 flex items-center justify-center p-8 pb-24">
          <motion.img
            ref={imageRef}
            src={images[index].thumbnail}
            alt={images[index].name}
            className="object-contain max-w-full max-h-full shadow-2xl"
            style={{
              cursor: isDragging ? 'grabbing' : 'grab',
              zIndex: 10,
            }}
            animate={{
              scale: scale,
              x: position.x,
              y: position.y,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.5 }}
            drag={isDragging}
            dragConstraints={containerRef}
          />
        </div>

        <AnimatePresence>
          {!isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-4 left-4 flex space-x-2 z-20"
            >
              <Button variant="outline" size="icon" onClick={() => {}}>
                <Crop className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => {}}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => {}}>
                <Clipboard className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => {}}>
                <Download className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          variant="outline"
          size="icon"
          className="absolute top-4 right-4 z-20"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        <AnimatePresence>
          {!isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-0"
            >
              {renderThumbnails()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

