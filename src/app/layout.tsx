import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Image Manager",
  description: "Administrador de imágenes",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning data-testid="root-layout">
      <body
        data-testid="main-body"
        className={cn(
        inter.className,
        "min-h-screen bg-background text-foreground antialiased",
        "selection:bg-primary selection:text-primary-foreground"
      )}>
        <main data-testid="main-content">
          {children}
        </main>
        <Toaster data-testid="toaster-container" />
      </body>
    </html>
  );
}
