"use client";

import { useLoadingStore } from "@/store/loading-store";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import {
	CheckCircle2,
	XCircle,
	Loader2,
	Database,
	FolderOpen,
	Settings,
	Image,
	Laptop,
} from "lucide-react";

// Orden de inicialización de servicios
const SERVICE_ORDER = [
	"System",
	"Database",
	"Settings",
	"File System",
	"Thumbnails",
];

const SERVICE_ICONS: Record<string, React.ElementType> = {
	System: Laptop,
	Database: Database,
	Settings: Settings,
	"File System": FolderOpen,
	Thumbnails: Image,
};

const SERVICE_COLORS = {
	error: "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-500",
	success: "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-500",
	loading: "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-500",
	pending: "border-muted-foreground bg-muted/30 text-muted-foreground",
};

export function InitializationScreen() {
	const { services, progress, isInitializing } = useLoadingStore();

	// Ordenar servicios según el orden definido
	const orderedServices = [...services].sort(
		(a, b) => SERVICE_ORDER.indexOf(a.name) - SERVICE_ORDER.indexOf(b.name)
	);

	return (
		<AnimatePresence>
			{isInitializing && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
					transition={{ duration: 0.5 }}
					className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm"
				>
					<Card className="w-full max-w-lg border-none shadow-lg">
						<CardContent className="p-6">
							<motion.div
								className="space-y-4"
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.3 }}
							>
								<div className="space-y-2">
									<div className="flex justify-between text-sm">
										<motion.span
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											className="font-medium text-foreground"
										>
											Iniciando aplicación
										</motion.span>
										<motion.span
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											className="text-muted-foreground"
										>
											{progress}%
										</motion.span>
									</div>
									<Progress
										value={progress}
										className="h-2 transition-all duration-300"
									/>
								</div>

								<motion.div
									className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-5"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{ delay: 0.2 }}
								>
									{orderedServices.map((service, index) => {
										const ServiceIcon = SERVICE_ICONS[service.name] || Loader2;
										const colorClass = SERVICE_COLORS[service.status];

										return (
											<motion.div
												key={service.name}
												initial={{ scale: 0.8, opacity: 0 }}
												animate={{
													scale: 1,
													opacity: 1,
													transition: {
														delay: index * 0.1,
														duration: 0.3,
														ease: "easeOut",
													},
												}}
												className="flex flex-col items-center gap-3"
											>
												<motion.div
													className={cn(
														"relative flex h-16 w-16 items-center justify-center rounded-full border-2 transition-all duration-300",
														colorClass
													)}
													animate={{
														scale:
															service.status === "loading" ? [1, 1.05, 1] : 1,
													}}
													transition={{
														duration: 0.5,
														repeat: service.status === "loading" ? Infinity : 0,
													}}
												>
													<AnimatePresence mode="wait">
														{service.status === "success" && (
															<motion.div
																key="success"
																initial={{ scale: 0, opacity: 0 }}
																animate={{ scale: 1, opacity: 1 }}
																exit={{ scale: 0, opacity: 0 }}
																transition={{ type: "spring", damping: 15 }}
															>
																<CheckCircle2 className="h-8 w-8" />
															</motion.div>
														)}
														{service.status === "error" && (
															<motion.div
																key="error"
																initial={{ scale: 0, opacity: 0 }}
																animate={{ scale: 1, opacity: 1 }}
																exit={{ scale: 0, opacity: 0 }}
																transition={{ type: "spring", damping: 15 }}
															>
																<XCircle className="h-8 w-8" />
															</motion.div>
														)}
														{(service.status === "loading" ||
															service.status === "pending") && (
															<motion.div
																key="loading"
																initial={{ opacity: 0 }}
																animate={{ opacity: 1 }}
																exit={{ opacity: 0 }}
															>
																<ServiceIcon
																	className={cn(
																		"h-8 w-8",
																		service.status === "loading" &&
																			"animate-pulse"
																	)}
																/>
															</motion.div>
														)}
													</AnimatePresence>
												</motion.div>
												<motion.div
													className="flex flex-col items-center gap-1"
													initial={{ opacity: 0, y: 5 }}
													animate={{
														opacity: 1,
														y: 0,
														transition: {
															delay: index * 0.1 + 0.2,
															duration: 0.3,
														},
													}}
												>
													<span className="text-xs font-medium text-foreground">
														{service.name}
													</span>
													<span className="text-[10px] text-muted-foreground">
														{service.message}
													</span>
												</motion.div>
											</motion.div>
										);
									})}
								</motion.div>
							</motion.div>
						</CardContent>
					</Card>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
