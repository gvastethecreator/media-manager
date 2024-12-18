'use client'

import { ThemeProvider } from './theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { ImageViewer } from '@/components/features/image-viewer/image-viewer'
import { SettingsProvider } from '@/context/settings-context'

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
      <SettingsProvider>
        {children}
        <ImageViewer />
        <Toaster />
      </SettingsProvider>
    </ThemeProvider>
  )
}