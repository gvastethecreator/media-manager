"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface TagInputProps {
	value?: string[];
	defaultValue?: string[];
	onChange?: (tags: string[]) => void;
	placeholder?: string;
	className?: string;
	disabled?: boolean;
}

export function TagInput({
	value,
	defaultValue = [],
	onChange,
	placeholder = "Presiona Enter para agregar",
	className,
	disabled = false,
}: TagInputProps) {
	const [tags, setTags] = React.useState<string[]>(value || defaultValue);
	const [input, setInput] = React.useState("");

	React.useEffect(() => {
		if (value) {
			setTags(value);
		}
	}, [value]);

	const addTag = (tag: string) => {
		const trimmedTag = tag.trim();
		if (trimmedTag && !tags.includes(trimmedTag)) {
			const newTags = [...tags, trimmedTag];
			setTags(newTags);
			onChange?.(newTags);
		}
	};

	const removeTag = (index: number) => {
		const newTags = tags.filter((_, i) => i !== index);
		setTags(newTags);
		onChange?.(newTags);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			addTag(input);
			setInput("");
		} else if (e.key === "Backspace" && !input && tags.length > 0) {
			removeTag(tags.length - 1);
		}
	};

	return (
		<div className={cn("space-y-2", className)}>
			<div className="flex flex-wrap gap-2">
				{tags.map((tag, index) => (
					<Badge
						key={index}
						variant="secondary"
						className={cn(
							"px-2 py-1 text-xs",
							disabled && "opacity-50 cursor-not-allowed"
						)}
					>
						{tag}
						{!disabled && (
							<button
								type="button"
								onClick={() => removeTag(index)}
								className="ml-1 hover:text-destructive"
							>
								<X className="h-3 w-3" />
							</button>
						)}
					</Badge>
				))}
			</div>
			{!disabled && (
				<Input
					type="text"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder={placeholder}
					className="h-8 text-sm"
				/>
			)}
		</div>
	);
}
