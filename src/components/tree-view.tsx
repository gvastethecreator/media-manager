'use client';

import { ChevronRight, File, Folder, FolderOpen } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { AnimatePresence, motion } from '@/components/ui/motion-shim';
import { cn } from '@/lib/utils';

// Types
export type TreeNode = {
	id: string;
	label: string;
	icon?: React.ReactNode;
	children?: TreeNode[];
	data?: any;
};

export type TreeViewProps = {
	data: TreeNode[];
	className?: string;
	onNodeClick?: (node: TreeNode) => void;
	onNodeExpand?: (nodeId: string, expanded: boolean) => void;
	defaultExpandedIds?: string[];
	showLines?: boolean;
	showIcons?: boolean;
	selectable?: boolean;
	multiSelect?: boolean;
	selectedIds?: string[];
	onSelectionChange?: (selectedIds: string[]) => void;
	indent?: number;
	animateExpand?: boolean;
};

// Main TreeView component
export function TreeView({
	data,
	className,
	onNodeClick,
	onNodeExpand,
	defaultExpandedIds = [],
	showLines = true,
	showIcons = true,
	selectable = true,
	multiSelect = false,
	selectedIds = [],
	onSelectionChange,
	indent = 20,
	animateExpand = true,
}: TreeViewProps) {
	const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(defaultExpandedIds));
	const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>(selectedIds);

	const isControlled = selectedIds !== undefined && onSelectionChange !== undefined;
	const currentSelectedIds = isControlled ? selectedIds : internalSelectedIds;

	const toggleExpanded = useCallback(
		(nodeId: string) => {
			setExpandedIds((prev) => {
				const newSet = new Set(prev);
				const isExpanded = newSet.has(nodeId);
				isExpanded ? newSet.delete(nodeId) : newSet.add(nodeId);
				onNodeExpand?.(nodeId, !isExpanded);
				return newSet;
			});
		},
		[onNodeExpand]
	);

	const handleSelection = useCallback(
		(nodeId: string, ctrlKey = false) => {
			if (!selectable) {
				return;
			}

			let newSelection: string[];

			if (multiSelect && ctrlKey) {
				newSelection = currentSelectedIds.includes(nodeId)
					? currentSelectedIds.filter((id) => id !== nodeId)
					: [...currentSelectedIds, nodeId];
			} else {
				newSelection = currentSelectedIds.includes(nodeId) ? [] : [nodeId];
			}

			isControlled ? onSelectionChange?.(newSelection) : setInternalSelectedIds(newSelection);
		},
		[selectable, multiSelect, currentSelectedIds, isControlled, onSelectionChange]
	);

	const renderNode = (node: TreeNode, level = 0, isLast = false, parentPath: boolean[] = []) => {
		const hasChildren = (node.children?.length ?? 0) > 0;
		const isExpanded = expandedIds.has(node.id);
		const isSelected = currentSelectedIds.includes(node.id);
		const currentPath = [...parentPath, isLast];

		const getDefaultIcon = () =>
			hasChildren ? (
				isExpanded ? (
					<FolderOpen className="h-3 w-3" />
				) : (
					<Folder className="h-3 w-3" />
				)
			) : (
				<File className="h-3 w-3" />
			);

		return (
			<div className="select-none" key={node.id}>
				<motion.div
					className={cn(
						'group relative flex cursor-pointer items-center rounded-sm px-2 py-1 transition-all duration-200',
						'hover:bg-accent/30',
						isSelected && 'bg-accent/60',
						selectable && 'hover:border-accent-foreground/10'
					)}
					onClick={(e) => {
						if (hasChildren) {
							toggleExpanded(node.id);
						}
						handleSelection(node.id, e.ctrlKey || e.metaKey);
						onNodeClick?.(node);
					}}
					style={{ paddingLeft: level * indent + 4 }}
					whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
				>
					{/* Tree Lines */}
					{showLines && level > 0 && (
						<div className="pointer-events-none absolute top-0 bottom-0 left-0">
							{currentPath.map((isLastInPath, pathIndex) => (
								<div
									className="absolute top-0 bottom-0 border-border/40 border-l"
									key={`${node.id}-path-${pathIndex}-${level}`}
									style={{
										left: pathIndex * indent + 12,
										display: pathIndex === currentPath.length - 1 && isLastInPath ? 'none' : 'block',
									}}
								/>
							))}
							<div
								className="absolute top-1/2 border-border/40 border-t"
								style={{
									left: (level - 1) * indent + 12,
									width: indent - 4,
									transform: 'translateY(-1px)',
								}}
							/>
							{isLast && (
								<div
									className="absolute top-0 border-border/40 border-l"
									style={{
										left: (level - 1) * indent + 12,
										height: '50%',
									}}
								/>
							)}
						</div>
					)}

					{/* Expand Icon */}
					<motion.div
						animate={{ rotate: hasChildren && isExpanded ? 90 : 0 }}
						className="mr-1 flex h-3 w-3 items-center justify-center"
						transition={{ duration: 0.2, ease: 'easeInOut' }}
					>
						{hasChildren && <ChevronRight className="h-2.5 w-2.5 text-muted-foreground" />}
					</motion.div>

					{/* Node Icon */}
					{showIcons && (
						<motion.div
							className="mr-1.5 flex h-3 w-3 items-center justify-center text-muted-foreground"
							transition={{ duration: 0.15 }}
							whileHover={{ scale: 1.1 }}
						>
							{node.icon || getDefaultIcon()}
						</motion.div>
					)}

					{/* Label */}
					<span className="flex-1 truncate font-medium text-xs">{node.label}</span>
				</motion.div>

				{/* Children */}
				<AnimatePresence>
					{hasChildren && isExpanded && (
						<motion.div
							animate={{ height: 'auto', opacity: 1 }}
							className="overflow-hidden"
							exit={{ height: 0, opacity: 0 }}
							initial={{ height: 0, opacity: 0 }}
							transition={{
								duration: animateExpand ? 0.3 : 0,
								ease: 'easeInOut',
							}}
						>
							<motion.div
								animate={{ y: 0 }}
								exit={{ y: -10 }}
								initial={{ y: -10 }}
								transition={{
									duration: animateExpand ? 0.2 : 0,
									delay: animateExpand ? 0.1 : 0,
								}}
							>
								{(node.children || []).map((child, index) =>
									renderNode(child, level + 1, index === (node.children || []).length - 1, currentPath)
								)}
							</motion.div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		);
	};

	return (
		<motion.div
			animate={{ opacity: 1, y: 0 }}
			className={cn('w-full bg-background', className)}
			initial={{ opacity: 0, y: 5 }}
			transition={{ duration: 0.2, ease: 'easeOut' }}
		>
			<div className="p-0">{data.map((node, index) => renderNode(node, 0, index === data.length - 1))}</div>
		</motion.div>
	);
}
