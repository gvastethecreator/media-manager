'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MarkdownViewerProps {
	content: string;
	className?: string;
}

export function MarkdownViewer({ content, className }: MarkdownViewerProps) {
	return (
		<Card className={cn('h-full overflow-auto', className)}>
			<div className="prose prose-sm dark:prose-invert max-w-none p-6">
				<ReactMarkdown
					components={{
						h1: ({ children }) => <h1 className="mt-8 mb-4 font-bold text-3xl">{children}</h1>,
						h2: ({ children }) => <h2 className="mt-6 mb-3 font-bold text-2xl">{children}</h2>,
						h3: ({ children }) => <h3 className="mt-4 mb-2 font-bold text-xl">{children}</h3>,
						p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
						ul: ({ children }) => <ul className="mb-4 list-disc pl-6">{children}</ul>,
						ol: ({ children }) => <ol className="mb-4 list-decimal pl-6">{children}</ol>,
						li: ({ children }) => <li className="mb-1">{children}</li>,
						code: ({ children, className }) => {
							const isInline = !className;
							return isInline ? (
								<code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">{children}</code>
							) : (
								<pre className="mb-4 overflow-x-auto rounded-lg bg-muted p-4">
									<code className="font-mono text-sm">{children}</code>
								</pre>
							);
						},
						blockquote: ({ children }) => (
							<blockquote className="my-4 border-primary border-l-4 pl-4 italic">{children}</blockquote>
						),
						a: ({ children, href }) => (
							<a className="text-primary hover:underline" href={href} rel="noopener noreferrer" target="_blank">
								{children}
							</a>
						),
						table: ({ children }) => (
							<div className="mb-4 overflow-x-auto">
								<table className="min-w-full border-collapse border border-border">{children}</table>
							</div>
						),
						thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
						th: ({ children }) => (
							<th className="border border-border px-4 py-2 text-left font-semibold">{children}</th>
						),
						td: ({ children }) => <td className="border border-border px-4 py-2">{children}</td>,
						hr: () => <hr className="my-6 border-border" />,
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
