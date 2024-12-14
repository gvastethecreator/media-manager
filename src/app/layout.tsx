import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { FilesProvider } from "@/context/FilesContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Image Manager",
  description: "A modern image management application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <FilesProvider>
            {children}
          </FilesProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
