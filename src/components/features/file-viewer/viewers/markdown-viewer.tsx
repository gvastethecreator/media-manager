'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MarkdownViewerProps {
	className?: string;
	content: string;
}

export function MarkdownViewer({ content, className }: MarkdownViewerProps) {
	return (
		<Card className={cn('h-full overflow-auto border border-border/50 bg-background/80 backdrop-blur-sm', className)}>
			<div className="prose prose-sm dark:prose-invert max-w-none p-6">
				<ReactMarkdown
					components={{
						h1: ({ children }) => (
							<h1 className="mt-8 mb-4 border-primary/30 border-b pb-2 font-bold text-3xl text-primary">{children}</h1>
						),
						h2: ({ children }) => <h2 className="mt-6 mb-3 font-bold text-2xl text-foreground/90">{children}</h2>,
						h3: ({ children }) => <h3 className="mt-4 mb-2 font-bold text-accent-foreground text-xl">{children}</h3>,
						p: ({ children }) => <p className="mb-4 text-foreground/80 leading-relaxed">{children}</p>,
						ul: ({ children }) => (
							<ul className="mb-4 list-disc space-y-1 pl-6 text-foreground/80 marker:text-primary">{children}</ul>
						),
						ol: ({ children }) => (
							<ol className="mb-4 list-decimal space-y-1 pl-6 text-foreground/80 marker:text-secondary">{children}</ol>
						),
						li: ({ children }) => <li className="mb-1">{children}</li>,
						strong: ({ children }) => <strong className="font-bold text-primary">{children}</strong>,
						em: ({ children }) => <em className="text-accent-foreground italic">{children}</em>,
						code: ({ children, className }) => {
							const isInline = !className;
							return isInline ? (
								<code className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-primary text-sm">{children}</code>
							) : (
								<pre className="mb-4 overflow-x-auto rounded-lg border border-border/50 bg-muted/50 p-4">
									<code className="font-mono text-foreground/90 text-sm">{children}</code>
								</pre>
							);
						},
						blockquote: ({ children }) => (
							<blockquote className="my-4 rounded-r-md border-accent border-l-4 bg-accent/10 p-3 text-foreground/70 italic">
								{children}
							</blockquote>
						),
						a: ({ children, href }) => (
							<a
								className="text-primary underline decoration-primary/30 underline-offset-2 transition-colors hover:text-primary/80 hover:decoration-primary"
								href={href}
								rel="noopener noreferrer"
								target="_blank"
							>
								{children}
							</a>
						),
						table: ({ children }) => (
							<div className="mb-4 overflow-x-auto rounded-lg border border-border/50">
								<table className="min-w-full border-collapse">{children}</table>
							</div>
						),
						thead: ({ children }) => <thead className="bg-muted/80 text-foreground/90">{children}</thead>,
						th: ({ children }) => (
							<th className="border-border/50 border-b px-4 py-2 text-left font-semibold">{children}</th>
						),
						td: ({ children }) => <td className="border-border/30 border-b px-4 py-2">{children}</td>,
						hr: () => <hr className="my-6 border-border/50" />,
					}}
					remarkPlugins={[remarkGfm]}
				>
					{content}
				</ReactMarkdown>
			</div>
		</Card>
	);
}

export default MarkdownViewer;
