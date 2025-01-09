"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { InitializeProvider } from "@/providers/initialize-provider";
import { CacheProvider } from "@/providers/cache-provider";

export function AppProvider({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="dark"
			enableSystem={false}
			disableTransitionOnChange
		>
			<CacheProvider>
				<InitializeProvider>
					<Toaster position="bottom-right" richColors closeButton />
					{children}
				</InitializeProvider>
			</CacheProvider>
		</ThemeProvider>
	);
}
