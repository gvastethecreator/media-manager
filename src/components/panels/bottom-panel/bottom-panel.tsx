import { cn } from '@/lib/utils';

interface BottomPanelProps {
	className?: string;
}

export function BottomPanel({ className }: BottomPanelProps) {
	return <div className={cn(className)} />;
}
