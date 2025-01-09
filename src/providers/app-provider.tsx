"use client";

import { ThemeProvider } from "./theme-provider";
import { QueryProvider } from "./query-provider";
import { InitializeProvider } from "./initialize-provider";
import { Toaster } from "@/components/ui/toaster";
import { ImageViewer } from "@/components/features/file-viewer/file-viewer";
import { SettingsProvider } from "@/context/settings-context";
import { FilesProvider } from "@/context/file-context";

interface AppProviderProps {
	children: React.ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
		>
			<QueryProvider>
				<SettingsProvider>
					<InitializeProvider>
						<FilesProvider>
								{children}
								<ImageViewer />
								<Toaster />
						</FilesProvider>
					</InitializeProvider>
				</SettingsProvider>
			</QueryProvider>
		</ThemeProvider>
	);
}
