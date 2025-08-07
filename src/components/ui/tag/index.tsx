import { X } from 'lucide-react';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface TagInputContextValue {
	tags: string[];
	input: string;
	isFocused: boolean;
	addTag: (tag: string) => void;
	removeTag: (index: number) => void;
	handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	handleInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
	handleInputFocus: () => void;
	handleInputBlur: () => void;
	disabled: boolean;
}

const TagInputContext = React.createContext<TagInputContextValue | null>(null);

const useTagInput = () => {
	const context = React.useContext(TagInputContext);
	if (!context) {
		throw new Error('useTagInput must be used within a TagInputProvider');
	}
	return context;
};

export interface TagInputProps extends React.PropsWithChildren {
	value?: string[];
	defaultValue?: string[];
	onChange?: (tags: string[]) => void;
	placeholder?: string;
	className?: string;
	disabled?: boolean;
}

function TagInputProvider({ children, value, defaultValue = [], onChange, disabled = false }: TagInputProps) {
	const [tags, setTags] = React.useState<string[]>(value || defaultValue);
	const [input, setInput] = React.useState('');
	const [isFocused, setIsFocused] = React.useState(false);

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
			setInput('');
		}
	};

	const removeTag = (index: number) => {
		const newTags = tags.filter((_, i) => i !== index);
		setTags(newTags);
		onChange?.(newTags);
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInput(e.target.value);
	};

	const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			addTag(input);
		} else if (e.key === 'Backspace' && !input && tags.length > 0) {
			removeTag(tags.length - 1);
		}
	};

	const handleInputFocus = () => setIsFocused(true);
	const handleInputBlur = () => setIsFocused(false);

	const contextValue: TagInputContextValue = {
		tags,
		input,
		isFocused,
		addTag,
		removeTag,
		handleInputChange,
		handleInputKeyDown,
		handleInputFocus,
		handleInputBlur,
		disabled,
	};

	return <TagInputContext.Provider value={contextValue}>{children}</TagInputContext.Provider>;
}

const TagInputRoot = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => {
		const { isFocused, disabled } = useTagInput();
		return (
			<div
				className={cn(
					'flex flex-wrap items-center gap-2 rounded-md border border-input bg-background p-2 ring-offset-background',
					isFocused && 'outline-none ring-2 ring-ring ring-offset-2',
					disabled && 'cursor-not-allowed opacity-50',
					className
				)}
				ref={ref}
				{...props}
			/>
		);
	}
);
TagInputRoot.displayName = 'TagInputRoot';

const TagList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => {
		const { tags, removeTag, disabled } = useTagInput();
		return (
			<div className={cn('flex flex-wrap gap-2', className)} ref={ref} {...props}>
				{tags.map((tag, index) => (
					<Badge
						className={cn('px-2 py-1 text-xs', disabled && 'opacity-50')}
						key={`tag-${tag}-${index}`}
						variant="secondary"
					>
						{tag}
						{!disabled && (
							<button
								aria-label={`Remove ${tag}`}
								className="ml-1 rounded-full outline-none hover:bg-accent hover:text-destructive focus:ring-2 focus:ring-ring focus:ring-offset-2"
								onClick={() => removeTag(index)}
								type="button"
							>
								<X className="h-3 w-3" />
							</button>
						)}
					</Badge>
				))}
			</div>
		);
	}
);
TagList.displayName = 'TagList';

const TagInput = React.forwardRef<
	HTMLInputElement,
	Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'onKeyDown'>
>(({ className, placeholder, ...props }, ref) => {
	const { input, handleInputChange, handleInputKeyDown, handleInputFocus, handleInputBlur, disabled } = useTagInput();

	return (
		<Input
			className={cn('h-auto flex-1 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0', className)}
			disabled={disabled}
			onBlur={handleInputBlur}
			onChange={handleInputChange}
			onFocus={handleInputFocus}
			onKeyDown={handleInputKeyDown}
			placeholder={placeholder || 'Presiona Enter para agregar'}
			ref={ref}
			type="text"
			value={input}
			{...props}
		/>
	);
});
TagInput.displayName = 'TagInput';

export { TagInput, TagInputProvider, TagInputRoot, TagList, useTagInput };
