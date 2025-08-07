import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';

// Test component to verify context menu functionality
export function ContextMenuTest() {
	return (
		<div className="p-8">
			<h1 className="mb-4 font-bold text-2xl">Context Menu Test</h1>

			<ContextMenu>
				<ContextMenuTrigger asChild>
					<div className="flex h-32 w-32 cursor-pointer items-center justify-center rounded-lg bg-blue-500 text-white">
						Right-click me!
					</div>
				</ContextMenuTrigger>
				<ContextMenuContent>
					<ContextMenuItem>Test Item 1</ContextMenuItem>
					<ContextMenuItem>Test Item 2</ContextMenuItem>
					<ContextMenuItem>Test Item 3</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>
		</div>
	);
}
