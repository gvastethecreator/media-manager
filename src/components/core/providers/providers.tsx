"use client";

import { ThemeProvider } from "./theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { ImageViewer } from "@/components/features/file-viewer/file-viewer";
import { SettingsProvider } from "@/context/settings-context";

interface ProvidersProps {
	children: React.ReactNode;
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
	);
}
