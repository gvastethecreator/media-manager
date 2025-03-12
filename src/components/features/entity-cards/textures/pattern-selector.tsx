"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type React from "react";

interface SVGPattern {
	id: string;
	name: string;
	svg: string;
	renderSvg: (color: string) => React.ReactNode;
}

interface PatternSelectorProps {
	patterns: SVGPattern[];
	selectedPatternId?: string;
	color: string;
	onPatternSelect: (patternId: string) => void;
}

export function PatternSelector({
	patterns,
	selectedPatternId,
	color,
	onPatternSelect,
}: PatternSelectorProps) {
	return (
		<div className="space-y-2">
			<Label htmlFor="pattern-type">Tipo de Patrón</Label>
			<div className="grid grid-cols-3 gap-2">
				{patterns.map((pattern) => (
					<Button
						key={pattern.id}
						type="button"
						variant={selectedPatternId === pattern.id ? "default" : "outline"}
						className="aspect-square p-0 flex items-center justify-center"
						onClick={() => onPatternSelect(pattern.id)}
					>
						<div className="w-full h-full">
							{pattern.renderSvg(color || "#000000")}
						</div>
					</Button>
				))}
			</div>
		</div>
	);
}
