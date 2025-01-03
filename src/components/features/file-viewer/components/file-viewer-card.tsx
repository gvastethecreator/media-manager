import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { useInView } from 'react-intersection-observer'
import { motion, AnimatePresence } from 'framer-motion'

interface ImageCardProps {
  src: string
  alt: string
  width?: number
  height?: number
  priority?: boolean
  className?: string
  onClick?: () => void
}

export function ImageCard({
  src,
  alt,
  width = 300,
  height = 300,
  priority = false,
  className,
  onClick
}: ImageCardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [blurDataUrl, setBlurDataUrl] = useState<string | null>(null)
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: '50px 0px'
  })

  useEffect(() => {
    // Generar blur placeholder
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (ctx) {
      canvas.width = 40
      canvas.height = 40
      ctx.fillStyle = '#f3f4f6'
      ctx.fillRect(0, 0, 40, 40)
      setBlurDataUrl(canvas.toDataURL())
    }
  }, [])

  const handleError = () => {
    setError('Error al cargar la imagen')
    setIsLoading(false)
  }

  return (
    <div
      ref={ref}
      className={cn(
        'relative overflow-hidden rounded-lg bg-muted',
        className
      )}
      style={{ aspectRatio: width / height }}
    >
      {error ? (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          {error}
        </div>
      ) : (
        <>
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0"
              >
                <Skeleton className="h-full w-full" />
              </motion.div>
            )}
          </AnimatePresence>

          {(inView || priority) && (
            <Image
              src={src}
              alt={alt}
              width={width}
              height={height}
              className={cn(
                'object-cover transition-opacity duration-300',
                isLoading ? 'opacity-0' : 'opacity-100'
              )}
              onClick={onClick}
              priority={priority}
              quality={80}
              placeholder="blur"
              blurDataURL={blurDataUrl || undefined}
              onLoad={() => setIsLoading(false)}
              onError={handleError}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )}
        </>
      )}
    </div>
  )
}