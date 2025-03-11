"use client";

import { Button } from "@/components/ui/button";
import { useProfileContext } from "@/lib/contexts";
import { cn } from "@/lib/utils/utils";
import { Bug, Moon, Settings2, Sun } from "lucide-react";
import { motion } from "motion/react";
import { useTheme } from "next-themes";

interface NavPanelHeaderProps {
	totalImages: number;
	onOpenSettings: () => void;
	onOpenDevelopment: () => void;
}

export function NavPanelHeader({
	totalImages,
	onOpenSettings,
	onOpenDevelopment,
}: NavPanelHeaderProps) {
	const { settings } = useProfileContext();
	const { profiles = [], activeProfile } = settings;
	const activeProfileData = profiles.find((p) => p.id === activeProfile) ||
		profiles[0] || {
			name: "Default",
			emoji: "👤",
			color: "#3b82f6",
		};

	const { theme, setTheme } = useTheme();

	const handleThemeToggle = () => {
		setTheme(theme === "light" ? "dark" : "light");
	};

	return (
		<div className="flex flex-col bg-primary/5 py-2 border-b border-border/30">
			<div className="flex items-center justify-between gap-2">
				<motion.div
					initial={{ x: -10, opacity: 0 }}
					animate={{ x: 0, opacity: 1 }}
					transition={{ duration: 0.15 }}
					className="flex gap-2 items-center px-2"
				>
					<div
						className="flex items-center justify-center h-8 w-8 rounded-none shadow-sm"
						style={{ backgroundColor: activeProfileData?.color }}
					>
						<span className="text-xs font-medium">
							{activeProfileData?.emoji}
						</span>
					</div>
					<div className="flex flex-col">
						<span className="text-xs font-medium truncate">
							{activeProfileData?.name}
						</span>
						<div className="flex items-center">
							<span className="inline-flex items-center text-[10px] bg-secondary/50 px-1.5 rounded-sm text-muted-foreground">
								{totalImages} imágenes
							</span>
						</div>
					</div>
				</motion.div>

				<div className="flex items-center space-x-1 pr-2">
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7 rounded-none text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
						onClick={onOpenDevelopment}
					>
						<Bug className="h-3.5 w-3.5" />
					</Button>

					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7 rounded-none text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
						onClick={handleThemeToggle}
					>
						<motion.div
							initial={false}
							animate={{ rotate: theme === "light" ? 0 : 180 }}
							transition={{ duration: 0.15 }}
						>
							{theme === "light" ? (
								<Moon className="h-3.5 w-3.5" />
							) : (
								<Sun className="h-3.5 w-3.5" />
							)}
						</motion.div>
					</Button>

					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7 rounded-none text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
						onClick={onOpenSettings}
					>
						<Settings2 className="h-3.5 w-3.5" />
					</Button>
				</div>
			</div>
		</div>
	);
}
