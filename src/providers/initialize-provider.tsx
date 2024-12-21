"use client"

import { useEffect, useState } from "react"
import { useLoadingStore } from "@/store/loading-store"
import { useInitializeApp } from "@/hooks/use-initialize-app"
import { LoadingScreen } from "@/components/core/loading-screen"

export function InitializeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { isInitializing, isReady } = useLoadingStore()
  const [shouldRenderContent, setShouldRenderContent] = useState(false)
  useInitializeApp()

  useEffect(() => {
    // Si no está inicializando, preparar el contenido para renderizar
    if (!isInitializing) {
      // Pequeño delay para asegurar una transición suave
      const timer = setTimeout(() => {
        setShouldRenderContent(true)
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setShouldRenderContent(false)
    }
  }, [isInitializing])

  return (
    <div className="min-h-screen bg-background">
      {/* La pantalla de carga siempre se monta primero */}
      <LoadingScreen />

      {/* El contenido principal solo se monta cuando shouldRenderContent es true */}
      {shouldRenderContent && (
        <div
          className="transition-opacity duration-300 min-h-screen"
          style={{
            opacity: shouldRenderContent ? 1 : 0,
            pointerEvents: shouldRenderContent ? 'auto' : 'none'
          }}
        >
          {children}
        </div>
      )}
    </div>
  )
}