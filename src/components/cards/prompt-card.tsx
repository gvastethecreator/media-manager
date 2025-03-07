import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Prompt } from '@/types/entities';
import { MessageSquare, Pencil, Trash2 } from 'lucide-react';

interface PromptCardProps {
	prompt: Prompt;
	onEdit?: (id: string) => void;
	onDelete?: (id: string) => void;
}

export function PromptCard({ prompt, onEdit, onDelete }: PromptCardProps) {
	return (
		<Card className="relative group">
			<CardHeader className="p-4 pb-2">
				<CardTitle className="flex items-center justify-between text-sm">
					<div className="flex items-center gap-2">
						<MessageSquare className="h-4 w-4" />
						<span className="truncate">{prompt.name}</span>
					</div>
					<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
						{onEdit && (
							<Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(prompt.id)}>
								<Pencil className="h-4 w-4" />
							</Button>
						)}
						{onDelete && (
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 text-destructive"
								onClick={() => onDelete(prompt.id)}
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						)}
					</div>
				</CardTitle>
			</CardHeader>
			<CardContent className="p-4 pt-2">
				<div className="text-sm text-muted-foreground">{prompt.description}</div>
				<div className="mt-2 text-sm">
					<pre className="whitespace-pre-wrap font-mono text-xs bg-muted p-2 rounded-md">{prompt.content}</pre>
				</div>
				{prompt.tags && prompt.tags.length > 0 && (
					<div className="mt-2 flex flex-wrap gap-1">
						{prompt.tags.map((tag) => (
							<span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
								{tag}
							</span>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
