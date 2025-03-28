'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

interface BottomPanelProps {
	className?: string;
}

export function BottomPanel({ className }: BottomPanelProps) {
	return <div className={cn(className)}></div>;
}
