import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/providers/theme-provider';
import { QueryProvider } from '@/providers/query-provider';
import { InitializeProvider } from '@/providers/initialize-provider';
import { Toaster } from "@/components/ui/toaster";
import { LoadingScreen } from '@/components/core/loading-screen';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Image Manager',
  description: 'Administrador de imágenes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={cn(
        inter.className,
        "min-h-screen bg-background text-foreground antialiased",
        "selection:bg-primary selection:text-primary-foreground"
      )}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <InitializeProvider>
              <LoadingScreen />
              {children}
            </InitializeProvider>
            <Toaster />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
