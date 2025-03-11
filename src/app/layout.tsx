import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils/utils";
import { AppProvider } from "@/providers/app-provider";
import type React from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Image Manager",
	description: "Administrador de imágenes",
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
			<body
				className={cn(
					inter.className,
					"min-h-screen bg-background text-foreground antialiased",
					"selection:bg-primary selection:text-primary-foreground"
				)}
			>
				<AppProvider>
					<div className="relative min-h-screen w-full">{children}</div>
				</AppProvider>
			</body>
		</html>
	);
}
