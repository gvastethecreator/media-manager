"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo, useState } from "react";
import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export function PickerExample() {
	const [background, setBackground] = useState("#B4D455");

	return (
		<div
			className="w-full h-full preview flex min-h-[350px] justify-center p-10 items-center rounded !bg-cover !bg-center transition-all"
			style={{ background }}
		>
			<GradientPicker background={background} setBackground={setBackground} />
		</div>
	);
}

export function GradientPicker({
	background,
	setBackground,
	className,
}: {
	background: string;
	setBackground: (background: string) => void;
	className?: string;
}) {
	const solids = [
		"#E2E2E2",
		"#ff75c3",
		"#ffa647",
		"#ffe83f",
		"#9fff5b",
		"#70e2ff",
		"#cd93ff",
		"#09203f",
	];

	const gradients = [
		"linear-gradient(to top left,#accbee,#e7f0fd)",
		"linear-gradient(to top left,#d5d4d0,#d5d4d0,#eeeeec)",
		"linear-gradient(to top left,#000000,#434343)",
		"linear-gradient(to top left,#09203f,#537895)",
		"linear-gradient(to top left,#AC32E4,#7918F2,#4801FF)",
		"linear-gradient(to top left,#f953c6,#b91d73)",
		"linear-gradient(to top left,#ee0979,#ff6a00)",
		"linear-gradient(to top left,#F00000,#DC281E)",
		"linear-gradient(to top left,#00c6ff,#0072ff)",
		"linear-gradient(to top left,#4facfe,#00f2fe)",
		"linear-gradient(to top left,#0ba360,#3cba92)",
		"linear-gradient(to top left,#FDFC47,#24FE41)",
		"linear-gradient(to top left,#8a2be2,#0000cd,#228b22,#ccff00)",
		"linear-gradient(to top left,#40E0D0,#FF8C00,#FF0080)",
		"linear-gradient(to top left,#fcc5e4,#fda34b,#ff7882,#c8699e,#7046aa,#0c1db8,#020f75)",
		"linear-gradient(to top left,#ff75c3,#ffa647,#ffe83f,#9fff5b,#70e2ff,#cd93ff)",
	];

	const defaultTab = useMemo(() => {
		if (background.includes("url")) return "image";
		if (background.includes("gradient")) return "gradient";
		return "solid";
	}, [background]);

	return (
		<div className="flex items-center gap-2">
			<Tabs defaultValue={defaultTab} className="w-full">
				<TabsList className="w-full mb-4 text-xs">
					<TabsTrigger className="flex-1" value="solid">
						Solid
					</TabsTrigger>
					<TabsTrigger className="flex-1" value="gradient">
						Gradient
					</TabsTrigger>
				</TabsList>

				<TabsContent value="solid" className="flex flex-wrap gap-1 mt-0">
					{solids.map((s) => (
						<div
							key={s}
							style={{ background: s }}
							className="rounded-md h-6 w-6 cursor-pointer active:scale-105"
							onClick={() => setBackground(s)}
						/>
					))}
				</TabsContent>

				<TabsContent value="gradient" className="mt-0">
					<div className="flex flex-wrap gap-1 mb-2">
						{gradients.map((s) => (
							<div
								key={s}
								style={{ background: s }}
								className="rounded-md h-6 w-6 cursor-pointer active:scale-105"
								onClick={() => setBackground(s)}
							/>
						))}
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}

const GradientButton = ({
	background,
	children,
}: {
	background: string;
	children: React.ReactNode;
}) => {
	return (
		<div
			className="p-0.5 rounded-md relative !bg-cover !bg-center transition-all"
			style={{ background }}
		>
			<div className="bg-popover/80 rounded-md p-1 text-xs text-center">
				{children}
			</div>
		</div>
	);
};

interface ColorPickerProps {
	name: string;
	defaultValue?: string;
	onChange?: (value: string) => void;
	className?: string;
}

const COLORS = [
	"#ef4444",
	"#f97316",
	"#f59e0b",
	"#eab308",
	"#84cc16",
	"#22c55e",
	"#10b981",
	"#14b8a6",
	"#06b6d4",
	"#0ea5e9",
	"#3b82f6",
	"#6366f1",
	"#8b5cf6",
	"#a855f7",
	"#d946ef",
	"#ec4899",
	"#f43f5e",
];

export function ColorPicker({
	name,
	defaultValue = "#3b82f6",
	onChange,
	className,
}: ColorPickerProps) {
	const [color, setColor] = React.useState(defaultValue);

	const handleChange = (newColor: string) => {
		setColor(newColor);
		onChange?.(newColor);
	};

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					className={cn("w-[60px] p-0", className)}
					style={{ backgroundColor: color }}
				>
					<span className="sr-only">Elegir color</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-64">
				<div className="grid grid-cols-5 gap-2">
					{COLORS.map((c) => (
						<Button
							key={c}
							type="button"
							variant="outline"
							className="w-8 h-8 p-0"
							style={{ backgroundColor: c }}
							onClick={() => handleChange(c)}
						>
							<span className="sr-only">{c}</span>
						</Button>
					))}
				</div>
				<input type="hidden" name={name} value={color} />
			</PopoverContent>
		</Popover>
	);
}
