import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/providers/theme-provider';
import { QueryProvider } from '@/providers/query-provider';
import { InitializeProvider } from '@/providers/initialize-provider';
import { Toaster } from "@/components/ui/toaster";
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
    <html lang="es" suppressHydrationWarning className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/app-logo.png" />
        <style>{`
          :root {
            color-scheme: dark;
          }
          body {
            background-color: rgb(9, 9, 11);
          }
        `}</style>
      </head>
      <body className={cn(
        inter.className,
        "min-h-screen bg-background text-foreground antialiased",
        "selection:bg-primary selection:text-primary-foreground"
      )}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <QueryProvider>
            <div className="relative min-h-screen">
              <InitializeProvider>
                {children}
              </InitializeProvider>
            </div>
            <Toaster />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
