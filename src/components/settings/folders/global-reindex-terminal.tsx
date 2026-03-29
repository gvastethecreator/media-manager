import { Maximize2, Minimize2, Terminal, X } from 'lucide-react';
import { useReindexStore } from '@/store/reindex.store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ReindexTerminal } from './reindex-terminal';
import { cn } from '@/lib/utils';
import { useState, useRef } from 'react';

export function GlobalReindexTerminal() {
	const { isOpen, isMinimized, toggleMinimized, close } = useReindexStore();

	// Guardamos el progreso localmente para mostrarlo en la píldora.
	const [localProgress, setLocalProgress] = useState(0);

	if (!isOpen) return null;

	return (
		<div
			className={cn(
				'fixed bottom-6 right-6 z-50 transition-all duration-300 ease-in-out',
				isMinimized ? 'w-auto h-auto' : 'w-150 h-100 max-w-[90vw] max-h-[80vh]'
			)}
		>
			<Card className="flex h-full w-full flex-col overflow-hidden border-border/50 bg-background/95 shadow-2xl backdrop-blur-md">
				{/* Controles de la ventana flotante */}
				<div className="flex items-center justify-between border-b border-border/30 bg-muted/40 px-3 py-2">
					<div className="flex items-center gap-2">
						<Terminal className="h-4 w-4 text-primary" />
						<span className="font-mono text-sm font-semibold">Terminal de Reindexado</span>
					</div>
					<div className="flex items-center gap-1">
						<Button
							variant="ghost"
							size="icon"
							className="h-6 w-6 rounded-sm opacity-70 hover:opacity-100"
							onClick={toggleMinimized}
						>
							{isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="h-6 w-6 rounded-sm opacity-70 hover:bg-destructive hover:text-destructive-foreground hover:opacity-100"
							onClick={() => close()}
						>
							<X className="h-3.5 w-3.5" />
						</Button>
					</div>
				</div>

				<div className={cn('relative flex-1', isMinimized && 'hidden')}>
					{/* Terminal real */}
					<ReindexTerminal
						className="h-full"
						isActive={true}
						showProgress={true}
						progress={localProgress}
						onProgressChange={setLocalProgress}
					/>
				</div>

				{isMinimized && (
					<div className="flex cursor-pointer items-center gap-3 px-4 py-3" onClick={toggleMinimized}>
						<div className="flex flex-col gap-1">
							<span className="font-mono text-xs font-medium text-emerald-500">Proceso en segundo plano...</span>
							<div className="flex items-center gap-2">
								<div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
									<div
										className="h-full rounded-full bg-primary transition-all duration-300"
										style={{ width: `${localProgress}%` }}
									/>
								</div>
								<span className="font-mono text-[10px] text-muted-foreground">{localProgress.toFixed(0)}%</span>
							</div>
						</div>
					</div>
				)}
			</Card>
		</div>
	);
}
