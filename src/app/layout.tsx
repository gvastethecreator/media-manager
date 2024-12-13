import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/migrate/components/theme-provider";
import { ProfileProvider } from "@/lib/contexts/profile-context";
import { FileProvider } from "@/lib/contexts/file-context";
import { SettingsProvider } from "@/lib/contexts/settings-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SettingsProvider>
            <FileProvider>
              <ProfileProvider>
                {children}
              </ProfileProvider>
            </FileProvider>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
