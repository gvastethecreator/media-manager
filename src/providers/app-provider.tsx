"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { CacheProvider } from "@/providers/cache-provider";
import { FileProvider } from "@/context/file-context";

export function AppProvider({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="dark"
			enableSystem={false}
			disableTransitionOnChange
		>
			<CacheProvider>
					<FileProvider>
						<Toaster position="bottom-right" richColors closeButton />
						{children}
					</FileProvider>
			</CacheProvider>
		</ThemeProvider>
	);
}
