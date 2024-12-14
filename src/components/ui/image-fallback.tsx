'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { ImageIcon } from "lucide-react"

export interface ImageFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackClassName?: string
  gradientColors?: string[]
  showPlaceholder?: boolean
}

export const ImageFallback = React.forwardRef<HTMLImageElement, ImageFallbackProps>(
  ({
    src,
    alt,
    className,
    fallbackClassName,
    gradientColors = ["#f6d365", "#fda085"],
    showPlaceholder = true,
    ...props
  }, ref) => {
    const [error, setError] = React.useState(false)
    const [loaded, setLoaded] = React.useState(false)
    const gradientId = React.useId()

    const handleError = () => {
      setError(true)
      setLoaded(false)
    }

    const handleLoad = () => {
      setLoaded(true)
    }

    const renderPlaceholder = () => (
      <div
        className={cn(
          "relative w-full h-full rounded-md overflow-hidden bg-muted/50",
          fallbackClassName
        )}
      >
        <svg
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          version="1.1"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient
              id={gradientId}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              {gradientColors.map((color, index) => (
                <stop
                  key={index}
                  offset={`${(index / (gradientColors.length - 1)) * 100}%`}
                  stopColor={color}
                />
              ))}
            </linearGradient>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill={`url(#${gradientId})`}
            opacity="0.5"
          />
        </svg>
        {showPlaceholder && (
          <ImageIcon
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-muted-foreground/20"
          />
        )}
      </div>
    )

    return (
      <div className={cn("relative w-full h-full", className)}>
        {!error && (
          <img
            ref={ref}
            src={src}
            alt={alt}
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
              !loaded && "opacity-0"
            )}
            onError={handleError}
            onLoad={handleLoad}
            {...props}
          />
        )}
        {(!loaded || error) && renderPlaceholder()}
      </div>
    )
  }
)

ImageFallback.displayName = "ImageFallback"