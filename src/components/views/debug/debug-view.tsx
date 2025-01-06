"use client";

import { useEffect, useState } from "react";
import { ViewProps } from "../types";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "motion/react";
import { cn, formatBytes } from "@/lib/utils";
import { Bug, Folder, LoaderPinwheel, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFolders } from "@/services/folder.service";
import { toast } from "sonner";
import { LoadingScreen } from "@/components/core/feedback";
import { EmptyState } from "@/components/core/data-display";


export function DebugView() {
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	if (error) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-destructive">Error: {error}</p>
			</div>
		);
	}

	if (isLoading) {
		return <LoadingScreen />;
	}


	return (
		<ScrollArea className="h-full w-full">
			<div className="p-6">
				Debug view
			</div>
		</ScrollArea>
	);
}
