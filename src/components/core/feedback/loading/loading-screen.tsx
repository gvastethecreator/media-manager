"use client";

import { motion } from "motion/react";
import { Loader2 } from "lucide-react";

interface LoadingScreenProps {
	message?: string;
}

export function LoadingScreen({ message = "Cargando..." }: LoadingScreenProps) {
	return (
		<motion.div
			className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50"
			animate={{ opacity: [0, 1] }}
		>
			<motion.div
				animate={{
					scale: [0.9, 1],
					opacity: [0, 1],
				}}
				className="flex flex-col items-center gap-4"
			>
				<Loader2 className="w-10 h-10 text-primary animate-spin" />
				<p className="text-sm text-muted-foreground animate-pulse">{message}</p>
			</motion.div>
		</motion.div>
	);
}
