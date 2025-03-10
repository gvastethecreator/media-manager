"use client";

import { Progress } from "@/components/ui/progress";
import { formatBytes } from "@/lib/utils";
import type { ExtendedProcessStatus } from "@/types/process";
import { motion } from "motion/react";

interface FolderProgressDetailsProps {
	status: ExtendedProcessStatus;
}

export function FolderProgressDetails({ status }: FolderProgressDetailsProps) {
	if (!status) {
		return null;
	}

	return (
		<motion.div
			initial={{ opacity: 0, height: 0 }}
			animate={{ opacity: 1, height: "auto" }}
			exit={{ opacity: 0, height: 0 }}
			className="mt-1 space-y-1"
		>
			{status.currentFile && (
				<div className="text-[10px] text-muted-foreground/75">
					<span className="truncate inline-block max-w-full">
						{status.currentFile}
					</span>
				</div>
			)}

			{status.filesProcessed !== undefined &&
				status.totalFiles !== undefined && (
					<div className="text-[10px] text-muted-foreground/75 flex justify-between">
						<span className="text-xs text-muted-foreground">
							{status.filesProcessed} / {status.totalFiles} archivos
						</span>
						{status.globalProgress?.current !== undefined && (
							<span>{formatBytes(status.globalProgress.current)}</span>
						)}
					</div>
				)}

			{status.extendedStats &&
				Object.keys(status.extendedStats.fileTypes).length > 0 && (
					<div className="text-[10px] text-muted-foreground/75 flex flex-wrap gap-1 mt-1">
						{Object.entries(status.extendedStats.fileTypes)
							.slice(0, 3)
							.map(([type, count]) => (
								<span key={type} className="bg-muted/50 px-1 rounded-sm">
									{type}: {count}
								</span>
							))}
						{Object.keys(status.extendedStats.fileTypes).length > 3 && (
							<span className="bg-muted/50 px-1 rounded-sm">
								+{Object.keys(status.extendedStats.fileTypes).length - 3} más
							</span>
						)}
					</div>
				)}

			{status.errors && status.errors.length > 0 && (
				<div className="text-[10px] text-destructive mt-1">
					{status.errors.length} errores encontrados
				</div>
			)}
		</motion.div>
	);
}
