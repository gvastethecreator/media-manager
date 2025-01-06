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


export function DevelopmentView() {



	return (
		<ScrollArea className="h-full w-full">
			<div className="p-6">
				Development view
			</div>
		</ScrollArea>
	);
}
