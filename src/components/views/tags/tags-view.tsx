"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { motion } from "motion/react";
import { useSettingsContext } from "@/context/settings-context";

export function TagsView() {
	const { settings, updateSettings } = useSettingsContext();

	return (
		<motion.div
			animate={{
				opacity: [0, 1],
				y: [20, 0],
			}}
		>
			<Card className="flex flex-col gap-2 bg-muted/30 rounded-sm">
				<CardHeader className="p-2">
					<CardTitle className="text-sm">Etiquetas</CardTitle>
				</CardHeader>
				<CardContent className="p-2">
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<Label htmlFor="tags" className="text-xs">
								Gestionar etiquetas
							</Label>
							<Switch
								id="tags"
								checked={settings.tags}
								onCheckedChange={(checked) => updateSettings({ tags: checked })}
							/>
						</div>
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
}
