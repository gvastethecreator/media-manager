'use client'

import { ThemeProvider } from './theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { ImageViewer } from '@/components/image-viewer/image-viewer'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
      <Toaster />
      <ImageViewer />
    </ThemeProvider>
  )
}