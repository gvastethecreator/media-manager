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

const SERVICE_ICONS: Record<string, React.ElementType> = {
	Database: Database,
	"File System": FolderOpen,
	Settings: Settings,
	Thumbnails: Image,
	System: Laptop,
};

export function InitializationScreen() {
	const { services, progress, isInitializing } = useLoadingStore();

	return (
		<AnimatePresence>
			{isInitializing && (
				<motion.div
					initial={{ opacity: 0, top: "0px" }}
					animate={{ opacity: 1, top: "0px"}}
					exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
					transition={{ duration: 1.3 }}
					className="fixed inset-0 z-[9999] flex items-center justify-center"
				>
					<Card className="w-full max-w-lg border-none">
						<CardContent>
							<motion.div
								className="space-y-2"
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.25 }}
							>
								<div className="flex justify-between text-sm text-muted-foreground">
									<span>Iniciando aplicación</span>
									<span>{progress}%</span>
								</div>
								<Progress value={progress} className="h-2" />
							</motion.div>

							<motion.div
								className="mt-8 flex justify-center gap-6 flex-wrap"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 0.2 }}
							>
								{services.map((service, index) => {
									const ServiceIcon = SERVICE_ICONS[service.name] || Loader2;

									return (
										<motion.div
											key={service.name}
											initial={{ scale: 0.8, opacity: 0 }}
											animate={{
												scale: 1,
												opacity: 1,
												transition: {
													delay: index * 0.15,
													duration: 0.3,
													ease: "easeOut",
												},
											}}
											className="flex flex-col items-center gap-2"
										>
											<motion.div
												className={cn(
													"relative flex h-16 w-16 items-center justify-center rounded-full border-2 transition-all duration-500",
													service.status === "error" &&
														"border-red-500 bg-red-50 dark:bg-red-950/30",
													service.status === "success" &&
														"border-green-500 bg-green-50 dark:bg-green-950/30",
													(service.status === "loading" ||
														service.status === "pending") &&
														"border-muted-foreground bg-muted/30"
												)}
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
															<CheckCircle2 className="h-8 w-8 text-green-500" />
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
															<XCircle className="h-8 w-8 text-red-500" />
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
																	"h-8 w-8 text-muted-foreground",
																	service.status === "loading" && "animate-spin"
																)}
															/>
														</motion.div>
													)}
												</AnimatePresence>
											</motion.div>
											<motion.span
												initial={{ opacity: 0, y: 5 }}
												animate={{
													opacity: 1,
													y: 0,
													transition: {
														delay: index * 0.15 + 0.2,
														duration: 0.3,
													},
												}}
												className="text-[8px] font-medium text-muted-foreground"
											>
												{service.name}
											</motion.span>
										</motion.div>
									);
								})}
							</motion.div>
						</CardContent>
					</Card>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
